const API_BASE_URL = "https://expense-service-5cc7kvneza-uw.a.run.app";
const SUMMARY_BASE_URL = "https://summary-service-5cc7kvneza-uw.a.run.app";

const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const expenseBody = document.getElementById("expense-body");
const totalEl = document.getElementById("total");
const statusEl = document.getElementById("status");

function setStatus(message = "") {
  statusEl.textContent = message;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function loadSummary() {
  const response = await fetch(`${SUMMARY_BASE_URL}/summary`);
  if (!response.ok) {
    setStatus("Failed to load total from Summary Service.");
    return;
  }

  const data = await response.json();
  totalEl.textContent = Number(data.total_expense).toFixed(2);
}

async function loadExpenses() {
  setStatus("");
  const response = await fetch(`${API_BASE_URL}/expenses`);
  if (!response.ok) {
    setStatus("Failed to load expenses.");
    return;
  }

  const expenses = await response.json();
  expenseBody.innerHTML = "";
  for (const item of expenses) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.title}</td>
      <td>$${item.amount.toFixed(2)}</td>
      <td>${item.category}</td>
      <td>${formatDate(item.created_at)}</td>
      <td><button class="delete-btn" data-id="${item.id}">Delete</button></td>
    `;
    expenseBody.appendChild(row);
  }

  await loadSummary();
}

async function addExpense(event) {
  event.preventDefault();
  setStatus("");

  const payload = {
    title: titleInput.value,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
  };

  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    setStatus("Failed to add expense. Check inputs.");
    return;
  }

  form.reset();
  await loadExpenses();
}

async function deleteExpense(id) {
  setStatus("");
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    setStatus("Failed to delete expense.");
    return;
  }

  await loadExpenses();
}

form.addEventListener("submit", addExpense);
expenseBody.addEventListener("click", (event) => {
  if (event.target.matches(".delete-btn")) {
    const id = event.target.getAttribute("data-id");
    deleteExpense(id);
  }
});

loadExpenses();
