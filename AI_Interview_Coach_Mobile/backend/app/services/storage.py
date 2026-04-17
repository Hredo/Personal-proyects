import json
import hashlib
import hmac
import sqlite3
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import secrets

from app.schemas.interview import ChatMessage, EvaluateAnswerResponse, InterviewContext

DB_PATH = Path(__file__).resolve().parents[2] / "interview_coach.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login_at TEXT
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
            """
        )

        # Try to add competencies_json column if it doesn't exist (migration)
        try:
            conn.execute(
                "ALTER TABLE interview_sessions ADD COLUMN competencies_json TEXT"
            )
        except sqlite3.OperationalError:
            # Column already exists
            pass

        try:
            conn.execute(
                "ALTER TABLE interview_sessions ADD COLUMN context_json TEXT"
            )
        except sqlite3.OperationalError:
            pass

        try:
            conn.execute(
                "ALTER TABLE interview_sessions ADD COLUMN messages_json TEXT"
            )
        except sqlite3.OperationalError:
            pass

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS interview_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                level TEXT NOT NULL,
                context_json TEXT,
                messages_json TEXT,
                question TEXT NOT NULL,
                answer TEXT,
                total_score INTEGER,
                strengths_json TEXT,
                improvements_json TEXT,
                competencies_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        120_000,
    )
    return digest.hex()


def _create_token() -> str:
    return secrets.token_urlsafe(32)


def _default_context(role: str) -> InterviewContext:
    return InterviewContext(
        target_role=role or "",
        company="",
        summary="",
        notes="",
        education="",
        experience="",
        technologies="",
        goals="",
    )


def _load_context(raw_context: str | None, role: str) -> InterviewContext:
    if not raw_context:
        return _default_context(role)

    try:
        data = json.loads(raw_context)
    except json.JSONDecodeError:
        return _default_context(role)

    summary = (
        data.get("summary")
        or data.get("notes")
        or data.get("goals")
        or data.get("experience")
        or data.get("education")
        or ""
    )

    return InterviewContext(
        target_role=data.get("target_role") or "",
        company=data.get("company") or "",
        summary=summary,
        notes=data.get("notes") or "",
        education=data.get("education") or "",
        experience=data.get("experience") or "",
        technologies=data.get("technologies") or "",
        goals=data.get("goals") or "",
    )


def _default_messages(question: str) -> list[ChatMessage]:
    return [
        ChatMessage(
            role="assistant",
            title="Entrevistador",
            content=question,
        )
    ]


def _load_messages(raw_messages: str | None, question: str, answer: str | None) -> list[ChatMessage]:
    if raw_messages:
        try:
            data = json.loads(raw_messages)
            return [ChatMessage(**item) for item in data if isinstance(item, dict)]
        except Exception:
            pass

    messages = _default_messages(question)
    if answer:
        messages.append(
            ChatMessage(
                role="user",
                title="Candidato",
                content=answer,
            )
        )
    return messages


def _last_user_answer(messages: list[ChatMessage]) -> str | None:
    for message in reversed(messages):
        if message.role == "user":
            return message.content
    return None


def register_user(email: str, password: str) -> dict | None:
    normalized_email = _normalize_email(email)
    now = datetime.now(timezone.utc).isoformat()
    user_id = str(uuid.uuid4())
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)

    with _connect() as conn:
        existing = conn.execute(
            "SELECT user_id FROM users WHERE username = ?",
            (normalized_email,),
        ).fetchone()
        if existing:
            return None

        conn.execute(
            """
            INSERT INTO users (user_id, username, password_hash, password_salt, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, normalized_email, password_hash, salt, now),
        )

        token = _create_token()
        conn.execute(
            """
            INSERT INTO auth_tokens (token, user_id, created_at)
            VALUES (?, ?, ?)
            """,
            (token, user_id, now),
        )
        conn.execute(
            "UPDATE users SET last_login_at = ? WHERE user_id = ?",
            (now, user_id),
        )
        conn.commit()

    return {"user_id": user_id, "email": normalized_email, "token": token}


def authenticate_user(email: str, password: str) -> dict | None:
    normalized_email = _normalize_email(email)

    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (normalized_email,),
        ).fetchone()

        if not row:
            return None

        expected_hash = row["password_hash"]
        salt = row["password_salt"]
        provided_hash = _hash_password(password, salt)

        if not hmac.compare_digest(expected_hash, provided_hash):
            return None

        now = datetime.now(timezone.utc).isoformat()
        token = _create_token()
        conn.execute(
            "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, row["user_id"], now),
        )
        conn.execute(
            "UPDATE users SET last_login_at = ? WHERE user_id = ?",
            (now, row["user_id"]),
        )
        conn.commit()

    return {"user_id": row["user_id"], "email": row["username"], "token": token}


def get_user_by_token(token: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT u.user_id, u.username
            FROM auth_tokens t
            JOIN users u ON u.user_id = t.user_id
            WHERE t.token = ?
            """,
            (token,),
        ).fetchone()

    if not row:
        return None

    return {"user_id": row["user_id"], "email": row["username"]}


def create_session(user_id: str, role: str, level: str, question: str, context: InterviewContext | None) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    session_id = str(uuid.uuid4())
    resolved_context = context or _default_context(role)
    context_json = json.dumps(resolved_context.model_dump())
    messages = _default_messages(question)
    messages_json = json.dumps([m.model_dump() for m in messages])

    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO interview_sessions (
                session_id, user_id, role, level, context_json, messages_json, question, answer,
                total_score, strengths_json, improvements_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)
            """,
            (session_id, user_id, role, level, context_json, messages_json, question, now, now),
        )
        conn.commit()

    return {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "level": level,
        "context": resolved_context,
        "question": question,
        "answer": None,
        "total_score": None,
        "strengths": [],
        "improvements": [],
        "competencies": [],
        "messages": messages,
        "status": "pending",
    }


