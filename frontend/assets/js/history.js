// console.log("history.js loaded");

// // Get driverId from localStorage/session
// const driverId = JSON.parse(localStorage.getItem("user")).id;

// const statusFilter = document.getElementById("statusFilter");
// const dateFilter = document.getElementById("dateFilter");
// const historyBody = document.getElementById("historyBody");

// // Function to fetch ride history
// async function loadHistory() {
//   historyBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

//   try {
//     const res = await fetch(`http://localhost:3000/api/driver/rides`, {
//     method: "GET",
//     headers: {
//        "Content-Type": "application/json",
//     },
//     credentials: "include",   // ✅ send cookies
//     });
//     const response = await res.json();
//     historyBody.innerHTML = "";

//     if (!response.success || !response.data || response.data.length === 0) {
//       historyBody.innerHTML = `<tr><td colspan="4">No rides found</td></tr>`;
//       return;
//     }

//     renderRides(response.data);

//   } catch (err) {
//     console.error("Error loading history:", err);
//     historyBody.innerHTML = `<tr><td colspan="4">Error loading rides</td></tr>`;
//   }
// }

// // Function to render rides with filters applied
// function renderRides(rides) {
//   historyBody.innerHTML = "";

//   const statusValue = statusFilter.value;
//   const dateValue = dateFilter.value;

//   rides
//     .filter((ride) => {
//       let matchesStatus = !statusValue || ride.status === statusValue;
//       let matchesDate = true;

//       if (dateValue) {
//         const rideDate = ride.ride_date
//           ? new Date(ride.ride_date).toISOString().split("T")[0]
//           : null;
//         matchesDate = rideDate === dateValue;
//       }

//       return matchesStatus && matchesDate;
//     })
//     .forEach((ride) => {
//       const row = document.createElement("tr");

//       const rideDate = ride.ride_date ? new Date(ride.ride_date) : null;

//       const formattedDate =
//         rideDate && !isNaN(rideDate)
//           ? rideDate.toLocaleDateString("en-IN", {
//               day: "2-digit",
//               month: "2-digit",
//               year: "numeric",
//             })
//           : "N/A";

//       row.innerHTML = `
//         <td>${ride.ride_id}</td>
//         <td>${ride.rider_id || "N/A"}</td>
//         <td class="${
//           ride.status === "completed"
//             ? "status-completed"
//             : ride.status === "cancelled"
//             ? "status-cancelled"
//             : ""
//         }">${ride.status}</td>
//         <td>${formattedDate}</td>
//       `;
//       historyBody.appendChild(row);
//     });
// }

// // Event listeners for filters
// statusFilter.addEventListener("change", () => loadHistory());
// dateFilter.addEventListener("change", () => loadHistory());

// // Load history on page load
// document.addEventListener("DOMContentLoaded", loadHistory);


console.log("history.js loaded");

const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const historyBody = document.getElementById("historyBody");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ✅ Get logged-in user using token in cookie
    const res = await fetch("http://localhost:3000/api/auth/me", {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.warn("⚠️ Not logged in");
      historyBody.innerHTML = `<tr><td colspan="4">You are not logged in</td></tr>`;
      return;
    }

    const driverId = data.user.id;
    console.log("✅ Logged-in driver ID:", driverId);

    // ✅ Load history for this driver
    loadHistory();

    // ✅ Attach filter event listeners
    statusFilter.addEventListener("change", loadHistory);
    dateFilter.addEventListener("change", loadHistory);

  } catch (err) {
    console.error("Error fetching logged-in user:", err);
    historyBody.innerHTML = `<tr><td colspan="4">Error verifying login</td></tr>`;
  }
});

// Function to fetch ride history
async function loadHistory() {
  historyBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  try {
    const res = await fetch("http://localhost:3000/api/driver/rides", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    });

    const response = await res.json();
    historyBody.innerHTML = "";

    if (!response.success || !response.data || response.data.length === 0) {
      historyBody.innerHTML = `<tr><td colspan="4">No rides found</td></tr>`;
      return;
    }

    renderRides(response.data);

  } catch (err) {
    console.error("Error loading history:", err);
    historyBody.innerHTML = `<tr><td colspan="4">Error loading rides</td></tr>`;
  }
}

// Function to render rides with filters applied
function renderRides(rides) {
  historyBody.innerHTML = "";

  const statusValue = statusFilter.value;
  const dateValue = dateFilter.value;

  rides
    .filter((ride) => {
      const matchesStatus = !statusValue || ride.status === statusValue;
      let matchesDate = true;

      if (dateValue) {
        const rideDate = ride.ride_date
          ? new Date(ride.ride_date).toISOString().split("T")[0]
          : null;
        matchesDate = rideDate === dateValue;
      }

      return matchesStatus && matchesDate;
    })
    .forEach((ride) => {
      const row = document.createElement("tr");

      const rideDate = ride.ride_date ? new Date(ride.ride_date) : null;

      const formattedDate =
        rideDate && !isNaN(rideDate)
          ? rideDate.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A";

      row.innerHTML = `
        <td>${ride.ride_id}</td>
        <td>${ride.rider_id || "N/A"}</td>
        <td class="${
          ride.status === "completed"
            ? "status-completed"
            : ride.status === "cancelled"
            ? "status-cancelled"
            : ""
        }">${ride.status}</td>
        <td>${formattedDate}</td>
      `;

      historyBody.appendChild(row);
    });
}
