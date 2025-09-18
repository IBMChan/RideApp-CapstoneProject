const BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
const walletIdEl = document.getElementById("walletId"); // fix ID to match HTML
const walletBalanceEl = document.getElementById("walletBalance");
  const createWalletBtn = document.getElementById("createWalletBtn");
  const addMoneyBtn = document.getElementById("addMoneyBtn");
  const viewTransactionsBtn = document.getElementById("viewTransactionsBtn");

  const createWalletForm = document.getElementById("createWalletForm");
  const addMoneyFormStep1 = document.getElementById("addMoneyFormStep1");
  const addMoneyFormStep2 = document.getElementById("addMoneyFormStep2");
  const transactionsSection = document.getElementById("transactionsSection");
  const transactionsList = document.getElementById("transactionsList");

  let walletExists = false;

  // ===== Helper for API requests with cookies =====
  const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // ✅ send cookies
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = "API error";
      try {
        errMsg = JSON.parse(errText).message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    return res.json();
  };

  // ===== Load wallet info =====
async function loadWallet() {
  try {
    const data = await apiFetch("/wallet/balance");

    if (!data.success || !data.data) {
      console.error("Wallet load failed:", data.message);
      walletIdEl.textContent = "N/A";
      walletBalanceEl.textContent = "₹0";
      walletExists = false;
      addMoneyBtn.disabled = true;
      viewTransactionsBtn.disabled = true;
      return;
    }

    walletIdEl.textContent = data.data.wallet_id || "N/A";
    walletBalanceEl.textContent = `₹${data.data.balance || 0}`;
    walletExists = true;
    addMoneyBtn.disabled = false;
    viewTransactionsBtn.disabled = false;
  } catch (err) {
    console.error("Wallet load failed:", err.message);
    walletIdEl.textContent = "N/A";
    walletBalanceEl.textContent = "₹0";
    walletExists = false;
    addMoneyBtn.disabled = true;
    viewTransactionsBtn.disabled = true;
  }
}


  // ===== Load transactions =====
async function loadTransactions() {
  try {
    const data = await apiFetch("/wallet/transactions");

    if (!data.success) {
      console.error("Transactions load failed:", data.message);
      return;
    }

    transactionsList.innerHTML = "";

    data.data.transactions.forEach((txn) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(txn.txn_date || txn.created_at).toLocaleString()}</td>
        <td>${txn.credit ? "₹" + txn.credit : "-"}</td>
        <td>${txn.debit ? "₹" + txn.debit : "-"}</td>
        <td>${txn.status || "pending"}</td>
      `;
      transactionsList.appendChild(tr);
    });
  } catch (err) {
    console.error("Transactions fetch failed:", err.message);
  }
}


  // ===== Create Wallet =====
  createWalletBtn?.addEventListener("click", () => {
    if (!walletExists) createWalletForm.style.display = "block";
  });

  document.getElementById("cancelCreateWallet")?.addEventListener("click", () => {
    createWalletForm.style.display = "none";
  });

  document.getElementById("proceedCreateWallet")?.addEventListener("click", async () => {
    const pin = document.getElementById("newPin").value;
    if (!pin || pin.length !== 4) {
      alert("Enter a valid 4-digit PIN");
      return;
    }

    try {
      await apiFetch("/wallet/create", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      alert("Wallet created successfully!");
      createWalletForm.style.display = "none";
      await loadWallet();
    } catch (err) {
      console.error(err);
      alert("Failed to create wallet");
    }
  });

  // ===== Add Money =====
  addMoneyBtn?.addEventListener("click", () => (addMoneyFormStep1.style.display = "block"));
  document.getElementById("cancelAddMoney1")?.addEventListener("click", () => (addMoneyFormStep1.style.display = "none"));

  document.getElementById("proceedAddMoney")?.addEventListener("click", async () => {
    const amount = document.getElementById("amount").value;
    const pin = document.getElementById("pin").value;

    if (!amount || !pin) {
      alert("Enter amount and PIN");
      return;
    }

    try {
      const res = await apiFetch("/wallet/add-money", {
        method: "POST",
        body: JSON.stringify({ amount, pin }),
      });

      alert("Payment initiated. Check your email for Razorpay Txn ID.");
      addMoneyFormStep1.style.display = "none";
      addMoneyFormStep2.style.display = "block";
      addMoneyFormStep2.dataset.txnId = res.txn_id;
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment");
    }
  });

  // ===== Verify Transaction =====
  document.getElementById("confirmAddMoney")?.addEventListener("click", async () => {
    const razorpay_payment_id = document.getElementById("txnId").value;

    if (!razorpay_payment_id) {
      alert("Enter Razorpay Transaction ID");
      return;
    }

    try {
      await apiFetch("/wallet/verify-add-money", {
        method: "POST",
        body: JSON.stringify({ razorpay_payment_id }),
      });

      alert("Money added successfully!");
      addMoneyFormStep2.style.display = "none";
      await loadWallet(); // reload balance
      await loadTransactions(); // reload txns
    } catch (err) {
      console.error(err);
      alert("Failed to verify transaction: " + err.message);
    }
  });

  // ===== View Transactions =====
  viewTransactionsBtn?.addEventListener("click", async () => {
    try {
      await loadTransactions();
      transactionsSection.style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transactions");
    }
  });

  // ===== Run these when page loads =====
  await loadWallet();
  await loadTransactions();
});
