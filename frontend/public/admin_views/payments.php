<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vaahan - Payments</title>
  <link rel="stylesheet" href="../../assets/css/style.css" />
  <script src="../../assets/js/admin.js" defer></script>

  <style>
    /* Table styling */
    #paymentsTable {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      overflow: hidden;
      background-color: #fff;
    }
    #paymentsTable thead {
      background-color: #205d6b;
      color: #fff;
    }
    #paymentsTable th,
    #paymentsTable td {
      padding: 14px 16px;
      text-align: left;
    }
    #paymentsTable tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    #paymentsTable tbody tr:hover {
      background-color: #f1f1f1;
    }
    /* Filter container */
    .filters {
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo">🚗 Vaahan Admin</div>
    <nav class="header-nav">
      <a href="admin_dashboard.html" class="nav-link">Home</a>
      <a id="logoutBtn" class="nav-link">Logout</a>
    </nav>
  </header>

  <aside class="sidebar">
    <ul class="sidebar-menu">
      <li><a href="admin_dashboard.html" class="sidebar-link">🏠 Home</a></li>
      <li><a href="viewUsers.php" class="sidebar-link">👥 Manage Users</a></li>
      <li><a href="payments.php" class="sidebar-link active">💰 Payments</a></li>
      <li><a href="wallet.php" class="sidebar-link">💳 Wallet</a></li>
      <li><a href="vehicles.php" class="sidebar-link">🚘 Vehicles</a></li>
      <li><a href="rides.php" class="sidebar-link">📝 Rides</a></li>
    </ul>
  </aside>

  <main class="main-content">
    <h1>Payments 💰</h1>

    <!-- Payment Mode Filter -->
    <div class="filters">
      <label for="modeFilter">Filter by Payment Mode:</label>
      <select id="modeFilter">
        <option value="">All</option>
        <option value="upi">UPI</option>
        <option value="wallet">Wallet</option>
        <option value="cash">Cash</option>
      </select>
    </div>

    <table id="paymentsTable">
      <thead>
        <tr>
          <th>ID</th>
          <th>Ride ID</th>
          <th>Fare</th>
          <th>Mode</th>
          <th>Paid At</th>
        </tr>
      </thead>
      <tbody>
        <!-- Payments loaded via JS -->
      </tbody>
    </table>
  </main>

  <footer class="footer">
    <p>© 2025 Vaahan Admin Panel</p>
  </footer>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const BASE_URL = "http://localhost:3000/api";
      const paymentsTableBody = document.querySelector("#paymentsTable tbody");
      const modeFilter = document.getElementById("modeFilter");
      let paymentsData = [];

      async function loadPayments() {
        paymentsTableBody.innerHTML = '<tr><td colspan="5">Loading payments...</td></tr>';

        try {
          const res = await fetch(`${BASE_URL}/admin/payments`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();

          if (data.success && data.data.length) {
            paymentsData = data.data;
            renderPayments(paymentsData);
          } else {
            paymentsTableBody.innerHTML =
              '<tr><td colspan="5">No payments found.</td></tr>';
          }
        } catch (error) {
          paymentsTableBody.innerHTML =
            '<tr><td colspan="5">Failed to load payments.</td></tr>';
          console.error("Error loading payments:", error);
        }
      }

      function renderPayments(payments) {
        if (payments.length === 0) {
          paymentsTableBody.innerHTML =
            '<tr><td colspan="5">No payments found.</td></tr>';
          return;
        }

        paymentsTableBody.innerHTML = "";
        payments.forEach((p) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${p._id}</td>
            <td>${p.ride_id}</td>
            <td>${p.fare}</td>
            <td>${p.mode}</td>
            <td>${new Date(p.Payed_At).toLocaleString()}</td>
          `;
          paymentsTableBody.appendChild(tr);
        });
      }

      modeFilter.addEventListener("change", () => {
        const selectedMode = modeFilter.value.toLowerCase();
        if (!selectedMode) {
          renderPayments(paymentsData);
        } else {
          const filtered = paymentsData.filter(
            (p) => (p.mode || "").toLowerCase() === selectedMode
          );
          renderPayments(filtered);
        }
      });

      loadPayments();
    });
  </script>
</body>
</html>
