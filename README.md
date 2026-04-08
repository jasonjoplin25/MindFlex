<div align="center">

<svg width="600" height="120" viewBox="0 0 600 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1890FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#722ED1;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="600" height="120" rx="12" fill="#FAFAFA"/>
  <text
    x="300"
    y="78"
    text-anchor="middle"
    font-family="'Segoe UI', Arial, sans-serif"
    font-size="62"
    font-weight="700"
    letter-spacing="2"
    fill="url(#titleGrad)"
    filter="url(#glow)"
  >MindFlex</text>
</svg>

**Cognitive Training & Care Platform**

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/Flask-Python-000000?style=flat-square&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

MindFlex is a full-stack cognitive training platform designed for individuals experiencing cognitive decline and the caregivers who support them. It combines scientifically-grounded brain exercises with AI-powered care assistance, sound therapy, and detailed progress tracking — all in one accessible application.

## Current State

The platform is fully functional with the following modules live:

| Module | Status |
|---|---|
| Brain Training Games | Live |
| Personalized Dashboard | Live |
| Sound Therapy | Live |
| Caregiver Tools & AI Assistant | Live |
| Cognitive Assessment | Live |
| Achievements & Missions | Live |
| OCR / Document Uploads | Live |
| LLM Settings (multi-provider) | Live |
| Speech & Communication Tools | Live |
| Analytics & Progress Tracking | Live |

## Brain Training Games

- **Memory Match** — card-flip pattern recognition
- **Pattern Memory** — sequence recall under time pressure
- **Math Challenge** — mental arithmetic with adaptive difficulty
- **Reaction Speed** — stimulus-response training
- **Word Scramble** — language and recall exercises
- **Snake** — classic reflex and planning game

## Features

- **AI Care Assistant** — LLM-powered caregiver advice and patient Q&A (supports multiple providers)
- **Sound Therapy** — curated audio sessions for relaxation and cognitive stimulation
- **Caregiver Portal** — dedicated view for scheduling, reminders, and patient progress
- **Patient Journey** — visual timeline of progress milestones
- **Cognitive Assessment** — structured evaluation with tracked results over time
- **Achievements System** — missions and rewards to encourage consistent engagement
- **Profile & Progress** — personalised dashboard with stats, streaks, and history
- **Speech & Communication App** — AAC-style tools for users with speech impairments

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Material-UI, Tailwind CSS, Framer Motion, Three.js |
| Backend | Python, Flask, Flask-JWT-Extended, SQLAlchemy, Flask-Migrate |
| Database | PostgreSQL |
| Auth | JWT tokens with bcrypt |
| AI / LLM | Multi-provider (OpenAI, Anthropic, Ollama) via configurable settings |
| Deployment | Render (render.yaml included) |

## Quick Start

### Prerequisites
- Node.js 14+
- Python 3.7+
- PostgreSQL 13+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mindflex
DB_USER=your_db_user
DB_PASSWORD=your_db_password
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
CORS_ORIGINS=http://localhost:3000
```

```bash
python create_tables.py
python app.py                   # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000
```

```bash
npm start                       # http://localhost:3000
```

## Deployment

A `render.yaml` is included for one-click deployment to [Render](https://render.com). Update environment variables in the Render dashboard after connecting the repo.

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built by <a href="https://github.com/jasonjoplin25">Jason Joplin</a>
</div>
