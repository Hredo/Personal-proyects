from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=6, max_length=128)


class AuthResponse(BaseModel):
    user_id: str
    email: str
    token: str


class UserProfile(BaseModel):
    user_id: str
    email: str


class InterviewContext(BaseModel):
    target_role: str = Field(default='', max_length=100)
    company: str = Field(default='', max_length=120)
    summary: str = Field(default='', max_length=1000)
    notes: str = Field(default='', max_length=500)
    education: str = Field(default='', max_length=200)
    experience: str = Field(default='', max_length=200)
    technologies: str = Field(default='', max_length=200)
    goals: str = Field(default='', max_length=300)


class Competency(BaseModel):
    """Rubric-based competency score."""
    name: str
    score: int
    max_score: int = 25
    percentage: int
    weight: float


class StartInterviewRequest(BaseModel):
    role: str = Field(min_length=2, max_length=50)
    level: str = Field(min_length=2, max_length=20)
    context: InterviewContext | None = None


class StartInterviewResponse(BaseModel):
    question: str


class EvaluateAnswerRequest(BaseModel):
    role: str = Field(min_length=2, max_length=50)
    level: str = Field(min_length=2, max_length=20)
    question: str = Field(min_length=5)
    answer: str = Field(min_length=10)
    context: InterviewContext | None = None


class EvaluateAnswerResponse(BaseModel):
    total_score: int
    strengths: list[str]
    improvements: list[str]
    competencies: list[Competency] = Field(default_factory=list)
    feedback: str = ""


class ChatMessage(BaseModel):
    role: str = Field(min_length=3, max_length=20)
    title: str = Field(min_length=2, max_length=40)
    content: str = Field(min_length=1)


class StartSessionRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=80)
    role: str = Field(min_length=2, max_length=50)
    level: str = Field(min_length=2, max_length=20)
    context: InterviewContext | None = None


class SessionResponse(BaseModel):
    session_id: str
    user_id: str
    role: str
    level: str
    context: InterviewContext
    question: str
    answer: str | None
    total_score: int | None
    competencies: list[Competency] = Field(default_factory=list)
    strengths: list[str]
    improvements: list[str]
    messages: list[ChatMessage] = Field(default_factory=list)
    status: str


class SubmitAnswerRequest(BaseModel):
    answer: str = Field(min_length=2)


class ProgressResponse(BaseModel):
    user_id: str
    sessions_completed: int
    average_score: float
    latest_scores: list[int]
    focus_areas: list[str]


class SessionHistoryItem(BaseModel):
    session_id: str
    user_id: str
    role: str
    level: str
    context: InterviewContext
    question: str
    answer: str | None
    total_score: int | None
    status: str
    created_at: str
    updated_at: str


class DeleteSessionResponse(BaseModel):
    deleted: bool
