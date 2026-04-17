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
from app.services.evaluator import evaluate_answer, generate_question
from app.services.rubrics import RubricsEngine
from app.services.storage import (
    authenticate_user,
    create_session,
    get_progress,
    get_session,
    get_session_history,
    get_user_by_token,
    register_user,
    save_answer,
)

router = APIRouter()
rubrics_engine = RubricsEngine()


def _get_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]
    return None


@router.post("/auth/register", response_model=AuthResponse)
def register(payload: AuthRequest) -> AuthResponse:
    created = register_user(payload.username, payload.password)
    if not created:
        raise HTTPException(status_code=409, detail="Username already exists")
    return AuthResponse(**created)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest) -> AuthResponse:
    authenticated = authenticate_user(payload.username, payload.password)
    if not authenticated:
        raise HTTPException(status_code=401, detail="Invalid username or password")
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

    question = generate_question(payload.role, payload.level, payload.context)
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

    evaluation = evaluate_answer(
        EvaluateAnswerRequest(
            role=session["role"],
            level=session["level"],
            question=session["question"],
            answer=payload.answer,
            context=session["context"],
        )
    )

    saved = save_answer(session_id, payload.answer, evaluation)
    if not saved:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(**saved)


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
