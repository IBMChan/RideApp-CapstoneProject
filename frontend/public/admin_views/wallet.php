<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vaahan - Wallet Accounts</title>
  <link rel="stylesheet" href="../../assets/css/style.css" />
  <script src="../../assets/js/admin.js" defer></script>
  <style>
    main.main-content {
      padding: 1rem 2rem;
    }
    h1 {
      margin-bottom: 1rem;
    }
    table#walletTable {
      width: 100%;
      border-collapse: collapse;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 0.95rem;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      border-radius: 8px;
      overflow: hidden;
    }
    table#walletTable thead {
      background-color: #245f73;
      color: #fff;
    }
    table#walletTable th,
    table#walletTable td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e1e1e1;
    }
    table#walletTable tbody tr:hover {
      background-color: #f1f7ff;
      cursor: default;
    }
    @media (max-width: 600px) {
      table#walletTable th, table#walletTable td {
        padding: 10px 8px;
        font-size: 0.85rem;
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
    <li><a href="wallet.php" class="sidebar-link active">💳 Wallet</a></li>
    <li><a href="vehicles.php" class="sidebar-link">🚘 Vehicles</a></li>
    <li><a href="rides.php" class="sidebar-link">📝 Rides</a></li>
  </ul>
</aside>

<main class="main-content">
  <h1>Wallet Accounts 💳</h1>
  <table id="walletTable">
    <thead>
      <tr>
        <th>Wallet ID</th>
        <th>User ID</th>
        <th>PIN</th>
        <th>Balance</th>
        <th>Last Updated</th>
      </tr>
    </thead>
    <tbody>
      <!-- Wallet accounts loaded via admin.js -->
    </tbody>
  </table>
</main>

<footer class="footer">
  <p>© 2025 Vaahan Admin Panel</p>
</footer>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#walletTable")) {
      loadWalletAccounts();
    }
  });
</script>
</body>
</html>
