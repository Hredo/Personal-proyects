import json

from openai import OpenAI

from app.core.settings import settings
from app.schemas.interview import EvaluateAnswerRequest, EvaluateAnswerResponse, InterviewContext
from app.services.rubrics import RubricsEngine


# Initialize rubrics engine
rubrics_engine = RubricsEngine()


def _fallback_feedback(answer: str) -> EvaluateAnswerResponse:
    """Fallback evaluation when OpenAI API is unavailable."""
    eval_result = rubrics_engine.evaluate(answer)
    
    return EvaluateAnswerResponse(
        total_score=eval_result["total_score"],
        strengths=["Buena intencion de resolver el problema", "Estructura general comprensible"],
        improvements=[
            "Incluye complejidad temporal y espacial",
            "Anade casos borde y validaciones",
            "Explica trade-offs entre alternativas",
        ],
        competencies=[
            {
                "name": c["name"],
                "score": c["score"],
                "max_score": c["max_score"],
                "percentage": c["percentage"],
                "weight": c["weight"],
            }
            for c in eval_result["competencies"]
        ],
        feedback=eval_result["feedback"],
    )


def _context_to_prompt(context: InterviewContext | None) -> str:
    if not context:
        return ''

    return (
        f"Contexto del candidato: puesto objetivo {context.target_role}; empresa {context.company}; "
        f"formación {context.education}; experiencia {context.experience}; tecnologías {context.technologies}; "
        f"objetivos {context.goals}; notas {context.notes}."
    )


def generate_question(role: str, level: str, context: InterviewContext | None = None) -> str:
    context_prompt = _context_to_prompt(context)
    if not settings.openai_api_key:
        suffix = f" Basate en este contexto: {context.target_role}, {context.company}." if context else ""
        return f"Explica como disenarias un sistema de colas para una API {role} nivel {level}.{suffix}"

    client = OpenAI(api_key=settings.openai_api_key)

    completion = client.responses.create(
        model=settings.openai_model,
        input=(
            "Genera una unica pregunta tecnica de entrevista en espanol. "
            f"Rol: {role}. Nivel: {level}. {context_prompt} Maximo 35 palabras. "
            "La pregunta debe ser especifica, realista y coherente con el contexto del candidato."
        ),
        temperature=0.8,
    )
    return completion.output_text.strip()


def evaluate_answer(payload: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    if not settings.openai_api_key:
        return _fallback_feedback(payload.answer)

    client = OpenAI(api_key=settings.openai_api_key)

    prompt = (
        "Evalua la respuesta del candidato para entrevista tecnica. "
        "Devuelve JSON valido con estructura exacta: "
        '{"total_score": number, "strengths": string[], "improvements": string[]}.'
        "Puntua de 0 a 100 y da 3 fortalezas y 3 mejoras. "
        f"Rol: {payload.role}. Nivel: {payload.level}. "
        f"Pregunta: {payload.question}. Respuesta: {payload.answer}"
        + (f" Contexto adicional: {_context_to_prompt(payload.context)}" if payload.context else "")
    )

    completion = client.responses.create(
        model=settings.openai_model,
        input=prompt,
        temperature=0.2,
    )

    text = completion.output_text.strip()

    try:
        parsed = json.loads(text)
        # Ensure required fields exist
        if "total_score" not in parsed:
            parsed["total_score"] = 50
        if "strengths" not in parsed:
            parsed["strengths"] = ["Respuesta aceptada"]
        if "improvements" not in parsed:
            parsed["improvements"] = ["Considera expandir tu respuesta"]
        
        # Add competencies via rubrics evaluation
        eval_result = rubrics_engine.evaluate(payload.answer)
        parsed["competencies"] = [
            {
                "name": c["name"],
                "score": c["score"],
                "max_score": c["max_score"],
                "percentage": c["percentage"],
                "weight": c["weight"],
            }
            for c in eval_result["competencies"]
        ]
        parsed["feedback"] = eval_result["feedback"]
        
        return EvaluateAnswerResponse(**parsed)
    except Exception:
        return _fallback_feedback(payload.answer)
