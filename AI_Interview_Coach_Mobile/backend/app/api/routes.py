from fastapi import APIRouter, Header, HTTPException

from app.schemas.interview import (
    AuthRequest,
    AuthResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    InterviewContext,
    ProgressResponse,
    SessionHistoryItem,
    SessionResponse,
    StartSessionRequest,
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
)
from app.services.evaluator import evaluate_answer, generate_follow_up_question, generate_question
from app.services.rubrics import RubricsEngine
from app.services.storage import (
    authenticate_user,
    create_session,
    delete_session,
    get_progress,
    get_session,
    get_session_history,
    get_user_by_token,
    register_user,
    save_chat_turn,
    save_final_evaluation,
)

router = APIRouter()
rubrics_engine = RubricsEngine()

INITIAL_TOPIC_QUESTION = (
    "Antes de empezar, dime sobre qué puesto o tipo de prueba quieres que vaya la entrevista."
)

NOISE_SNIPPETS = [
    "conversación previa de entrevista",
    "tema elegido por el candidato",
    "no especificada por el usuario",
    "sin definir por el usuario",
    "contexto pendiente",
]


def _get_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]
    return None


def _messages_to_transcript(messages: list[dict]) -> str:
    lines: list[str] = []
    for item in messages:
        role = item.get("role", "assistant")
        label = "Entrevistador" if role == "assistant" else "Candidato"
        content = item.get("content", "")
        lines.append(f"{label}: {content}")
    return "\n".join(lines)


def _clean_generated_question(raw: str) -> str:
    text = (raw or "").strip()
    if not text:
        return "¿Puedes ampliar tu enfoque con más detalle técnico?"

    lower = text.lower()
    for snippet in NOISE_SNIPPETS:
        marker_index = lower.find(snippet)
        if marker_index > 0:
            text = text[:marker_index].strip()
            lower = text.lower()

    text = " ".join(text.split())
    if len(text) > 260:
        text = text[:260].rstrip(" ,;:") + "..."

    return text or "¿Puedes ampliar tu enfoque con más detalle técnico?"


def _looks_noisy_or_generic(text: str) -> bool:
    cleaned = text.strip().lower()
    if len(cleaned) < 18:
        return True
    if any(snippet in cleaned for snippet in NOISE_SNIPPETS):
        return True
    return False


def _fallback_first_question(topic: str, level: str) -> str:
    return (
        f"Perfecto. Para una entrevista de nivel {level} sobre {topic}, "
        "¿cómo diseñarías la arquitectura inicial y qué 3 decisiones técnicas justificarías primero?"
    )


def _fallback_followup_question() -> str:
    return "Vale. ¿Qué riesgo técnico principal ves en tu propuesta y cómo lo mitigarías en producción?"


def _recent_transcript(messages: list[dict], max_messages: int = 6) -> str:
    trimmed = messages[-max_messages:]
    return _messages_to_transcript(trimmed)


@router.post("/auth/register", response_model=AuthResponse)
def register(payload: AuthRequest) -> AuthResponse:
    created = register_user(payload.email, payload.password)
    if not created:
        raise HTTPException(status_code=409, detail="Email already exists")
    return AuthResponse(**created)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest) -> AuthResponse:
    authenticated = authenticate_user(payload.email, payload.password)
    if not authenticated:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(**authenticated)


@router.get("/auth/me")
def me(authorization: str | None = Header(default=None)) -> dict:
    token = _get_token(authorization)
    if not token:
      raise HTTPException(status_code=401, detail="Missing token")
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


@router.post("/interviews/start", response_model=StartInterviewResponse)
def start_interview(payload: StartInterviewRequest) -> StartInterviewResponse:
    question = generate_question(payload.role, payload.level, payload.context)
    return StartInterviewResponse(question=question)


