# Expense Tracker (Microservices)

A beginner-friendly expense tracker that demonstrates a simple microservices architecture with FastAPI, SQLite, Docker, Cloud Run deployment, Kubernetes manifests, and GitHub Actions CI/CD.

## What This Project Shows

- Microservices architecture with clear service boundaries
- FastAPI backend services
- SQLite + SQLAlchemy in a dedicated data service
- Static frontend using plain HTML/CSS/JavaScript
- Docker-based local and cloud-friendly packaging
- Cloud Run deployment for both services
- GitHub Actions CI/CD workflow

## Architecture

There are two backend microservices:

1. Expense Service
- Owns expense data (SQLite)
- Handles create, list, delete
- Endpoints:
  - `POST /expenses`
  - `GET /expenses`
  - `DELETE /expenses/{id}`

2. Summary Service
- Stateless aggregation service
- Calls Expense Service and computes totals
- Endpoint:
  - `GET /summary`

Frontend:
- Static app that allows add/list/delete
- Displays total by calling Summary Service

## Tech Stack

Frontend:
- HTML
- CSS
- Vanilla JavaScript

Backend:
- FastAPI
- Uvicorn

Database:
- SQLite
- SQLAlchemy ORM

Containerization:
- Docker
- Docker Compose

Cloud:
- Google Cloud Run

CI/CD:
- GitHub Actions

## Project Structure

```text
mtech_seminar/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-cloud-run.yml
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── expense-service/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── requirements.txt
│   └── Dockerfile
├── summary-service/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── k8s/
│   ├── expense-deployment.yaml
│   ├── summary-deployment.yaml
│   └── services.yaml
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Data Model

Expense fields:
- `id` (integer primary key)
- `title` (string)
- `amount` (float)
- `category` (string)
- `created_at` (datetime)

SQLite file location:
- `expense-service/expenses.db`

## Local Run (Without Docker)

Open three terminals from project root.

1. Run Expense Service

```powershell
cd expense-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

2. Run Summary Service

```powershell
cd summary-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:EXPENSE_SERVICE_URL="http://localhost:8000"
uvicorn main:app --reload --port 8001
```

3. Run Frontend

```powershell
cd frontend
python -m http.server 5500
```

Open:
- `http://localhost:5500`

## API Quick Tests

Create expense:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/expenses" -ContentType "application/json" -Body '{"title":"Lunch","amount":12.5,"category":"Food"}'
```

List expenses:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/expenses"
```

Get summary:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8001/summary"
```

Delete expense:

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:8000/expenses/1"
```

## Docker Run

Build images:

```powershell
docker build -t expense-service ./expense-service
docker build -t summary-service ./summary-service
```

Run containers:

```powershell
docker run -d --name expense-service -p 8000:8080 expense-service
docker run -d --name summary-service -e EXPENSE_SERVICE_URL="http://host.docker.internal:8000" -p 8001:8080 summary-service
```

Test:
- `http://localhost:8000/expenses`
- `http://localhost:8001/summary`

## Docker Compose Run

```powershell
docker compose up --build
```

Services:
- Expense Service: `http://localhost:8000`
- Summary Service: `http://localhost:8001`

## Cloud Run Deployment

Both services are deployable to Cloud Run and listen on `$PORT` (default `8080`).

Recommended settings:
- Region: `us-west1`
- Authentication: Allow public access (for demo)
- Billing: Request-based
- Ingress: All
- Auto scaling: min instances `0`

Deploy order:
1. Deploy `expense-service`
2. Get expense service URL
3. Deploy `summary-service` with env var:
   - `EXPENSE_SERVICE_URL=<expense-service-url>`

## GitHub Pages (Frontend)

Frontend can be hosted on GitHub Pages.

If you use Pages with branch publishing, ensure the published folder contains:
- `index.html`
- `style.css`
- `app.js`

Your frontend currently calls Cloud Run APIs from `frontend/app.js`.

## Kubernetes Manifests

Kubernetes files are included under `k8s/`:
- `k8s/expense-deployment.yaml`
- `k8s/summary-deployment.yaml`
- `k8s/services.yaml`

Apply:

```powershell
kubectl apply -f k8s/expense-deployment.yaml
kubectl apply -f k8s/summary-deployment.yaml
kubectl apply -f k8s/services.yaml
```

## GitHub Actions CI/CD

Workflows:
- `.github/workflows/ci.yml`
  - Runs on PR and push to `main`
  - Builds service images
  - Runs smoke tests for `/expenses` and `/summary`

- `.github/workflows/deploy-cloud-run.yml`
  - Runs on push to `main` and manual dispatch
  - Authenticates to GCP with service account JSON secret
  - Builds and pushes images to Artifact Registry
  - Deploys both Cloud Run services

Required GitHub repository secrets:
- `GCP_SA_KEY` (full JSON key content)
- `GCP_PROJECT_ID`
- `GCP_REGION`

### Service account roles

Grant this service account roles such as:
- Cloud Run Admin
- Cloud Build Editor
- Artifact Registry Writer
- Service Account User

After this setup, each push to `main` will run full CI and deploy automatically.

## Security Notes

- Do not commit `.venv`, `.db`, or secrets
- Rotate service account keys if exposed
- Prefer Workload Identity Federation for production (no long-lived JSON key)

## Known Limitation

SQLite on Cloud Run is not durable for production workloads.
For production use, migrate to a managed database (for example Cloud SQL PostgreSQL).

## Future Improvements

- Add update/edit endpoint for expenses
- Add category filters and reporting
- Add API auth
- Add frontend environment config and build pipeline
- Migrate SQLite to managed DB
