import os

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Summary Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXPENSE_SERVICE_URL = os.getenv("EXPENSE_SERVICE_URL", "http://localhost:8000")


@app.get("/summary")
def get_summary():
    try:
        response = requests.get(f"{EXPENSE_SERVICE_URL}/expenses", timeout=5)
        response.raise_for_status()
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Expense service is unavailable",
        )

    expenses = response.json()
    total = sum(item["amount"] for item in expenses)

    return {
        "total_expense": round(total, 2),
        "count": len(expenses),
    }
