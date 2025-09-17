const BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const walletIdEl = document.getElementById("walletId");
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
      try { errMsg = JSON.parse(errText).message || errMsg; } catch {}
      throw new Error(errMsg);
    }
    return res.json();
  };

  // ===== Load wallet info =====
const loadWallet = async () => {
  try {
    const userRes = await apiFetch("/wallet/me");       // { success, data: {...} }
    const walletRes = await apiFetch("/wallet/balance"); // { success, data: { balance } }

    if (walletRes.success && walletRes.data) {
      walletExists = true;
      createWalletBtn.disabled = true;
      addMoneyBtn.disabled = false;
      viewTransactionsBtn.disabled = false;

      walletIdEl.textContent = userRes.data.wallet_id || "N/A";
      walletBalanceEl.textContent = walletRes.data.balance || 0;  // ✅ consistent
    } else {
      walletExists = false;
      createWalletBtn.disabled = false;
      addMoneyBtn.disabled = true;
      viewTransactionsBtn.disabled = true;

      walletIdEl.textContent = "Not created";
      walletBalanceEl.textContent = "0";
    }
  } catch (err) {
    console.warn("Wallet load failed:", err.message);
    walletExists = false;
    createWalletBtn.disabled = false;
    addMoneyBtn.disabled = true;
    viewTransactionsBtn.disabled = true;

    walletIdEl.textContent = "Not created";
    walletBalanceEl.textContent = "0";
  }
};


  await loadWallet();

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
  addMoneyBtn?.addEventListener("click", () => addMoneyFormStep1.style.display = "block");
  document.getElementById("cancelAddMoney1")?.addEventListener("click", () => addMoneyFormStep1.style.display = "none");

  document.getElementById("proceedAddMoney")?.addEventListener("click", async () => {
    const amount = document.getElementById("amount").value;
    const pin = document.getElementById("pin").value;

    if (!amount || !pin) { alert("Enter amount and PIN"); return; }

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
// ===== Verify Transaction =====
document.getElementById("confirmAddMoney")?.addEventListener("click", async () => {
  const razorpay_payment_id = document.getElementById("txnId").value;

  if (!razorpay_payment_id) {
    alert("Enter Razorpay Transaction ID");
    return;
  }

  try {
    // Send only razorpay_payment_id now
    await apiFetch("/wallet/verify-add-money", {
      method: "POST",
      body: JSON.stringify({ razorpay_payment_id }),
    });

    alert("Money added successfully!");
    addMoneyFormStep2.style.display = "none";
    await loadWallet(); // reload balance
  } catch (err) {
    console.error(err);
    alert("Failed to verify transaction: " + err.message);
  }
});


  // ===== View Transactions =====
  document.getElementById("viewTransactionsBtn")?.addEventListener("click", async () => {
    try {
      const txns = await apiFetch("/wallet/transactions");
      transactionsList.innerHTML = "";

      txns.data.forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(t.txn_date).toLocaleString()}</td>
          <td>${t.credit || "-"}</td>
          <td>${t.debit || "-"}</td>
          <td>${t.status}</td>
        `;
        transactionsList.appendChild(row);
      });

      transactionsSection.style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transactions");
    }
  });
});
