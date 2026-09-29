# DeployEasy

Deploy your applications without the infrastructure headache. Connect a GitHub repository and deploy applications seamlessly.

---

## Problem Being Solved

Deploying modern web applications requires navigating complex DevOps infrastructure: Docker containerization, Kubernetes cluster management, ingress routing, CI/CD pipelines, and cloud provider settings. **DeployEasy** abstracts away infrastructure friction, allowing developers to focus on writing application code.

---

## Phase 1 Scope

Phase 1 provides a complete, working application foundation consisting of:

- **Landing Page**: Modern product introduction with features, workflow, and technology overview.
- **Mock Authentication**: Simulated GitHub login flow saving session in application context.
- **Overview Dashboard**: Metrics for projects, deployments, active apps, and failures, plus recent activity feeds.
- **Projects Management**: Searchable and filterable project grid, create project modal, and detailed project view.
- **Simulated Deployments**: Staged deployment pipeline (Git Clone → Build → Create Image → Deploy → Health Check → Success).
- **Deployment History & Details**: Filterable history table, individual deployment details, visual status pipeline, and live logs.
- **Activity Feed**: Real-time event log for created projects, started deployments, and setting updates.
- **Settings**: Demo settings for default branch, framework, region, notifications, and theme.
- **Database & API**: PostgreSQL schema via Prisma ORM and Node.js/Express REST API clean architecture.
- **Docker Compose**: Containerized setup for local development.

---

## Intended Workflow Architecture

```text
GitHub
   ↓
Build
   ↓
Docker
   ↓
Kubernetes
   ↓
Live Application
```

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, React Router v6, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript, REST API, CORS, dotenv
- **Database**: PostgreSQL, Prisma ORM
- **Testing**: Vitest, React Testing Library, Supertest
- **Code Quality**: ESLint, Prettier

---

## Folder Structure

```text
deployeasy/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL instance (or Docker Desktop for Compose)

---

## Environment Variables

Copy `.env.example` to create local `.env` files if needed:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deployeasy
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## Quick Start (Without Docker)

1. **Install dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running locally, then run migrations and seeding:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

3. **Start Development Servers**:
   ```bash
   # In terminal 1 (Backend API)
   cd backend && npm run dev

   # In terminal 2 (Frontend UI)
   cd frontend && npm run dev
   ```

---

## Quick Start (With Docker Compose)

```bash
docker-compose up --build
```

Access:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api/health`

---

## API Documentation

- `GET /api/health`: API health status
- `GET /api/user`: Mock authenticated user details
- `GET /api/projects`: Get all projects (supports `?status=` and `?search=`)
- `GET /api/projects/:id`: Get single project details
- `POST /api/projects`: Create project
- `PUT /api/projects/:id`: Update project configuration
- `DELETE /api/projects/:id`: Delete project
- `GET /api/deployments`: Get all deployments
- `GET /api/deployments/:id`: Get deployment details
- `POST /api/deployments`: Trigger simulated deployment
- `GET /api/projects/:id/deployments`: Deployments for specific project
- `GET /api/projects/:id/logs`: Deployment logs for project
- `GET /api/activity`: Activity feed events

---

## Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

---

## Future Roadmap

- **Phase 1 → Application Foundation** `[CURRENT]`
- **Phase 2 → GitHub Integration** (OAuth, Repositories, Webhooks)
- **Phase 3 → Docker Containerization** (Automatic Dockerfile generation & building)
- **Phase 4 → Kubernetes Orchestration** (Deployment manifests, pods, services)
- **Phase 5 → Automated Deployment Pipelines**
- **Phase 6 → CI/CD & Automated Webhook Deployment**
- **Phase 7 → Cloud Infrastructure (AWS + Terraform)**
- **Phase 8 → Platform Monitoring & Security (Prometheus + Grafana)**
