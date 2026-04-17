# AI Interview Coach API

API REST para generar preguntas y evaluar respuestas de entrevistas tecnicas.

## Requisitos

- Python 3.11+

## Configuracion

1. Crea y activa entorno virtual.
2. Instala dependencias:

```bash
pip install -r requirements.txt
```

3. Copia variables de entorno:

```bash
cp .env.example .env
```

4. Arranca la API:

```bash
uvicorn app.main:app --reload
```

## Endpoints

- `GET /health`
- `POST /api/interviews/start`
- `POST /api/interviews/evaluate`
- `POST /api/sessions/start`
- `POST /api/sessions/{session_id}/answer`
- `GET /api/sessions/{session_id}`
- `GET /api/progress/{user_id}`
