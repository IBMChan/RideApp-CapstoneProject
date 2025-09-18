<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vaahan - Vehicles</title>
  <link rel="stylesheet" href="../../assets/css/style.css" />
  <script src="../../assets/js/admin.js" defer></script>
  <style>
    /* Add spacing and styling similar to your previous tables */
    main.main-content {
      padding: 1rem 2rem;
    }
    h1 {
      margin-bottom: 1rem;
    }
    /* Filters container */
    .filters {
      margin: 1rem 0 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    label {
      font-weight: 600;
      font-size: 1rem;
    }
    select {
      padding: 6px 10px;
      font-size: 1rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      background-color: #fff;
      cursor: pointer;
      min-width: 120px;
    }
    /* Table styling */
    table#vehiclesTable {
      width: 100%;
      border-collapse: collapse;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 0.95rem;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      border-radius: 8px;
      overflow: hidden;
    }
    table#vehiclesTable thead {
      background-color: #245f73;
      color: #fff;
    }
    table#vehiclesTable th,
    table#vehiclesTable td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e1e1e1;
    }
    table#vehiclesTable tbody tr:hover {
      background-color: #f1f7ff;
      cursor: default;
    }
    /* Responsive */
    @media (max-width: 600px) {
      table#vehiclesTable th, table#vehiclesTable td {
        padding: 10px 8px;
        font-size: 0.85rem;
      }
      .filters {
        flex-direction: column;
        align-items: flex-start;
      }
      select {
        min-width: 100%;
      }
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
      <li><a href="payments.php" class="sidebar-link">💰 Payments</a></li>
      <li><a href="wallet.php" class="sidebar-link">💳 Wallet</a></li>
      <li><a href="vehicles.php" class="sidebar-link active">🚘 Vehicles</a></li>
      <li><a href="rides.php" class="sidebar-link">📝 Rides</a></li>
    </ul>
  </aside>

  <main class="main-content">
    <h1>Vehicles 🚘</h1>

    <!-- Filter -->
    <div class="filters">
      <label for="statusFilter">Filter by Status:</label>
      <select id="statusFilter">
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <table id="vehiclesTable">
      <thead>
        <tr>
          <th>Vehicle ID</th>
          <th>Model</th>
          <th>Plate No</th>
          <th>Driver ID</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <!-- Vehicles loaded via admin.js -->
      </tbody>
    </table>
  </main>

  <footer class="footer">
    <p>© 2025 Vaahan Admin Panel</p>
  </footer>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      if (!document.querySelector("#vehiclesTable")) return;

      const statusFilter = document.getElementById("statusFilter");
      let vehicles = [];

      // Fetch all vehicles once
      async function fetchVehicles() {
        try {
          const res = await fetch("http://localhost:3000/api/admin/vehicles", {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();
          if (data.success) {
            vehicles = data.data || [];
            renderTable(vehicles);
          } else {
            renderTable([]);
          }
        } catch (err) {
          console.error("Failed to fetch vehicles", err);
          renderTable([]);
        }
      }

      function renderTable(data) {
        const tbody = document.querySelector("#vehiclesTable tbody");
        tbody.innerHTML = "";

        if (!data.length) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No vehicles found.</td></tr>`;
          return;
        }

        data.forEach((v) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${v.vehicle_id || "-"}</td>
            <td>${v.model || "-"}</td>
            <td>${v.plate_no || "-"}</td>
            <td>${v.driver_id || "-"}</td>
            <td style="text-transform: capitalize;">${v.vehicle_status || "-"}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Filter and render vehicles on filter change
      statusFilter.addEventListener("change", () => {
        const selectedStatus = statusFilter.value.toLowerCase();
        if (!selectedStatus) {
          renderTable(vehicles);
        } else {
          const filtered = vehicles.filter(v => (v.vehicle_status || "").toLowerCase() === selectedStatus);
          renderTable(filtered);
        }
      });

      // Initial load
      fetchVehicles();
    });
  </script>
</body>
</html>
