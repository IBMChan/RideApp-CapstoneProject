document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:3000/api";

  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    return res.json();
  };

  /* -------------------------
     ADMIN LOGIN
  ------------------------- */
  const loginForm = document.getElementById("adminLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("adminEmail").value;
      const password = document.getElementById("adminPassword").value;
      const msgBox = document.getElementById("loginError");

      try {
        const res = await fetch(`${BASE_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          if (msgBox) {
            msgBox.textContent = data.message || "Login failed";
            msgBox.style.color = "red";
            msgBox.style.display = "block";
          }
          return;
        }

        if (msgBox) {
          msgBox.textContent = `✅ Welcome, Admin!`;
          msgBox.style.color = "lightgreen";
          msgBox.style.display = "block";
        }

        window.location.href = "/RideApp-CapstoneProject/frontend/public/admin_views/admin_dashboard.html";
      } catch (err) {
        console.error("Login failed:", err);
        if (msgBox) {
          msgBox.textContent = "❌ Server error, please try again later.";
          msgBox.style.color = "red";
          msgBox.style.display = "block";
        }
      }
    });
  }

  /* -------------------------
     LOGOUT
  ------------------------- */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetchJSON(`${BASE_URL}/auth/logout`, { method: "POST" });
      window.location.href = "/RideApp-CapstoneProject/frontend/public/admin_login.html";
    });
  }

  /* -------------------------
     USERS
  ------------------------- */
  async function loadUsers() {
    const usersTable = document.querySelector("#usersTable tbody");
    if (!usersTable) return;
    const res = await fetchJSON(`${BASE_URL}/admin/users`);
    usersTable.innerHTML = "";
    if (res.success && res.data.length) {
      res.data.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.user_id || u._id}</td>
          <td>${u.full_name || "-"}</td>
          <td>${u.email || "-"}</td>
          <td>${u.role || "-"}</td>
        `;
        usersTable.appendChild(tr);
      });
    } else {
      usersTable.innerHTML = "<tr><td colspan='4'>No users found.</td></tr>";
    }
  }

  /* -------------------------
     PAYMENTS
  ------------------------- */
  async function loadPayments() {
    const paymentsTable = document.querySelector("#paymentsTable tbody");
    if (!paymentsTable) return;
    const res = await fetchJSON(`${BASE_URL}/admin/payments`);
    paymentsTable.innerHTML = "";
    if (res.success && res.data.length) {
      res.data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p._id}</td>
          <td>${p.ride_id}</td>
          <td>${p.fare}</td>
          <td>${p.mode}</td>
          <td>${new Date(p.Payed_At).toLocaleString()}</td>
        `;
        paymentsTable.appendChild(tr);
      });
    } else {
      paymentsTable.innerHTML = "<tr><td colspan='5'>No payments found.</td></tr>";
    }
  }

  /* -------------------------
     WALLET ACCOUNTS
  ------------------------- */
  async function loadWalletAccounts() {
    const walletTable = document.querySelector("#walletTable tbody");
    if (!walletTable) return;
    const res = await fetchJSON(`${BASE_URL}/admin/wallet/accounts`);
    walletTable.innerHTML = "";
    if (res.success && res.data.length) {
      res.data.forEach(w => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${w.wallet_id}</td>
          <td>${w.user_id}</td>
          <td>${w.pin}</td>
          <td>${w.balance}</td>
          <td>${new Date(w.last_updated).toLocaleString()}</td>
        `;
        walletTable.appendChild(tr);
      });
    } else {
      walletTable.innerHTML = "<tr><td colspan='5'>No wallet accounts found.</td></tr>";
    }
  }

  /* -------------------------
     VEHICLES
  ------------------------- */
  async function loadVehicles() {
    const vehiclesTable = document.querySelector("#vehiclesTable tbody");
    if (!vehiclesTable) return;
    const res = await fetchJSON(`${BASE_URL}/admin/vehicles`);
    vehiclesTable.innerHTML = "";
    if (res.success && res.data.length) {
      res.data.forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${v.vehicle_id}</td>
          <td>${v.model}</td>
          <td>${v.plate_no}</td>
          <td>${v.driver_id}</td>
          <td>${v.vehicle_status}</td>
        `;
        vehiclesTable.appendChild(tr);
      });
    } else {
      vehiclesTable.innerHTML = "<tr><td colspan='5'>No vehicles found.</td></tr>";
    }
  }

  /* -------------------------
     RIDES
  ------------------------- */
  async function loadRides() {
    const ridesTable = document.querySelector("#ridesTable tbody");
    if (!ridesTable) return;
    const res = await fetchJSON(`${BASE_URL}/admin/rides`);
    ridesTable.innerHTML = "";
    if (res.success && res.data.length) {
      res.data.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.ride_id}</td>
          <td>${r.rider_id}</td>
          <td>${r.driver_id || "-"}</td>
          <td>${r.status}</td>
        `;
        ridesTable.appendChild(tr);
      });
    } else {
      ridesTable.innerHTML = "<tr><td colspan='4'>No rides found.</td></tr>";
    }
  }

  /* -------------------------
     AUTO-LOAD DASHBOARD DATA
  ------------------------- */
  loadUsers();
  loadPayments();
  loadWalletAccounts();
  loadVehicles();
  loadRides();
});
