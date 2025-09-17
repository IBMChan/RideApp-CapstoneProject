<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vaahan - Vehicles</title>
  <link rel="stylesheet" href="../../assets/css/style.css">
  <script src="../../assets/js/admin.js" defer></script>
</head>
<body>

<header class="header">
  <div class="logo">🚗 Vaahan Admin</div>
  <nav class="header-nav">
    <a href="admin_dashboard.html" class="nav-link">Dashboard</a>
    <a id="logoutBtn" class="nav-link">Logout</a>
    <a href="#profile" class="nav-link"><div class="profile-pic">A</div></a>
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
  <h1>Vehicles 🚘</h1>
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
    if (document.querySelector("#vehiclesTable")) {
      loadVehicles();
    }
  });
</script>
</body>
</html>
