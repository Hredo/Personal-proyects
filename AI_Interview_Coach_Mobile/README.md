# 🎤 AI Interview Coach

Plataforma en desarrollo para preparación de entrevistas técnicas con evaluación asistida por IA.

## ⚠️ Estado Actual

**Proyecto NO terminado.**

Este repositorio está en fase de desarrollo activo y todavía presenta limitaciones importantes.
No está listo para producción ni para uso estable.

### Problemas abiertos (abril 2026)

- Flujo de entrevista aún inestable en algunos escenarios de chat.
- Calidad de generación de preguntas inconsistente según configuración de IA.
- Integración Gemini en ajuste (depende de clave/modelo válidos y pruebas adicionales).
- UX/UI en revisión: hay pantallas y comportamientos pendientes de pulir.
- Documentación histórica desactualizada respecto al estado real del proyecto.

### Qué falta para considerarlo terminado

- Estabilizar conversación multi-turno sin repeticiones ni arrastre de contexto.
- Validar integración Gemini de extremo a extremo con manejo sólido de errores.
- Revisar y simplificar interfaz completa (web) para flujo práctico.
- Añadir pruebas automáticas mínimas de backend y frontend.
- Actualizar toda la documentación técnica y de despliegue.

## Nota

Si solo quieres probar rápido el prototipo, puedes hacerlo, pero asume comportamiento experimental.
Para contribuciones o uso serio, esperar a una versión marcada como estable.

---

## Documentación anterior (pendiente de revisión)

Las secciones siguientes reflejan una versión anterior del proyecto y pueden contener información no vigente.

## 🎯 Características Principales

✨ **Evaluación con IA**: OpenAI GPT-4 con fallback local  
📊 **Rúbricas Estructuradas**: 4 competencias ponderadas (Architecture, Complexity, Communication, Problem-Solving)  
📈 **Dashboard Avanzado**: Gráficos de tendencias, KPIs, competencias  
📥 **Export a PDF**: Reportes profesionales con histórico  
📱 **Cross-Platform**: Web responsive + App nativa (iOS/Android)  
💾 **Persistencia**: SQLite backend + localStorage web + AsyncStorage mobile  

## 🏗️ Stack Completo

| Componente | Tecnología | Estado |
|-----------|-----------|--------|
| **Backend** | FastAPI, SQLite, OpenAI | ✅ Producción |
| **Frontend Web** | React 18, Vite, TypeScript, Recharts | ✅ Funcional |
| **Mobile** | React Native, Expo, AsyncStorage | ✅ Funcional |
| **Database** | SQLite 3 con migrations auto | ✅ Funcional |
| **Gráficos** | Recharts (web), React Native Charts (mobile) | ✅ Completado |
| **PDF** | jsPDF + html2canvas | ✅ Completado |

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
Backend corriendo en http://localhost:8000

### 2. Frontend Web
```bash
cd frontend
npm install
npm run dev
```
App web en http://localhost:3000

### 3. Mobile (Opcional)
```bash
cd mobile
npm install
npm start  # Seleccionar iOS o Android
```

## 📊 Arquitectura

```
Backend (FastAPI)
├── Sessions: Create → Answer → Evaluate → Track
├── Evaluation: OpenAI + RubricsEngine + Fallback
├── Storage: SQLite con 11 columnas
└── 7 Endpoints REST

Frontend Web (React)
├── HomePage: Login simple
├── InterviewPage: Entrevista interactiva + rúbricas visuales
├── DashboardPage: Gráficos + KPIs + Areas mejora
└── PDF Export: Reportes descargables

Mobile (React Native)
├── HomeScreen: Autenticación
├── InterviewScreen: Flujo entrevista
├── DashboardScreen: Progreso simplificado
└── Tab Navigation: Entrevista/Progreso
```

## 🎯 Endpoints API

```
POST   /api/sessions/start                   # Iniciar sesión
POST   /api/sessions/{id}/answer             # Enviar respuesta
GET    /api/sessions/{id}                    # Obtener sesión
GET    /api/progress/{user_id}               # Progreso usuario
GET    /api/rubrics                          # Definiciones rúbricas
```

## 📈 Rúbricas de Evaluación

Cada respuesta se evalúa en 4 competencias:

| Competencia | Peso | Max Score | Criterios |
|-------------|------|-----------|-----------|
| Architecture & Design | 25% | 25 | Sistema design, patrones, escalabilidad |
| Technical Complexity | 25% | 25 | Profundidad técnica, conocimiento |
| Communication | 25% | 25 | Claridad, estructura, explicación |
| Problem-Solving | 25% | 25 | Solución óptima, edge cases |

**Score Total**: Promedio ponderado de competencias (0-100)

## 🗄️ Base de Datos

### Tabla: interview_sessions
```sql
- session_id (PK)
- user_id
- role, level
- question, answer
- total_score, competencies_json
- strengths_json, improvements_json
- created_at, updated_at
```

## 🔐 Configuración

### Backend .env
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

### Frontend Web .env.local
```env
VITE_API_URL=http://localhost:8000/api
```

### Mobile src/lib/api.ts
```typescript
const API_URL = 'http://192.168.1.X:8000/api'
```

## 📊 Estadísticas

- **Total Código**: ~2,900 líneas
- **Archivos**: 34 archivos
- **Backend**: 600 líneas Python
- **Frontend**: 1,200 líneas TypeScript
- **Mobile**: 700 líneas TypeScript

## ✅ Checklist de Completitud

- [x] Backend MVP con sesiones
- [x] Frontend web Vite+React
- [x] Rúbricas de scoring ponderadas
- [x] Dashboard con gráficos avanzados
- [x] PDF export funcional
- [x] Migración a React Native
- [x] Documentación completa
- [x] Código limpio y escalable

## 📝 Documentación

- [PROJECT_COMPLETION.md](PROJECT_COMPLETION.md) - Resumen de finalización
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura detallada
- [docs/roadmap.md](docs/roadmap.md) - Planificación original

## 🎓 Para tu Portfolio

Este proyecto demuestra:
✨ Full-stack development end-to-end  
✨ Integración de IA (OpenAI)  
✨ Data visualization avanzada  
✨ Cross-platform development  
✨ Prácticas de producción  

---

**Creado para portfolio técnico. Listo para showcasing! 🚀**