def delete_session(session_id: str, user_id: str | None = None) -> bool:
    with _connect() as conn:
        if user_id:
            cursor = conn.execute(
                "DELETE FROM interview_sessions WHERE session_id = ? AND user_id = ?",
                (session_id, user_id),
            )
        else:
            cursor = conn.execute(
                "DELETE FROM interview_sessions WHERE session_id = ?",
                (session_id,),
            )
        conn.commit()

    return cursor.rowcount > 0


def get_session(session_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM interview_sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()

    if not row:
        return None

    strengths = json.loads(row["strengths_json"]) if row["strengths_json"] else []
    competencies = json.loads(row["competencies_json"]) if row["competencies_json"] else []
    messages = _load_messages(row["messages_json"], row["question"], row["answer"])

    return {
        "session_id": row["session_id"],
        "user_id": row["user_id"],
        "role": row["role"],
        "level": row["level"],
        "context": _load_context(row["context_json"], row["role"]),
        "question": row["question"],
        "answer": _last_user_answer(messages),
        "total_score": row["total_score"],
        "strengths": strengths,
        "improvements": json.loads(row["improvements_json"]) if row["improvements_json"] else [],
        "competencies": competencies,
        "messages": messages,
        "status": "completed" if row["total_score"] is not None else "pending",
    }


def save_chat_turn(
    session_id: str,
    answer: str,
    next_question: str,
    context: InterviewContext | None = None,
) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()

    current = get_session(session_id)
    if not current:
        return None

    messages = list(current["messages"])
    messages.append(ChatMessage(role="user", title="Candidato", content=answer))
    messages.append(ChatMessage(role="assistant", title="Entrevistador", content=next_question))

    messages_json = json.dumps([m.model_dump() for m in messages])
    context_json = json.dumps(context.model_dump()) if context else None

    with _connect() as conn:
        if context_json:
            cursor = conn.execute(
                """
                UPDATE interview_sessions
                SET answer = ?, question = ?, context_json = ?, messages_json = ?, total_score = NULL,
                    strengths_json = NULL, improvements_json = NULL, competencies_json = NULL,
                    updated_at = ?
                WHERE session_id = ?
                """,
                (
                    answer,
                    next_question,
                    context_json,
                    messages_json,
                    now,
                    session_id,
                ),
            )
        else:
            cursor = conn.execute(
                """
                UPDATE interview_sessions
                SET answer = ?, question = ?, messages_json = ?, total_score = NULL,
                    strengths_json = NULL, improvements_json = NULL, competencies_json = NULL,
                    updated_at = ?
                WHERE session_id = ?
                """,
                (
                    answer,
                    next_question,
                    messages_json,
                    now,
                    session_id,
                ),
            )
        conn.commit()

    if cursor.rowcount == 0:
        return None

    return get_session(session_id)


def save_final_evaluation(session_id: str, evaluation: EvaluateAnswerResponse) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()

    with _connect() as conn:
        cursor = conn.execute(
            """
            UPDATE interview_sessions
            SET total_score = ?, strengths_json = ?, improvements_json = ?,
                competencies_json = ?, updated_at = ?
            WHERE session_id = ?
            """,
            (
                evaluation.total_score,
                json.dumps(evaluation.strengths),
                json.dumps(evaluation.improvements),
                json.dumps([c.model_dump() for c in evaluation.competencies]) if evaluation.competencies else "[]",
                now,
                session_id,
            ),
        )
        conn.commit()

    if cursor.rowcount == 0:
        return None

    return get_session(session_id)


def get_progress(user_id: str) -> dict:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT total_score, improvements_json
            FROM interview_sessions
            WHERE user_id = ? AND total_score IS NOT NULL
            ORDER BY updated_at DESC
            """,
            (user_id,),
        ).fetchall()

    if not rows:
        return {
            "user_id": user_id,
            "sessions_completed": 0,
            "average_score": 0.0,
            "latest_scores": [],
            "focus_areas": [],
        }

    scores = [int(row["total_score"]) for row in rows]
    improvements_counter: Counter[str] = Counter()

    for row in rows:
        raw_improvements = row["improvements_json"]
        if raw_improvements:
            for item in json.loads(raw_improvements):
                improvements_counter[item] += 1

    return {
        "user_id": user_id,
        "sessions_completed": len(scores),
        "average_score": round(sum(scores) / len(scores), 2),
        "latest_scores": scores[:5],
        "focus_areas": [item for item, _ in improvements_counter.most_common(3)],
    }


def get_session_history(user_id: str, limit: int = 20) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT session_id, user_id, role, level, context_json, question, answer, total_score, created_at, updated_at
            FROM interview_sessions
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()

    return [
        {
            "session_id": row["session_id"],
            "user_id": row["user_id"],
            "role": row["role"],
            "level": row["level"],
            "context": _load_context(row["context_json"], row["role"]),
            "question": row["question"],
            "answer": row["answer"],
            "total_score": row["total_score"],
            "status": "completed" if row["total_score"] is not None else "pending",
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]
