<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vaahan - Rides</title>
  <link rel="stylesheet" href="../../assets/css/style.css">
  <script src="../../assets/js/main.js" ></script>
  <script src="../../assets/js/admin.js" ></script>
</head>
<body>
<header class="header">
  <div class="logo">🚗 Vaahan Admin</div>
  <nav class="header-nav">
    <a href="admin_dashboard.html" class="nav-link">Dashboard</a>
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
    <li><a href="rides.php" class="sidebar-link">📝 Rides</a></li>
  </ul>
</aside>

<main class="main-content">
  <h1>Rides 📝</h1>
  <table id="ridesTable">
    <thead>
      <tr>
        <th>ID</th>
        <th>Rider ID</th>
        <th>Driver ID</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Rides loaded via admin.js -->
    </tbody>
  </table>
  <input type="text" id="rideIdInput" placeholder="Ride ID">
  <button id="searchRide">Search Ride</button>
  <button id="loadRides">Load All Rides</button>
  <button id="loadStats">Load Stats</button>
  <div id="rideStats"></div>
</main>

<footer class="footer">
  <p>© 2025 Vaahan Admin Panel</p>
</footer>
</body>
</html>
