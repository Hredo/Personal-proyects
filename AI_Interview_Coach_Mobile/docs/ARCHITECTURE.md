# AI Interview Coach - Arquitectura Completa

## 📋 Descripción del Proyecto

Plataforma de preparación para entrevistas técnicas con evaluación de IA. Incluye web, móvil y backend con rúbricas estructuradas, dashboard de progreso y export a PDF.

## 🏗️ Arquitectura

```
AI_Interview_Coach_Mobile/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── api/
│   │   │   └── routes.py # Endpoints REST
│   │   ├── services/
│   │   │   ├── evaluator.py  # Evaluación con OpenAI + fallback
│   │   │   ├── rubrics.py    # Sistema de rúbricas
│   │   │   └── storage.py    # SQLite CRUD
│   │   ├── schemas/
│   │   │   └── interview.py  # Pydantic models
│   │   └── core/
│   │       └── settings.py   # Config
│   ├── requirements.txt
│   └── interview_coach.db    # SQLite local
│
├── frontend/             # Web React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── InterviewPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts        # Cliente HTTP
│   │   │   ├── types.ts      # TypeScript types
│   │   │   └── pdf.ts        # PDF generator
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/               # React Native + Expo
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── InterviewScreen.tsx
│   │   │   └── DashboardScreen.tsx
│   │   ├── components/
│   │   │   └── TabNavigation.tsx
│   │   └── lib/
│   │       ├── api.ts        # Cliente compartido
│   │       └── types.ts      # Tipos compartidos
│   ├── App.tsx
│   ├── app.json
│   └── package.json
│
└── docs/
    ├── roadmap.md
    └── architecture.md
```

## 🚀 Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.116.1
- **ASGI Server**: Uvicorn 0.35.0
- **Validación**: Pydantic 2.13.1
- **LLM**: OpenAI 1.99.1 (con fallback local)
- **Base de datos**: SQLite 3

### Frontend Web
- **Framework**: React 18.2.0
- **Bundler**: Vite 5.0.0
- **Lenguaje**: TypeScript 5.3.0
- **Gráficos**: Recharts 2.x
- **PDF**: jsPDF + html2canvas

### Mobile
- **Framework**: React Native 0.74.3
- **Plataforma**: Expo 51.0.14
- **Cliente HTTP**: Axios 1.6.0
- **Storage**: AsyncStorage

## 📡 API Endpoints

```
POST   /api/sessions/start                  # Iniciar sesión
POST   /api/sessions/{id}/answer            # Enviar respuesta
GET    /api/sessions/{id}                   # Obtener sesión
GET    /api/progress/{user_id}              # Obtener progreso
GET    /api/rubrics                         # Ver rúbricas disponibles
POST   /api/interviews/start                # Legacy: generar pregunta
POST   /api/interviews/evaluate             # Legacy: evaluar respuesta
```

## 🎯 Features Implementados

### ✅ MVP Web Completado
- [x] Home page con login simple
- [x] Pantalla de entrevista interactiva
- [x] Evaluación con rúbricas (4 competencias ponderadas)
- [x] Dashboard con gráficas de tendencias
- [x] Export a PDF
- [x] Persistencia en localStorage
- [x] Responsive design

### ✅ MVP Mobile Completado
- [x] Estructura React Native con Expo
- [x] Home screen con autenticación
- [x] Interview screen para responder
- [x] Dashboard screen con progreso
- [x] Tab navigation (Entrevista/Progreso)
- [x] AsyncStorage para persistencia
- [x] Compatible con iOS y Android

### ✅ Backend Producción
- [x] Sistema de sesiones persistentes (SQLite)
- [x] Evaluación con OpenAI + fallback scoring
- [x] Rúbricas estructuradas (pesos configurables)
- [x] Tracking de progreso por usuario
- [x] Migración de BD automática

## 🎨 Rúbricas de Evaluación

Cada respuesta se evalúa en 4 competencias (25 puntos cada una):

1. **Architecture & Design** (25%)
   - Diseño del sistema, patrones, escalabilidad
   
2. **Technical Complexity** (25%)
   - Profundidad técnica, conocimiento específico

3. **Communication** (25%)
   - Claridad de explicación, estructura

4. **Problem-Solving** (25%)
   - Solución óptima, manejo de edge cases

**Score Total**: Promedio ponderado (0-100)

## 📊 Base de Datos

### Tabla: `interview_sessions`
```sql
CREATE TABLE interview_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    level TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    total_score INTEGER,
    strengths_json TEXT,
    improvements_json TEXT,
    competencies_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

## 🔧 Configuración

### Backend (.env)
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

### Frontend Web (.env.local)
```env
VITE_API_URL=http://localhost:8000/api
```

### Mobile (Actualizar en src/lib/api.ts)
```typescript
const API_URL = 'http://192.168.1.X:8000/api'; // Cambiar IP local
```

## 🚀 Instalación y Uso

### Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Web
```bash
cd frontend
npm install
npm run dev        # Servidor en http://localhost:3000
```

### Mobile
```bash
cd mobile
npm install
npm start          # Seleccionar iOS/Android
```

## 📈 Roadmap Futuro

- [ ] Autenticación OAuth (Google/GitHub)
- [ ] Más roles/niveles de entrevista
- [ ] Historial de entrevistas detallado
- [ ] Comparación de progreso vs peers
- [ ] Integración con LeetCode/HackerRank
- [ ] Análisis de sentimiento en respuestas
- [ ] Certificados de completitud
- [ ] API pública para integraciones

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a rama (`git push origin feature/amazing`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo licencia MIT - ver archivo LICENSE para detalles.

## 🎓 Desarrollador

Proyecto educativo para portfolio técnico. Creado con ❤️ para mejorar habilidades de entrevista.
