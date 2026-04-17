# 📋 Deploy & Testing Checklist

## ✅ Pre-requisitos

- [x] Python 3.13.7+ instalado
- [x] Node.js 18+ instalado
- [x] Git instalado
- [x] Virtual environment venv creado

## 🔧 Setup Paso a Paso

### 1️⃣ Backend Setup

```bash
# Navegar a carpeta backend
cd backend

# Crear venv si no existe
python -m venv .venv

# Activar venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

# Instalar dependencias
pip install -r requirements.txt

# Crear .env (opcional, funciona con fallback)
cp .env.example .env
# OPENAI_API_KEY=sk-xxxxx (solo si quieres usar OpenAI)

# Correr servidor
uvicorn app.main:app --port 8000 --reload
```

**Esperado**: 
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

Accede a http://localhost:8000/docs para ver Swagger UI

### 2️⃣ Frontend Web Setup

```bash
# Navegar a carpeta frontend
cd frontend

# Instalar dependencias (si no están)
npm install

# Crear .env.local (opcional)
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Correr dev server
npm run dev
```

**Esperado**: 
```
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

Accede a http://localhost:5173

### 3️⃣ Mobile Setup (Opcional)

```bash
# Navegar a carpeta mobile
cd mobile

# Instalar dependencias
npm install

# Iniciar Expo
npm start
# Presiona 'i' para iOS o 'a' para Android

# También puedes hacer:
npm run android  # Android device/emulator
npm run ios      # iOS simulator
```

---

## 🧪 Testing Flow

### Test 1: Backend Health
```bash
curl http://localhost:8000/api/rubrics
# Debería devolver lista de rúbricas
```

### Test 2: Web Flow Completo

1. **Home Screen**
   - Abre http://localhost:5173
   - Ingresa username (ej: "test_user")
   - Click "Comenzar"

2. **Interview Screen**
   - Click "Generar Pregunta"
   - Espera a que se genere (5-10s)
   - Escribe respuesta (min 10 caracteres)
   - Click "Evaluar"
   - Debería ver:
     - Score 0-100
     - 4 competencias con barras de color
     - Strengths (puntos fuertes)
     - Improvements (áreas mejora)

3. **Dashboard**
   - Click en pestaña "Progreso"
   - Debería ver:
     - 4 KPI cards (Sesiones, Promedio, Max, Min)
     - LineChart con tendencia de scores
     - BarChart con histórico
     - PieChart con distribución de competencias
     - Lista de "Focus Areas"
     - Botón "Exportar PDF"

4. **PDF Export**
   - Click "Exportar PDF"
   - Debería descargarse archivo con nombre `progress_USERID_DATE.pdf`
   - Abrir PDF debería mostrar:
     - KPIs
     - Tabla de sesiones
     - Focus areas
     - Footer con timestamp

### Test 3: Persistencia Web

1. **Refrescar página** (F5)
   - Username debería mantenerse
   - Historial de sesiones debería estar presente
   - Dashboard debería mostrar mismo progreso

2. **Abrir en otra pestaña**
   - Nueva pestaña, mismo localhost:5173
   - Debería autologuearse si existe sessionStorage

### Test 4: Mobile Flow (si ejecutas Expo)

1. **Escanea QR** con Expo Go app
2. **Home Screen**
   - Ingresa username
   - Click Start
   
3. **Interview Screen**
   - Generate question
   - Submit answer
   - Ver score + competencies

4. **Dashboard**
   - Ver progreso con barras nativas
   - Pull to refresh para actualizar

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Error: "Address already in use"
# Cambiar puerto:
uvicorn app.main:app --port 8001 --reload

# Error: "No module named pip._internal"
# Reparar venv:
python -m ensurepip --upgrade
pip install -r requirements.txt
```

### Frontend no compila
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Mobile: Metro bundler error
```bash
# Limpiar cache:
npx expo start --clear
```

### API CORS error
```
# Asegúrate que backend tiene CORS habilitado
# En backend/app/main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    ...
)
```

### SQL error: "no such table"
```bash
# Backend recreará tabla automáticamente al startup
# Si querés limpiar:
rm backend/interview_coach.db
# Reinicia backend
```

---

## 🎯 Puntos de Verificación

### Backend (http://localhost:8000)
- [ ] GET /docs → Swagger UI visible
- [ ] GET /api/rubrics → 200 OK con 4 rúbricas
- [ ] POST /api/sessions/start → 200 OK con session_id + question

### Frontend (http://localhost:5173)
- [ ] Home carga sin errores
- [ ] Login guarda username en localStorage
- [ ] Interview page genera preguntas
- [ ] Respuesta genera score + competencias
- [ ] Dashboard muestra gráficos
- [ ] PDF export descarga archivo

### Mobile (Expo)
- [ ] App carga en emulator/device
- [ ] Login guarda en AsyncStorage
- [ ] Interview flow similar a web
- [ ] Dashboard simplificado funciona

---

## 📊 Performance Metrics

### Backend
- **Response Time**: < 100ms (fallback), 2-5s (OpenAI)
- **DB Size**: < 5MB (100+ sesiones)
- **Memory**: < 100MB

### Frontend Web
- **Build Time**: < 30s
- **Bundle Size**: < 500KB
- **Lighthouse**: 80+ performance

### Mobile
- **APK Size**: ~50MB
- **Startup Time**: < 3s
- **Memory**: < 200MB

---

## 🚀 Deploy a Producción

### Backend (Railway/Heroku)
```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar Railway/Heroku
# 3. Crear secrets: OPENAI_API_KEY
# 4. Deploy automático desde main
```

### Frontend Web (Vercel)
```bash
# 1. npm install -g vercel
# 2. vercel
# 3. Configurar VITE_API_URL en .env.production
# 4. Deploy automático
```

### Mobile (App Store/Play Store)
```bash
# Usar Expo Application Services (EAS)
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

---

## 📞 Support & Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev
- **React Native**: https://reactnative.dev
- **Expo**: https://docs.expo.dev
- **Recharts**: https://recharts.org
- **jsPDF**: https://github.com/parallax/jsPDF

---

**Última Actualización**: 2024  
**Version**: 1.0.0 - MVP Complete  
**Status**: Ready for Testing ✅
