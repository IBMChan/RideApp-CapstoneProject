const BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {

  // ===== ADMIN LOGIN =====
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
            msgBox.innerText = data.message;
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

        // Redirect to admin dashboard
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

  // ===== LOGOUT =====
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) window.location.href = "/RideApp-CapstoneProject/frontend/public/login.html";
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  }

  // ===== FETCH USERS =====
  const loadUsers = document.getElementById("loadUsers");
  if (loadUsers) {
    loadUsers.addEventListener("click", async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/users`, { credentials: "include" });
        const result = await res.json();
        if (res.ok && result.success) {
          const tbody = document.querySelector("#usersTable tbody");
          tbody.innerHTML = "";
          result.data.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${u._id || u.user_id}</td>
              <td>${u.full_name || "-"}</td>
              <td>${u.email || "-"}</td>
              <td>${u.role || "-"}</td>
            `;
            tbody.appendChild(tr);
          });
        } else console.error(result.message);
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    });
  }

  // ===== FETCH PAYMENTS =====
  const loadPayments = document.getElementById("loadPayments");
  if (loadPayments) {
    loadPayments.addEventListener("click", async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/payments`, { credentials: "include" });
        const result = await res.json();
        if (res.ok && result.success) {
          const tbody = document.querySelector("#paymentsTable tbody");
          tbody.innerHTML = "";
          result.data.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${p._id}</td>
              <td>${p.ride_id}</td>
              <td>${p.fare}</td>
              <td>${p.mode}</td>
              <td>${new Date(p.Payed_At).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
          });
        } else console.error(result.message);
      } catch (err) {
        console.error("Fetch payments error:", err);
      }
    });
  }

  // ===== FETCH WALLET ACCOUNTS =====
  const loadWalletAccounts = document.getElementById("loadWalletAccounts");
  if (loadWalletAccounts) {
    loadWalletAccounts.addEventListener("click", async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/wallet/accounts`, { credentials: "include" });
        const result = await res.json();
        if (res.ok && result.success) {
          const tbody = document.querySelector("#walletTable tbody");
          tbody.innerHTML = "";
          result.data.forEach(w => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${w.wallet_id}</td>
              <td>${w.user_id}</td>
              <td>${w.pin}</td>
              <td>${w.balance}</td>
              <td>${new Date(w.last_updated).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
          });
        } else console.error(result.message);
      } catch (err) {
        console.error("Fetch wallet accounts error:", err);
      }
    });
  }

  // ===== FETCH VEHICLES =====
  const loadVehicles = document.getElementById("loadVehicles");
  if (loadVehicles) {
    loadVehicles.addEventListener("click", async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/vehicles`, { credentials: "include" });
        const result = await res.json();
        if (res.ok && result.success) {
          const tbody = document.querySelector("#vehiclesTable tbody");
          tbody.innerHTML = "";
          result.data.forEach(v => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${v.vehicle_id}</td>
              <td>${v.model}</td>
              <td>${v.plate_no}</td>
              <td>${v.driver_id}</td>
              <td>${v.vehicle_status}</td>
            `;
            tbody.appendChild(tr);
          });
        } else console.error(result.message);
      } catch (err) {
        console.error("Fetch vehicles error:", err);
      }
    });
  }

  // ===== FETCH RIDES =====
  const loadRides = document.getElementById("loadRides");
  if (loadRides) {
    loadRides.addEventListener("click", async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/rides`, { credentials: "include" });
        const result = await res.json();
        if (res.ok && result.success) {
          const tbody = document.querySelector("#ridesTable tbody");
          tbody.innerHTML = "";
          result.data.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${r.ride_id}</td>
              <td>${r.rider_id}</td>
              <td>${r.driver_id || "-"}</td>
              <td>${r.status}</td>
              <td><button data-id="${r.ride_id}" class="viewRideBtn">View</button></td>
            `;
            tbody.appendChild(tr);
          });
        } else console.error(result.message);
      } catch (err) {
        console.error("Fetch rides error:", err);
      }
    });
  }

  // ===== SEARCH RIDE BY ID =====
  const searchRideBtn = document.getElementById("searchRide");
  if (searchRideBtn) {
    searchRideBtn.addEventListener("click", async () => {
      const rideId = document.getElementById("rideIdInput").value;
      if (!rideId) return alert("Enter Ride ID");
      try {
        const res = await fetch(`${BASE_URL}/admin/rides/${rideId}`, { credentials: "include" });
        const result = await res.json();
        if (res.ok && result.success) {
          alert(JSON.stringify(result.data, null, 2));
        } else alert(result.message);
      } catch (err) {
        console.error("Fetch ride by ID error:", err);
      }
    });
  }

});
