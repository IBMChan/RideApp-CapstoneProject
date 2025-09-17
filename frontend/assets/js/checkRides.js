// console.log("checkRides.js loaded");

// // // Get driverId from localStorage/session
// // const driver = JSON.parse(localStorage.getItem("user")).id;

// // const driverId = user.id;

// const res = await fetch("http://localhost:3000/api/auth/me", {
//   credentials: "include"
// });
// const data = await res.json();
// console.log("Logged-in user:", data.user);

// // Function to fetch rides
// async function loadRides() {
//   const ridesBody = document.getElementById("ridesBody");
//   ridesBody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

//   try {
//     const res = await fetch(`http://localhost:3000/api/rides/matched/${driverId}`);
//     const response = await res.json();

//     ridesBody.innerHTML = "";

//     if (!response.success || response.data.length === 0) {
//       ridesBody.innerHTML = `<tr><td colspan="6">No rides found</td></tr>`;
//       return;
//     }

//     // Loop through response.data
//     response.data.forEach(item => {
//       const ride = item.ride; // Backend returns ride nested inside item.ride

//       // Parse pickup/drop if stored as JSON string
//       let pickup = ride.pickup_loc;
//       let drop = ride.drop_loc;
//       try {
//         const p = JSON.parse(ride.pickup_loc);
//         const d = JSON.parse(ride.drop_loc);
//         pickup = `Lat: ${p.lat}, Lng: ${p.lng}`;
//         drop = `Lat: ${d.lat}, Lng: ${d.lng}`;
//       } catch (e) {}

//       const row = document.createElement("tr");
//       row.innerHTML = `
//         <td>${ride.ride_id}</td>
//         <td>${item.rider_name || "N/A"}</td>
//         <td>${pickup}</td>
//         <td>${drop}</td>
//         <td class="status" style="font-weight:bold;">${ride.status}</td>
//         <td>
//           ${ride.status === "accepted" ? 
//             "<span style='color:green;font-weight:bold;'>Accepted</span>" :
//             `<button class="accept-btn" data-id="${ride.ride_id}">Accept</button>`
//           }
//         </td>
//       `;
//       ridesBody.appendChild(row);
//     });

//     // Attach event listeners for accept buttons
//     document.querySelectorAll(".accept-btn").forEach(btn => {
//       btn.addEventListener("click", () => acceptRide(btn.dataset.id, btn));
//     });

//   } catch (err) {
//     console.error(err);
//     ridesBody.innerHTML = `<tr><td colspan="6">Error loading rides</td></tr>`;
//   }
// }
 

// async function acceptRide(rideId, btn) {
//   try {
//     const res = await fetch(`http://localhost:3000/api/rides/accept/${rideId}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       credentials: 'include' // ✅ send cookies automatically
//     });

//     const data = await res.json();
//     console.log("Accept ride response:", data);

//     if (data.success) {
//       const row = btn.closest("tr");
//       row.querySelector(".status").textContent = "accepted";
//       row.querySelector(".status").style.color = "green";
//       btn.replaceWith("✔️ Accepted");
//     } else {
//       alert(data.message || "Failed to accept ride");
//     }

//   } catch (err) {
//     console.error("Error accepting ride:", err);
//     alert("Error accepting ride");
//   }
// }



// // Load rides when page opens
// document.addEventListener("DOMContentLoaded", loadRides);
console.log("checkRides.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🔒 Get user from /me route
    const res = await fetch("http://localhost:3000/api/auth/me", {
      credentials: "include"
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("Not logged in");
      // Optional: redirect to login
      return;
    }

    const driverId = data.user.id;
    console.log("Logged-in user:", data.user);

    // ✅ Now load rides with the driverId
    loadRides(driverId);

  } catch (err) {
    console.error("Error fetching logged-in user:", err);
  }
});

// Function to fetch rides
async function loadRides(driverId) {
  const ridesBody = document.getElementById("ridesBody");
  ridesBody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

  try {
    const res = await fetch(`http://localhost:3000/api/rides/matched/${driverId}`, {
      credentials: 'include' // just in case
    });
    const response = await res.json();

    ridesBody.innerHTML = "";

    if (!response.success || response.data.length === 0) {
      ridesBody.innerHTML = `<tr><td colspan="6">No rides found</td></tr>`;
      return;
    }

    // Loop through rides
    response.data.forEach(item => {
      const ride = item.ride;

      let pickup = ride.pickup_loc;
      let drop = ride.drop_loc;

      try {
        const p = typeof pickup === 'string' ? JSON.parse(pickup) : pickup;
        const d = typeof drop === 'string' ? JSON.parse(drop) : drop;
        pickup = `Lat: ${p.lat}, Lng: ${p.lng}`;
        drop = `Lat: ${d.lat}, Lng: ${d.lng}`;
      } catch (e) {
        console.warn("Invalid pickup/drop format");
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ride.ride_id}</td>
        <td>${item.rider_name || "N/A"}</td>
        <td>${pickup}</td>
        <td>${drop}</td>
        <td class="status" style="font-weight:bold;">${ride.status}</td>
        <td>
          ${ride.status === "accepted" 
            ? "<span style='color:green;font-weight:bold;'>Accepted</span>" 
            : `<button class="accept-btn" data-id="${ride.ride_id}">Accept</button>`}
        </td>
      `;
      ridesBody.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll(".accept-btn").forEach(btn => {
      btn.addEventListener("click", () => acceptRide(btn.dataset.id, btn));
    });

  } catch (err) {
    console.error("Error loading rides:", err);
    ridesBody.innerHTML = `<tr><td colspan="6">Error loading rides</td></tr>`;
  }
}

async function acceptRide(rideId, btn) {
  try {
    const res = await fetch(`http://localhost:3000/api/rides/accept/${rideId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include'
    });

    const data = await res.json();
    console.log("Accept ride response:", data);

    if (data.success) {
      const row = btn.closest("tr");
      row.querySelector(".status").textContent = "accepted";
      row.querySelector(".status").style.color = "green";
      btn.replaceWith("✔️ Accepted");
    } else {
      alert(data.message || "Failed to accept ride");
    }

  } catch (err) {
    console.error("Error accepting ride:", err);
    alert("Error accepting ride");
  }
}
