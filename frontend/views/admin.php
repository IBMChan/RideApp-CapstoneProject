<!-- adminPanel.php -->
<!DOCTYPE html>
<html>
<head>
  <title>Ride Admin Panel</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }
    th { background: #f4f4f4; }
    .stats { margin: 20px 0; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
    .btn { padding: 5px 10px; margin: 2px; cursor: pointer; border: none; border-radius: 3px; }
    .btn-edit { background: #007BFF; color: white; }
    .btn-delete { background: #DC3545; color: white; }
  </style>
</head>
<body>
  <h1>Admin Panel - Ride Management</h1>

  <div class="stats" id="stats"></div>

  <table id="ridesTable">
    <thead>
      <tr>
        <th>ID</th>
        <th>Rider</th>
        <th>Driver</th>
        <th>Status</th>
        <th>Fare</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <script>
    const API_BASE = "http://localhost:3000/api/admin";

    async function fetchStats() {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      if (data.success) {
        document.getElementById("stats").innerHTML =
          `<strong>Total:</strong> ${data.data.total} |
           <strong>Completed:</strong> ${data.data.completed} |
           <strong>Cancelled:</strong> ${data.data.cancelled} |
           <strong>Ongoing:</strong> ${data.data.ongoing}`;
      }
    }

    async function fetchRides() {
      const res = await fetch(`${API_BASE}/rides`);
      const data = await res.json();
      const tbody = document.querySelector("#ridesTable tbody");
      tbody.innerHTML = "";

      data.data.forEach(ride => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${ride.ride_id}</td>
          <td>${ride.rider_id}</td>
          <td>${ride.driver_id || '-'}</td>
          <td>${ride.status}</td>
          <td>${ride.fare}</td>
          <td>${new Date(ride.ride_date).toLocaleString()}</td>
          <td>
            <button class="btn btn-edit" onclick="editRide(${ride.ride_id})">Edit</button>
            <button class="btn btn-delete" onclick="deleteRide(${ride.ride_id})">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    async function deleteRide(id) {
      if (!confirm("Are you sure you want to delete this ride?")) return;
      await fetch(`${API_BASE}/rides/${id}`, { method: "DELETE" });
      fetchRides();
      fetchStats();
    }

    function editRide(id) {
      const newStatus = prompt("Enter new status (requested, accepted, in_progress, completed, cancelled):");
      if (newStatus) {
        fetch(`${API_BASE}/rides/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        }).then(() => { fetchRides(); fetchStats(); });
      }
    }

    // Initialize
    fetchStats();
    fetchRides();
  </script>
</body>
</html>
