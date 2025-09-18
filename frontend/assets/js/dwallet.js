const BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
  // helper to safely get elements
  const $ = (id) => document.getElementById(id);

  const walletIdEl = $("walletId");
  const walletBalanceEl = $("walletBalance");
  const createWalletBtn = $("createWalletBtn");
  const addMoneyBtn = $("addMoneyBtn");
  const withdrawMoneyBtn = $("withdrawMoneyBtn");
  const viewTransactionsBtn = $("viewTransactionsBtn");

  const createWalletForm = $("createWalletForm");
  const addMoneyFormStep1 = $("addMoneyFormStep1");
  const addMoneyFormStep2 = $("addMoneyFormStep2");
  const withdrawMoneyForm = $("withdrawMoneyForm");
  const transactionsSection = $("transactionsSection");
  const transactionsList = $("transactionsList");

  let walletExists = false;

  // ===== API Fetch (robust) =====
  const apiFetch = async (endpoint, options = {}) => {
    // clone options so we can modify body safely
    const opts = { ...options };

    // if body is present and is an object, stringify it
    if (opts.body && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
    }

    // ensure headers object exists
    opts.headers = {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    };

    // include credentials for cookies
    opts.credentials = opts.credentials || "include";

    let res;
    try {
      res = await fetch(`${BASE_URL}${endpoint}`, opts);
    } catch (networkErr) {
      console.error("Network error calling", endpoint, networkErr);
      throw new Error("Network error. Is the backend running?");
    }

    // try to parse body safely
    let payload = null;
    const text = await res.text().catch(() => null);
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!res.ok) {
      // prefer a readable message from payload
      const msg = payload && (payload.message || payload.error) ? (payload.message || payload.error) : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return payload;
  };

  // ===== Helpers to hide/show forms =====
  const hideAllForms = () => {
    [createWalletForm, addMoneyFormStep1, addMoneyFormStep2, withdrawMoneyForm, transactionsSection].forEach((el) => {
      if (el) el.style.display = "none";
    });
  };

  const show = (el) => { if (el) el.style.display = "block"; };
  const hide = (el) => { if (el) el.style.display = "none"; };

  // ===== Load Wallet =====
  async function loadWallet() {
    try {
      const data = await apiFetch("/wallet/balance");
      // Data shape may be { success: true, data: {...} } or just {...}
      const walletData = (data && data.data) ? data.data : data;

      if (!walletData) {
        walletIdEl && (walletIdEl.textContent = "N/A");
        walletBalanceEl && (walletBalanceEl.textContent = "₹0");
        walletExists = false;
        if (addMoneyBtn) addMoneyBtn.disabled = true;
        if (withdrawMoneyBtn) withdrawMoneyBtn.disabled = true;
        if (viewTransactionsBtn) viewTransactionsBtn.disabled = true;
        return;
      }

      walletIdEl && (walletIdEl.textContent = walletData.wallet_id || "N/A");
      walletBalanceEl && (walletBalanceEl.textContent = `₹${walletData.balance ?? 0}`);
      walletExists = true;
      if (addMoneyBtn) addMoneyBtn.disabled = false;
      if (withdrawMoneyBtn) withdrawMoneyBtn.disabled = false;
      if (viewTransactionsBtn) viewTransactionsBtn.disabled = false;
    } catch (err) {
      console.error("loadWallet error:", err);
      walletIdEl && (walletIdEl.textContent = "N/A");
      walletBalanceEl && (walletBalanceEl.textContent = "₹0");
      walletExists = false;
      if (addMoneyBtn) addMoneyBtn.disabled = true;
      if (withdrawMoneyBtn) withdrawMoneyBtn.disabled = true;
      if (viewTransactionsBtn) viewTransactionsBtn.disabled = true;
    }
  }

  // ===== Load Transactions =====
  async function loadTransactions() {
    try {
      const data = await apiFetch("/wallet/transactions");
      // support multiple shapes
      const txns = (data && data.data && data.data.transactions) ? data.data.transactions : (data && data.transactions) ? data.transactions : (Array.isArray(data) ? data : []);
      transactionsList && (transactionsList.innerHTML = "");
      txns.forEach((txn) => {
        const tr = document.createElement("tr");
        const date = new Date(txn.txn_date || txn.created_at || txn.createdAt || txn.date || Date.now());
        tr.innerHTML = `
          <td>${date.toLocaleString()}</td>
          <td>${txn.credit ? "₹" + txn.credit : "-"}</td>
          <td>${txn.debit ? "₹" + txn.debit : "-"}</td>
          <td>${txn.status || txn.txn_status || "pending"}</td>
        `;
        transactionsList.appendChild(tr);
      });
    } catch (err) {
      console.error("loadTransactions error:", err);
      // keep UI quiet but log for debugging
    }
  }

  // ===== Create Wallet =====
  createWalletBtn?.addEventListener("click", () => {
    hideAllForms();
    show(createWalletForm);
  });

  $("cancelCreateWallet")?.addEventListener("click", () => hide(createWalletForm));

  $("proceedCreateWallet")?.addEventListener("click", async () => {
    const pin = $("newPin")?.value?.trim();
    if (!pin || pin.length !== 4) {
      return alert("Enter a valid 4-digit PIN");
    }
    try {
      $("proceedCreateWallet").disabled = true;
      await apiFetch("/wallet/create", { method: "POST", body: { pin } });
      alert("Wallet created successfully!");
      hide(createWalletForm);
      await loadWallet();
    } catch (err) {
      console.error("create wallet:", err);
      alert("Failed to create wallet: " + err.message);
    } finally {
      $("proceedCreateWallet").disabled = false;
    }
  });

  // ===== Add Money (Rider) - 2 step =====
  addMoneyBtn?.addEventListener("click", () => {
    hideAllForms();
    show(addMoneyFormStep1);
  });

  $("cancelAddMoney1")?.addEventListener("click", () => hide(addMoneyFormStep1));
  $("cancelAddMoney2")?.addEventListener("click", () => hide(addMoneyFormStep2));

  $("proceedAddMoney")?.addEventListener("click", async () => {
    const amount = $("amount")?.value;
    const pin = $("pin")?.value;
    if (!amount || !pin) return alert("Enter amount and PIN");
    try {
      $("proceedAddMoney").disabled = true;
      const res = await apiFetch("/wallet/add-money", { method: "POST", body: { amount, pin } });
      // server should return something like { success:true, txn_id: "..."}
      const txnId = (res && (res.txn_id || (res.data && res.data.txn_id))) || "";
      // show step 2
      hide(addMoneyFormStep1);
      if (addMoneyFormStep2) {
        addMoneyFormStep2.dataset.txnId = txnId || "";
        show(addMoneyFormStep2);
      }
      alert("Payment initiated. Enter Razorpay txn id to confirm.");
    } catch (err) {
      console.error("proceedAddMoney:", err);
      alert("Failed to initiate payment: " + err.message);
    } finally {
      $("proceedAddMoney").disabled = false;
    }
  });

  $("confirmAddMoney")?.addEventListener("click", async () => {
    const razorpay_payment_id = $("txnId")?.value?.trim();
    if (!razorpay_payment_id) return alert("Enter Razorpay Transaction ID");
    try {
      $("confirmAddMoney").disabled = true;
      await apiFetch("/wallet/verify-add-money", { method: "POST", body: { razorpay_payment_id } });
      alert("Money added successfully!");
      hide(addMoneyFormStep2);
      await loadWallet();
      await loadTransactions();
    } catch (err) {
      console.error("confirmAddMoney:", err);
      alert("Failed to verify transaction: " + err.message);
    } finally {
      $("confirmAddMoney").disabled = false;
    }
  });

  // ===== Withdraw Money (Driver) =====
  withdrawMoneyBtn?.addEventListener("click", () => {
    hideAllForms();
    show(withdrawMoneyForm);
  });

  $("cancelWithdraw")?.addEventListener("click", () => hide(withdrawMoneyForm));

  $("proceedWithdraw")?.addEventListener("click", async () => {
    const amount = $("withdrawAmount")?.value;
    const pin = $("withdrawPin")?.value;
    if (!amount || !pin) return alert("Enter amount and PIN");
    try {
      $("proceedWithdraw").disabled = true;
      await apiFetch("/wallet/withdraw", { method: "POST", body: { amount, pin } });
      alert("Withdrawal initiated successfully!");
      hide(withdrawMoneyForm);
      await loadWallet();
      await loadTransactions();
    } catch (err) {
      console.error("proceedWithdraw:", err);
      alert("Withdrawal failed: " + err.message);
    } finally {
      $("proceedWithdraw").disabled = false;
    }
  });

  // ===== View Transactions =====
  viewTransactionsBtn?.addEventListener("click", async () => {
    hideAllForms();
    await loadTransactions();
    show(transactionsSection);
  });

  // ===== Init on load =====
  await loadWallet();
  // optionally load txns if you want to show them on page load:
  // await loadTransactions();
});
