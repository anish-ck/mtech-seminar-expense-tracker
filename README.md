# Expense Tracker (Microservices)

A very simple, beginner-friendly expense tracker using:

- Frontend: plain HTML/CSS/JavaScript
- Backend: FastAPI microservices
- Database: SQLite with SQLAlchemy (in Expense Service)
- Containers: Docker

## Project Structure

```text
mtech_seminar/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── expense-service/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── summary-service/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── k8s/
│   ├── expense-deployment.yaml
│   ├── summary-deployment.yaml
│   └── services.yaml
│
├── docker-compose.yml
└── README.md
```

## Microservices

### 1) Expense Service (Port 8000)

Responsibilities:
- Create expenses
- List expenses
- Delete expenses

Endpoints:
- `POST /expenses`
- `GET /expenses`
- `DELETE /expenses/{id}`

Data fields:
- `id` (integer primary key)
- `title` (string)
- `amount` (float)
- `category` (string)
- `created_at` (datetime)

### 2) Summary Service (Port 8001)

Responsibilities:
- Calculate total expenses

Endpoint:
- `GET /summary`

Behavior:
- Calls Expense Service `GET /expenses`
- Calculates total amount
- Returns total + count

## Run Locally (Without Docker)

Open 2 terminals.

### Terminal 1: Expense Service

```powershell
cd expense-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 2: Summary Service

```powershell
cd summary-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:EXPENSE_SERVICE_URL="http://localhost:8000"
uvicorn main:app --reload --port 8001
```

### Frontend

Open `frontend/index.html` directly in your browser.

Recommended (for cleaner local behavior):

```powershell
cd frontend
python -m http.server 5500
```

Then open:
- `http://localhost:5500`

## Quick API Tests

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

Delete expense (example id=1):

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:8000/expenses/1"
```

## Run With Docker (Individual Services)

From the project root folder.

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

## Run With Docker Compose (Optional)

```powershell
docker compose up --build
```

Services:
- Expense Service: `http://localhost:8000`
- Summary Service: `http://localhost:8001`

## Notes For Cloud Run / Kubernetes Later

- Move service URLs to environment variables (already done for Summary Service).
- Keep Summary Service stateless (already done).
- SQLite is fine for local demo, but for cloud production use a managed database.
- Each service has its own Dockerfile, making container deployment straightforward.

## Cloud Run Deploy (Console + CLI)

Important:
- Deploy two Cloud Run services, not one:
	- `expense-service`
	- `summary-service`
- Cloud Run sends traffic to `$PORT` (default `8080`), which is already configured in both Dockerfiles.

### Recommended Console Values

For both services:
- Region: `us-west1` (or your preferred region)
- Authentication: `Allow public access` (for demo)
- Billing: `Request-based`
- Scaling: `Auto scaling`, min instances `0`
- Ingress: `All`
- Container port: `8080`

For `summary-service` only:
- Variables & Secrets:
	- `EXPENSE_SERVICE_URL` = `https://<expense-service-url>`

### Deploy With gcloud CLI (Simple)

Set your project and region:

```powershell
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region us-west1
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy expense service first:

```powershell
gcloud run deploy expense-service --source ./expense-service --region us-west1 --allow-unauthenticated
```

Get the deployed expense URL:

```powershell
gcloud run services describe expense-service --region us-west1 --format="value(status.url)"
```

Deploy summary service with expense URL env var:

```powershell
gcloud run deploy summary-service --source ./summary-service --region us-west1 --allow-unauthenticated --set-env-vars EXPENSE_SERVICE_URL=https://YOUR_EXPENSE_SERVICE_URL
```

Test endpoints:

```powershell
Invoke-RestMethod -Method Get -Uri "https://YOUR_EXPENSE_SERVICE_URL/expenses"
Invoke-RestMethod -Method Get -Uri "https://YOUR_SUMMARY_SERVICE_URL/summary"
```

## Kubernetes Deploy (Basic)

Build and push images to your registry first, then update image names in:
- `k8s/expense-deployment.yaml`
- `k8s/summary-deployment.yaml`

Apply manifests:

```powershell
kubectl apply -f k8s/expense-deployment.yaml
kubectl apply -f k8s/summary-deployment.yaml
kubectl apply -f k8s/services.yaml
```

Check resources:

```powershell
kubectl get deployments
kubectl get pods
kubectl get services
```

Optional local test with port-forward:

```powershell
kubectl port-forward service/expense-service 8000:8000
kubectl port-forward service/summary-service 8001:8001
```

## GitHub Actions CI/CD

Two workflows are included:

- `.github/workflows/ci.yml`
	- Runs on every push to `main` and on pull requests.
	- Builds both Docker images.
	- Runs smoke tests against `GET /expenses` and `GET /summary`.

- `.github/workflows/deploy-cloud-run.yml`
	- Runs on push to `main` (and manual trigger with `workflow_dispatch`).
	- Builds and pushes images to Artifact Registry.
	- Deploys `expense-service` then `summary-service` to Cloud Run.
	- Automatically wires `EXPENSE_SERVICE_URL` in `summary-service`.

### Required GitHub Secrets

Add these repository secrets in GitHub:

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

### One-time GCP IAM setup (for GitHub OIDC)

Use the Google Cloud docs flow for GitHub OIDC and grant the service account permissions such as:

- Cloud Run Admin
- Cloud Build Editor
- Artifact Registry Writer
- Service Account User

After this setup, each push to `main` will run full CI and deploy automatically.
