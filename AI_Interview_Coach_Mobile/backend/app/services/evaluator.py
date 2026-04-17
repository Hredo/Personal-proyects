import json
import re
import urllib.error
import urllib.request

from app.core.settings import settings
from app.schemas.interview import EvaluateAnswerRequest, EvaluateAnswerResponse, InterviewContext
from app.services.rubrics import RubricsEngine


# Initialize rubrics engine
rubrics_engine = RubricsEngine()

PLACEHOLDER_PATTERNS = [
    "sin definir por el usuario",
    "no especificada por el usuario",
    "contexto pendiente",
    "tema elegido por el candidato",
    "conversación previa de entrevista",
]


def _is_placeholder(value: str) -> bool:
    lowered = value.strip().lower()
    return any(pattern in lowered for pattern in PLACEHOLDER_PATTERNS)


def _clean_text(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        return ""
    if _is_placeholder(cleaned):
        return ""
    return cleaned


def _fallback_feedback(answer: str) -> EvaluateAnswerResponse:
    """Fallback evaluation when Gemini API is unavailable."""
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

    fields = [
        ("puesto objetivo", _clean_text(context.target_role)),
        ("empresa", _clean_text(context.company)),
        ("resumen", _clean_text(context.summary)),
        ("formación", _clean_text(context.education)),
        ("experiencia", _clean_text(context.experience)),
        ("tecnologías", _clean_text(context.technologies)),
        ("objetivos", _clean_text(context.goals)),
        ("notas", _clean_text(context.notes)),
    ]
    parts = [f"{label}: {value}" for label, value in fields if value and value.strip()]
    if not parts:
        return ""
    return "Contexto del candidato: " + "; ".join(parts) + "."


def _strip_json_wrappers(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _call_gemini(prompt: str, temperature: float) -> str:
    if not settings.gemini_api_key:
        raise ValueError("Missing Gemini API key")

    candidate_models = [
        settings.gemini_model,
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
    ]
    unique_models: list[str] = []
    for model in candidate_models:
        if model and model not in unique_models:
            unique_models.append(model)

    base_urls = [
        "https://generativelanguage.googleapis.com/v1beta/models",
        "https://generativelanguage.googleapis.com/v1/models",
    ]

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
        },
    }

    last_error: Exception | None = None
    for model in unique_models:
        for base_url in base_urls:
            url = f"{base_url}/{model}:generateContent?key={settings.gemini_api_key}"
            request = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    data = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                last_error = error
                # 404 suele indicar modelo/endpoint incorrecto; probar siguiente candidato.
                if error.code == 404:
                    continue
                raise ValueError(f"Gemini API error: {error.code}") from error
            except urllib.error.URLError as error:
                raise ValueError(f"Gemini API unavailable: {error.reason}") from error

            candidates = data.get("candidates") or []
            if not candidates:
                last_error = ValueError("Gemini API returned no candidates")
                continue

            content = candidates[0].get("content") or {}
            parts = content.get("parts") or []
            text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
            if text:
                return text.strip()

            last_error = ValueError("Gemini API returned empty text")

    if isinstance(last_error, urllib.error.HTTPError):
        raise ValueError(f"Gemini API error: {last_error.code}") from last_error
    if last_error:
        raise ValueError(str(last_error))
    raise ValueError("Gemini API unavailable")


def _fallback_question(role: str, level: str, context: InterviewContext | None) -> str:
    target_role = _clean_text(context.target_role if context else '') or role
    company = _clean_text(context.company if context else '')
    summary = _clean_text(context.summary if context else '')
    scope = f"para {company}" if company else "para esta posición"

    role_lower = target_role.lower()
    if any(keyword in role_lower for keyword in ['frontend', 'ui', 'ux']):
        return (
            f"En una entrevista de {target_role} nivel {level} {scope}, "
            "¿cómo estructurarías un rediseño completo de una pantalla crítica de producto y qué métricas usarías para validar impacto?"
        )
    if any(keyword in role_lower for keyword in ['backend', 'api', 'server']):
        return (
            f"En una entrevista de {target_role} nivel {level} {scope}, "
            "diseña una API para gestionar pedidos con alta concurrencia: ¿qué arquitectura, persistencia y estrategia de idempotencia elegirías y por qué?"
        )
    if any(keyword in role_lower for keyword in ['data', 'analyst', 'analista']):
        return (
            f"En una entrevista de {target_role} nivel {level} {scope}, "
            "¿cómo detectarías caída de conversión en un embudo y qué análisis harías para aislar la causa principal?"
        )
    if summary:
        return (
            f"Para {target_role} nivel {level}, basándote en este tema: {summary}. "
            "¿cómo lo resolverías de extremo a extremo y qué trade-offs técnicos priorizarías?"
        )
    return (
        f"Para {target_role} nivel {level}, "
        "cuéntame cómo resolverías un caso real de negocio de forma técnica y qué decisiones críticas defenderías en la entrevista."
    )


