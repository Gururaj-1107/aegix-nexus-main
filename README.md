<div align="center">

# 🛡️ Aegis Nexus
### AI-Powered NGO Resource Allocation Platform

[![Google Build for AI Hackathon](https://img.shields.io/badge/Google%20Build%20for%20AI-Hackathon%202026-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://cloud.google.com)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-34A853?style=for-the-badge&logo=google-cloud&logoColor=white)](https://aegis-frontend-75btxxix5a-uc.a.run.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)

</div>

---

## 📖 Overview

**Aegis Nexus** is an agentic, AI-powered disaster relief and NGO resource allocation platform built for the **Google Build for AI Hackathon**. It solves the critical problem of *Smart Resource Allocation* in humanitarian crises: when disaster strikes, NGOs struggle to coordinate hundreds of volunteers across geographically dispersed areas, match specialized skills (MEDIC, EVAC, FOOD_AID, LOGISTICS) to urgent community needs, and make real-time decisions with incomplete information. Aegis Nexus unifies volunteer coordination, real-time community needs mapping, AI-powered dispatch intelligence (via Vertex AI & Gemini), document processing (via Google Document AI), multilingual communication (via Cloud Translation API), and a RAG-powered knowledge vault — all in a cinematic, production-grade dashboard accessible from any browser.

---

## 🚀 Live Demo

> **Frontend:** [https://aegis-frontend-75btxxix5a-uc.a.run.app](https://aegisngo1.web.app/)
>


---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Three.js, Google Maps JavaScript API |
| **Backend** | Node.js, Express.js, Prisma ORM, PostgreSQL (Cloud SQL) |
| **AI / ML** | Vertex AI, Gemini API, Google Document AI, Google Speech-to-Text, Cloud Translation API |
| **Infrastructure** | Google Cloud Run, Google Cloud SQL, Google Cloud Build, Docker, Google Container Registry |

---

## 📁 Project Structure

```
Google/                          ← Monorepo root
├── cloudbuild.yaml              ← CI/CD pipeline (Cloud Build)
├── docker-compose.yml           ← Local development orchestration
├── .gitignore
├── README.md
├── DEPLOYMENT_GUIDE.md
├── db/
│   └── schema.sql               ← Raw SQL schema (reference)
└── services/
    ├── backend/                 ← Node.js + Express + Prisma
    │   ├── src/
    │   │   ├── index.js
    │   │   └── routes/          ← API route handlers
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── seed.js
    │   ├── Dockerfile
    │   └── .env.example
    ├── frontend/                ← Next.js 14 + TypeScript
    │   ├── src/
    │   │   └── app/             ← App Router pages & components
    │   ├── Dockerfile
    │   └── .env.local.example
    └── matcher/                 ← C++ spatial matching microservice
        ├── src/
        │   └── main.cpp
        └── Dockerfile
```

---


## 🔐 Environment Variables

### Backend (`services/backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: 3001) |
| `DATABASE_URL` | PostgreSQL connection string (Cloud SQL IP or Auth Proxy) |
| `GEMINI_API_KEY` | Google Gemini API key for AI chat and embeddings |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID for authentication |
| `GOOGLE_CLOUD_PROJECT` | Your GCP Project ID |
| `DOCUMENT_AI_PROCESSOR_ID` | Document AI processor ID for PDF parsing |
| `FRONTEND_URL` | Frontend URL for CORS allow-list |
| `MATCHER_URL` | Internal URL of the C++ matcher service |

### Frontend (`services/frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the backend Cloud Run service |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini API key for client-side AI features |

---

## 📡 API Endpoints

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check — returns `{ status: "ok" }` |
| `GET` | `/api/volunteers` | No | List all volunteers with skills and status |
| `GET` | `/api/volunteers/:id` | No | Get a specific volunteer by ID |
| `POST` | `/api/volunteers` | No | Register a new volunteer |
| `PATCH` | `/api/volunteers/:id/status` | No | Update volunteer status |
| `GET` | `/api/reports` | No | List all community need reports |
| `POST` | `/api/reports` | No | Submit a new community need report |
| `GET` | `/api/dispatches` | No | List all dispatches |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`

Please ensure your code passes linting (`npm run lint`) and includes appropriate comments.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ for the <strong>Google Build for AI Hackathon 2026</strong>
</div>
