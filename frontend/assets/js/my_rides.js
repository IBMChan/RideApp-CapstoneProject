// my_rides.js
document.addEventListener("DOMContentLoaded", () => {
    const CURRENT_RIDER_ID = JSON.parse(localStorage.getItem("user")).user_id;
    // const socket = io("http://localhost:3000", {
    //     query: { riderId: CURRENT_RIDER_ID }
    // });

    // socket.on("ride:update", (data) => {
    //     console.log("Ride update received:", data);
    //     window.location.href = "/RideApp-CapstoneProject/frontend/views/my_rides.html";
    // });
    const socket = io("http://localhost:3000", {
        query: { riderId: CURRENT_RIDER_ID }
    });

    socket.on("ride:update", (ride) => {
        console.log("Ride update received:", ride);
        // Update my_rides UI dynamically
        window.location.href = "/RideApp-CapstoneProject/frontend/views/my_rides.html";
    });
    const ridesList = document.getElementById("ridesList");

    function tryParse(s) {
        if (!s) return null;
        try {
            if (typeof s === 'object') return s;
            return JSON.parse(s);
        } catch (e) { return null; }
    }

    function formatLatLng(obj) {
        try {
            if (!obj) return '';
            if (typeof obj === 'string') {
                const parsed = tryParse(obj);
                if (parsed) obj = parsed;
            }
            const lat = obj.lat ?? obj.latitude ?? (obj[0] || null);
            const lng = obj.lng ?? obj.longitude ?? (obj[1] || null);
            if (lat == null || lng == null) return JSON.stringify(obj).slice(0, 60);
            return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
        } catch (e) { return ''; }
    }

    async function loadRides() {
        ridesList.innerHTML = '<div class="muted small">Loading rides...</div>';
        try {
            const resp = await RideAPI.listRides();
            if (!resp || !resp.success) {
                ridesList.innerHTML = '<div class="muted">No rides found.</div>';
                return;
            }

            const rides = resp.data?.rides || resp.data || [];
            if (!rides.length) {
                ridesList.innerHTML = '<div class="muted">No rides found.</div>';
                return;
            }

            ridesList.innerHTML = '';
            rides.forEach((ride, idx) => {
                const isLatest = idx === 0;
                const pickup = tryParse(ride.pickup_loc) || ride.pickup_loc;
                const drop = tryParse(ride.drop_loc) || ride.drop_loc;

                const card = document.createElement("div");
                card.className = `ride-card ${isLatest ? "latest" : ""}`;

                card.innerHTML = `
          <div class="ride-header">
            <div>
              <div class="ride-id">Ride #${ride.ride_id}</div>
              ${ride.ride_pin ? `<div class="ride-pin">PIN: ${ride.ride_pin}</div>` : ""}
            </div>
            <div class="status ${ride.status}">${ride.status || "unknown"}</div>
          </div>
          <div class="ride-details">
            ${pickup ? `<div>Pickup: ${formatLatLng(pickup)}</div>` : ""}
            ${drop ? `<div>Drop: ${formatLatLng(drop)}</div>` : ""}
            <div>Fare: ₹${ride.fare ?? "-"}</div>
            <div>Distance: ${ride.distance ?? "-"} km</div>
          </div>
          <div class="ride-footer">
            ${isLatest && ride.status === "requested"
                        ? `<button class="btn-cancel" data-id="${ride.ride_id}">Cancel Ride</button>`
                        : ""}
          </div>
        `;

                ridesList.appendChild(card);
            });

            // Attach cancel handler
            ridesList.querySelectorAll(".btn-cancel").forEach(btn => {
                btn.addEventListener("click", async e => {
                    const id = e.target.dataset.id;
                    if (!confirm("Cancel this ride?")) return;
                    const rr = await RideAPI.cancelRide(id);
                    if (rr && rr.success) {
                        alert("Ride cancelled");
                        loadRides();
                    } else {
                        alert("Unable to cancel ride");
                    }
                });
            });

        } catch (err) {
            console.error(err);
            ridesList.innerHTML = '<div class="muted">Failed to load rides</div>';
        }
    }

    loadRides();
});
