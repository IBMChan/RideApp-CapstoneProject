<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vaahan - Manage Users</title>
  <link rel="stylesheet" href="../../assets/css/style.css" />
  <script src="../../assets/js/admin.js" defer></script>
  <style>
    /* Existing filter container style */
    .filters {
      margin: 1rem 0;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    /* Improved Table Styling */
    table#usersTable {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      overflow: hidden;
      background-color: white;
    }

    table#usersTable thead {
      background-color: #205d6b;
      color: white;
    }

    table#usersTable th {
      text-align: left;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 15px;
    }

    table#usersTable td {
      padding: 14px 16px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #333;
    }

    table#usersTable tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    table#usersTable tbody tr:hover {
      background-color: #f1f1f1;
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
      <li><a href="viewUsers.php" class="sidebar-link active">👥 Manage Users</a></li>
      <li><a href="payments.php" class="sidebar-link">💰 Payments</a></li>
      <li><a href="wallet.php" class="sidebar-link">💳 Wallet</a></li>
      <li><a href="vehicles.php" class="sidebar-link">🚘 Vehicles</a></li>
      <li><a href="rides.php" class="sidebar-link">📝 Rides</a></li>
    </ul>
  </aside>

  <main class="main-content">
    <h1>Manage Users 👥</h1>

    <!-- Role Filter -->
    <div class="filters">
      <label for="roleFilter">Filter by Role:</label>
      <select id="roleFilter">
        <option value="">All</option>
        <option value="driver">Driver</option>
        <option value="rider">Rider</option>
      </select>
    </div>

    <table id="usersTable">
      <thead>
        <tr>
          <th>ID</th>
          <th>Full Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Gender</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <!-- Populated via admin.js -->
      </tbody>
    </table>
  </main>

  <footer class="footer">
    <p>© 2025 Vaahan Admin Panel</p>
  </footer>

  <!-- Script to enable filtering -->
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const roleFilter = document.getElementById("roleFilter");

      if (!roleFilter) return;

      const BASE_URL = "http://localhost:3000/api";

      async function loadUsers(role = "") {
        try {
          const res = await fetch(`${BASE_URL}/admin/users`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          });
          const data = await res.json();

          const tbody = document.querySelector("#usersTable tbody");
          tbody.innerHTML = "";

          const users = data.success ? data.data : [];

          const filtered = role
            ? users.filter(u => (u.role || "").toLowerCase() === role.toLowerCase())
            : users;

          if (filtered.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6'>No users found.</td></tr>";
            return;
          }

          filtered.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${u.user_id || u._id}</td>
              <td>${u.full_name || "-"}</td>
              <td>${u.email || "-"}</td>
              <td>${u.role || "-"}</td>
              <td>${u.gender || "-"}</td>
              <td>${u.status || "-"}</td>
            `;
            tbody.appendChild(tr);
          });
        } catch (error) {
          console.error("Error loading users:", error);
        }
      }

      // Initial load of all users
      loadUsers();

      // Filter users when role changes
      roleFilter.addEventListener("change", () => {
        loadUsers(roleFilter.value);
      });
    });
  </script>
</body>
</html>
