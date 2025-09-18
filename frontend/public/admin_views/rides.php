<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vaahan - Rides</title>
  <link rel="stylesheet" href="../../assets/css/style.css" />
  <script src="../../assets/js/admin.js" defer></script>

  <style>
    /* Table styling */
    #ridesTable {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      overflow: hidden;
      background-color: #fff;
      margin-bottom: 1rem;
    }
    #ridesTable thead {
      background-color: #205d6b;
      color: #fff;
    }
    #ridesTable th,
    #ridesTable td {
      padding: 14px 16px;
      text-align: left;
    }
    #ridesTable tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    #ridesTable tbody tr:hover {
      background-color: #f1f1f1;
    }
    /* Filter container */
    .filters {
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    /* Pagination controls */
    .pagination {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }
    .pagination button {
      padding: 6px 12px;
      background-color: #205d6b;
      border: none;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      user-select: none;
    }
    .pagination button:disabled {
      background-color: #888;
      cursor: not-allowed;
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
    <li><a href="vehicles.php" class="sidebar-link">🚘 Vehicles</a></li>
    <li><a href="rides.php" class="sidebar-link active">📝 Rides</a></li>
  </ul>
</aside>

<main class="main-content">
  <h1>Rides 📝</h1>

  <!-- Status Filter -->
  <div class="filters">
    <label for="statusFilter">Filter by Status:</label>
    <select id="statusFilter">
      <option value="">All</option>
      <option value="cancelled">Cancelled</option>
      <option value="completed">Completed</option>
      <option value="requested">Requested</option>
      <option value="in_progress">In Progress</option>
    </select>
  </div>

  <table id="ridesTable">
    <thead>
      <tr>
        <th>Ride ID</th>
        <th>Rider ID</th>
        <th>Driver ID</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <!-- Rides loaded via JS -->
    </tbody>
  </table>

  <!-- Pagination Controls -->
  <div class="pagination">
    <button id="prevPage" disabled>Prev</button>
    <button id="nextPage" disabled>Next</button>
  </div>
</main>

<footer class="footer">
  <p>© 2025 Vaahan Admin Panel</p>
</footer>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = "http://localhost:3000/api";
    const ridesTableBody = document.querySelector("#ridesTable tbody");
    const statusFilter = document.getElementById("statusFilter");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");

    let ridesData = [];
    let filteredRides = [];
    let currentPage = 1;
    const rowsPerPage = 5;  // <-- set rows per page to 2

    async function loadRides() {
      ridesTableBody.innerHTML = '<tr><td colspan="4">Loading rides...</td></tr>';

      try {
        const res = await fetch(`${BASE_URL}/admin/rides`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (data.success && data.data.length) {
          ridesData = data.data;
          applyFilterAndPagination();
        } else {
          ridesTableBody.innerHTML = '<tr><td colspan="4">No rides found.</td></tr>';
          prevBtn.disabled = true;
          nextBtn.disabled = true;
        }
      } catch (error) {
        ridesTableBody.innerHTML = '<tr><td colspan="4">Failed to load rides.</td></tr>';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        console.error("Error loading rides:", error);
      }
    }

    function applyFilterAndPagination() {
      const selectedStatus = statusFilter.value.toLowerCase();
      if (!selectedStatus) {
        filteredRides = ridesData;
      } else {
        filteredRides = ridesData.filter(
          r => (r.status || "").toLowerCase() === selectedStatus
        );
      }

      currentPage = 1; // reset to first page on filter change
      renderTablePage();
    }

    function renderTablePage() {
      if (filteredRides.length === 0) {
        ridesTableBody.innerHTML = '<tr><td colspan="4">No rides found.</td></tr>';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const pageItems = filteredRides.slice(startIndex, endIndex);

      ridesTableBody.innerHTML = "";

      pageItems.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.ride_id}</td>
          <td>${r.rider_id}</td>
          <td>${r.driver_id || "-"}</td>
          <td>${capitalizeStatus(r.status)}</td>
        `;
        ridesTableBody.appendChild(tr);
      });

      // Enable/disable buttons
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = endIndex >= filteredRides.length;
    }

    function capitalizeStatus(status) {
      if (!status) return "-";
      return status
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    statusFilter.addEventListener("change", () => {
      applyFilterAndPagination();
    });

    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTablePage();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage * rowsPerPage < filteredRides.length) {
        currentPage++;
        renderTablePage();
      }
    });

    loadRides();
  });
</script>
</body>
</html>
