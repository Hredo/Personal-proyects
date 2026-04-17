# ⚡ Quick Start Guide (5 minutos)

## Terminal 1: Backend
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
✅ **Esperado**: `Uvicorn running on http://127.0.0.1:8000`

**URL API**: http://localhost:8000/api

---

## Terminal 2: Frontend Web
```bash
cd frontend
npm install
npm run dev
```
✅ **Esperado**: `Local: http://localhost:5173/`

**Abre en navegador**: http://localhost:5173

---

## Test Flow Web (2 minutos)

1. **Home**: 
   - Escribe username: `test_user`
   - Click "Comenzar"

2. **Interview**:
   - Click "Generar Pregunta"
   - Escribe respuesta (>10 caracteres)
   - Click "Evaluar"
   - Verás: Score + 4 competencias + strengths/improvements

3. **Dashboard**:
   - Click pestaña "Progreso"
   - Verás gráficos + KPIs
   - Click "Exportar PDF" para descargar

4. **Refresh**:
   - F5 en navegador
   - Todo se mantiene (localStorage)

---

## Terminal 3: Mobile (Opcional)
```bash
cd mobile
npm install
npm start
# Presiona 'i' para iOS o 'a' para Android
```

---

## 🎯 URLs Principales

| Componente | URL | Descripción |
|-----------|-----|-----------|
| Backend | http://localhost:8000 | API FastAPI |
| Swagger Docs | http://localhost:8000/docs | API documentation |
| Frontend | http://localhost:5173 | React web app |
| Database | backend/interview_coach.db | SQLite local |

---

## 🔍 Verificación Rápida

```bash
# Test backend health
curl http://localhost:8000/api/rubrics

# Debería devolver:
# [
#   {"name": "Architecture & Design", ...},
#   {"name": "Technical Complexity", ...},
#   ...
# ]
```

---

## 🐛 Si Algo Falla

**Backend no inicia:**
```bash
cd backend
python -m ensurepip --upgrade
pip install -r requirements.txt
```

**Frontend no compila:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**CORS error:**
- Asegurate que backend está en http://localhost:8000
- Check: VITE_API_URL en frontend/.env.local

---

## ✨ Features a Probar

- [ ] Generar preguntas
- [ ] Evaluar respuestas
- [ ] Ver competencias
- [ ] Dashboard con gráficos
- [ ] Export PDF
- [ ] Refresh manteniendo datos
- [ ] Múltiples usuarios
- [ ] Focus areas

---

## 📊 Esperado al Terminar

- ✅ Backend corriendo en 8000
- ✅ Frontend corriendo en 5173
- ✅ DB creada automáticamente
- ✅ Al menos 1 pregunta generada
- ✅ Al menos 1 respuesta evaluada
- ✅ Dashboard visible con datos
- ✅ PDF descargable

---

**¡Listo para portfolio!** 🚀