@router.post("/interviews/evaluate", response_model=EvaluateAnswerResponse)
def evaluate_interview_answer(payload: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    return evaluate_answer(payload)


@router.post("/sessions/start", response_model=SessionResponse)
def start_session(payload: StartSessionRequest, authorization: str | None = Header(default=None)) -> SessionResponse:
    token = _get_token(authorization)
    if token:
        user = get_user_by_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        if user["user_id"] != payload.user_id:
            raise HTTPException(status_code=403, detail="User mismatch")

    question = INITIAL_TOPIC_QUESTION
    created = create_session(
        user_id=payload.user_id,
        role=payload.role,
        level=payload.level,
        question=question,
        context=payload.context,
    )
    return SessionResponse(**created)


@router.post("/sessions/{session_id}/answer", response_model=SessionResponse)
def submit_session_answer(session_id: str, payload: SubmitAnswerRequest) -> SessionResponse:
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_messages = session["messages"]
    user_messages_count = len([m for m in current_messages if m.role == "user"])

    if user_messages_count == 0:
        # La primera respuesta define el tema real de la entrevista.
        topic = payload.answer.strip()
        new_context = session["context"].model_copy(
            update={
                "target_role": topic[:100],
                "summary": topic[:1000],
                "company": "",
            }
        )
        next_question = generate_question(topic[:50], session["level"], new_context)
        next_question = _clean_generated_question(next_question)
        if _looks_noisy_or_generic(next_question):
            next_question = _fallback_first_question(topic, session["level"])
        saved = save_chat_turn(session_id, payload.answer, next_question, context=new_context)
    else:
        transcript = _recent_transcript([m.model_dump() for m in current_messages])
        effective_role = session["context"].target_role or session["role"]
        next_question = generate_follow_up_question(
            effective_role,
            session["level"],
            session["context"],
            transcript,
            payload.answer,
        )
        next_question = _clean_generated_question(next_question)
        if _looks_noisy_or_generic(next_question):
            next_question = _fallback_followup_question()
        saved = save_chat_turn(session_id, payload.answer, next_question)

    if not saved:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(**saved)


@router.post("/sessions/{session_id}/evaluate", response_model=SessionResponse)
def evaluate_session(session_id: str) -> SessionResponse:
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    transcript = _messages_to_transcript([m.model_dump() for m in session["messages"]])
    if len(transcript.strip()) < 10:
        raise HTTPException(status_code=400, detail="No hay contenido suficiente para evaluar")

    evaluation = evaluate_answer(
        EvaluateAnswerRequest(
            role=session["role"],
            level=session["level"],
            question="Entrevista completa",
            answer=transcript,
            context=session["context"],
        )
    )

    saved = save_final_evaluation(session_id, evaluation)
    if not saved:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(**saved)


@router.delete("/sessions/{session_id}")
def remove_session(session_id: str, authorization: str | None = Header(default=None)) -> dict:
    token = _get_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    deleted = delete_session(session_id, user_id=user["user_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"deleted": True}


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_interview_session(session_id: str) -> SessionResponse:
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(**session)


@router.get("/progress/{user_id}", response_model=ProgressResponse)
def get_user_progress(user_id: str, authorization: str | None = Header(default=None)) -> ProgressResponse:
    token = _get_token(authorization)
    if token:
        user = get_user_by_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        if user["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="User mismatch")

    progress = get_progress(user_id)
    return ProgressResponse(**progress)


@router.get("/sessions/history/{user_id}", response_model=list[SessionHistoryItem])
def get_user_history(user_id: str, limit: int = 20, authorization: str | None = Header(default=None)) -> list[SessionHistoryItem]:
    token = _get_token(authorization)
    if token:
        user = get_user_by_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        if user["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="User mismatch")

    history = get_session_history(user_id, limit=limit)
    return [SessionHistoryItem(**item) for item in history]


@router.get("/rubrics")
def get_rubrics() -> dict:
    """Get available evaluation rubrics."""
    return rubrics_engine.to_dict()