def generate_question(role: str, level: str, context: InterviewContext | None = None) -> str:
    context_prompt = _context_to_prompt(context)
    if not settings.gemini_api_key:
        return _fallback_question(role, level, context)

    prompt = (
        "Genera una unica pregunta tecnica de entrevista en espanol. "
        f"Rol: {role}. Nivel: {level}. {context_prompt} Maximo 35 palabras. "
        "La pregunta debe ser especifica, realista y coherente con el contexto del candidato. "
        "No menciones metadatos ni etiquetas como contexto, resumen, tema elegido o conversación previa. "
        "Responde solo con la pregunta, sin comillas ni explicaciones."
    )
    try:
        return _call_gemini(prompt, temperature=0.8)
    except ValueError:
        return _fallback_question(role, level, context)


def _fallback_follow_up_question(role: str, level: str, last_answer: str) -> str:
    answer = _clean_text(last_answer)
    if not answer:
        return f"En {role} nivel {level}, ¿qué enfoque técnico seguirías y por qué?"

    lowered = answer.lower()
    if any(token in lowered for token in ["api", "endpoint", "backend", "microservicio", "db", "base de datos"]):
        return "Bien. ¿Cómo asegurarías consistencia de datos e idempotencia en esa solución cuando haya reintentos y concurrencia alta?"
    if any(token in lowered for token in ["frontend", "ux", "ui", "react", "vista", "componente"]):
        return "Interesante. ¿Cómo medirías si ese cambio mejora la experiencia y qué experimento ejecutarías para validarlo?"
    if any(token in lowered for token in ["kpi", "métrica", "analítica", "datos", "embudo"]):
        return "Perfecto. ¿Qué hipótesis priorizarías primero y cómo distinguirías correlación de causalidad en tus resultados?"
    return "Buena base. ¿Qué riesgos técnicos ves en tu enfoque y qué plan aplicarías para mitigarlos en producción?"


def generate_follow_up_question(
    role: str,
    level: str,
    context: InterviewContext | None,
    transcript: str,
    last_answer: str,
) -> str:
    if not settings.gemini_api_key:
        return _fallback_follow_up_question(role, level, last_answer)

    prompt = (
        "Actúa como entrevistador técnico senior. "
        "Genera SOLO la siguiente pregunta, en español, breve y natural (máximo 30 palabras). "
        "NO repitas texto literal ni pegues conversación previa. "
        "NO menciones etiquetas como contexto, tema elegido o conversación previa. "
        f"Rol: {role}. Nivel: {level}. {_context_to_prompt(context)} "
        f"Última respuesta del candidato: {last_answer}. "
        f"Historial reciente:\n{transcript}\n"
        "Profundiza en un hueco técnico concreto de la última respuesta. "
        "Responde solamente con la pregunta final."
    )
    try:
        return _call_gemini(prompt, temperature=0.7)
    except ValueError:
        return _fallback_follow_up_question(role, level, last_answer)


def evaluate_answer(payload: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    if not settings.gemini_api_key:
        return _fallback_feedback(payload.answer)

    prompt = (
        "Evalua la respuesta del candidato para entrevista tecnica. "
        "Devuelve JSON valido con estructura exacta: "
        '{"total_score": number, "strengths": string[], "improvements": string[]}.'
        "Puntua de 0 a 100 y da 3 fortalezas y 3 mejoras. "
        f"Rol: {payload.role}. Nivel: {payload.level}. "
        f"Pregunta: {payload.question}. Respuesta: {payload.answer}"
        + (f" Contexto adicional: {_context_to_prompt(payload.context)}" if payload.context else "")
        + " Responde solo con JSON valido, sin bloques de codigo, sin texto extra."
    )

    try:
        text = _call_gemini(prompt, temperature=0.2)
    except ValueError:
        return _fallback_feedback(payload.answer)

    try:
        parsed = json.loads(_strip_json_wrappers(text))
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
