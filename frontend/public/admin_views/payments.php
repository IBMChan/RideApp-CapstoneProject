<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vaahan - Payments</title>
  <link rel="stylesheet" href="../../assets/css/style.css">
  <script src="../../assets/js/main.js" defer></script>
  <script src="../../assets/js/admin.js" defer></script>
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
  <h1>Payments 💰</h1>
  <table id="paymentsTable">
    <thead>
      <tr>
        <th>ID</th>
        <th>User ID</th>
        <th>Amount</th>
        <th>Mode</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <!-- Payments loaded via admin.js -->
    </tbody>
  </table>
  <button id="loadPayments">Load Payments</button>
</main>

<footer class="footer">
  <p>© 2025 Vaahan Admin Panel</p>
</footer>
</body>
</html>
