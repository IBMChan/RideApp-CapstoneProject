// driver.js - Driver dashboard UI + features
document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = "http://localhost:3000/api";

    /* -------------------------
       Elements
    ------------------------- */
    const tabs = document.querySelectorAll(".tab-btn");
    const panels = document.querySelectorAll(".tab");
    const btnLogout = document.getElementById("btnLogout");

    const rideRequestsList = document.getElementById("rideRequestsList");
    const ongoingRidesList = document.getElementById("ongoingRidesList");
    const rideHistoryList = document.getElementById("rideHistoryList");
    const profileInfo = document.getElementById("profileInfo");
    const vehicleList = document.getElementById("vehicleList");
    const paymentHistory = document.getElementById("paymentHistory");

    /* -------------------------
       Tabs
    ------------------------- */
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });

    /* -------------------------
       API Helpers
    ------------------------- */
    const fetchJSON = async (url, options = {}) => {
        const res = await fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
        return res.json();
    };

    /* -------------------------
       Ride Requests
    ------------------------- */
    async function loadRideRequests() {
        const res = await fetchJSON(`${BASE_URL}/rides/pending`);
        rideRequestsList.innerHTML = "";
        if (res.success && res.data.rides.length) {
            res.data.rides.forEach(ride => {
                const div = document.createElement("div");
                div.classList.add("ride-card");
                div.innerHTML = `
          <p><b>Ride #${ride.ride_id}</b> - Pickup: ${ride.pickup_loc.lat}, ${ride.pickup_loc.lng}</p>
          <p>Drop: ${ride.drop_loc.lat}, ${ride.drop_loc.lng}</p>
          <button class="acceptBtn" data-id="${ride.ride_id}">Accept</button>
          <button class="dismissBtn" data-id="${ride.ride_id}">Dismiss</button>
        `;
                rideRequestsList.appendChild(div);
            });

            document.querySelectorAll(".acceptBtn").forEach(btn => {
                btn.addEventListener("click", () => acceptRide(btn.dataset.id));
            });
            document.querySelectorAll(".dismissBtn").forEach(btn => {
                btn.addEventListener("click", () => dismissRide(btn.dataset.id));
            });
        } else {
            rideRequestsList.innerHTML = "<p>No pending rides.</p>";
        }
    }

    async function acceptRide(rideId) {
        const res = await fetchJSON(`${BASE_URL}/rides/accept/${rideId}`, { method: "POST" });
        alert(res.message);
        loadRideRequests();
        loadOngoingRides();
    }

    function dismissRide(rideId) {
        const card = document.querySelector(`.dismissBtn[data-id="${rideId}"]`).parentElement;
        card.remove();
    }

    /* -------------------------
       Ongoing Rides
    ------------------------- */
    async function loadOngoingRides() {
        const res = await fetchJSON(`${BASE_URL}/rides/ongoing`);
        ongoingRidesList.innerHTML = "";
        if (res.success && res.data.rides.length) {
            res.data.rides.forEach(ride => {
                const div = document.createElement("div");
                div.classList.add("ride-card");
                div.innerHTML = `
          <p><b>Ride #${ride.ride_id}</b> - Status: ${ride.status}</p>
          <button class="startBtn" data-id="${ride.ride_id}">Start (Enter PIN)</button>
          <button class="completeBtn" data-id="${ride.ride_id}">Complete</button>
          <button class="cancelBtn" data-id="${ride.ride_id}">Cancel</button>
        `;
                ongoingRidesList.appendChild(div);
            });

            document.querySelectorAll(".startBtn").forEach(btn => {
                btn.addEventListener("click", () => updateStatusWithPIN(btn.dataset.id, "in_progress"));
            });
            document.querySelectorAll(".completeBtn").forEach(btn => {
                btn.addEventListener("click", () => completeRide(btn.dataset.id));
            });
            document.querySelectorAll(".cancelBtn").forEach(btn => {
                btn.addEventListener("click", () => cancelRide(btn.dataset.id));
            });
        } else {
            ongoingRidesList.innerHTML = "<p>No ongoing rides.</p>";
        }
    }

    async function updateStatusWithPIN(rideId, status) {
        const pin = prompt("Enter rider's PIN to start ride:");
        if (!pin) return;
        const res = await fetchJSON(`${BASE_URL}/rides/status/${rideId}`, {
            method: "PATCH",
            body: JSON.stringify({ status, pin })
        });
        alert(res.message);
        loadOngoingRides();
    }

    async function completeRide(rideId) {
        const res = await fetchJSON(`${BASE_URL}/rides/complete/${rideId}`, { method: "POST" });
        alert(res.message);
        loadOngoingRides();
        loadRideHistory();
    }

    async function cancelRide(rideId) {
        const res = await fetchJSON(`${BASE_URL}/rides/cancel/${rideId}`, { method: "POST" });
        alert(res.message);
        loadOngoingRides();
        loadRideRequests();
    }

    /* -------------------------
       Ride History
    ------------------------- */
    async function loadRideHistory() {
        const res = await fetchJSON(`${BASE_URL}/rides/history`);
        rideHistoryList.innerHTML = "";
        if (res.success && res.data.rides.length) {
            res.data.rides.forEach(ride => {
                const div = document.createElement("div");
                div.classList.add("ride-card");
                div.innerHTML = `<p><b>Ride #${ride.ride_id}</b> - ${ride.status}</p>`;
                rideHistoryList.appendChild(div);
            });
        } else {
            rideHistoryList.innerHTML = "<p>No ride history.</p>";
        }
    }

    /* -------------------------
       Profile
    ------------------------- */
    async function loadProfile() {
        const res = await fetchJSON(`${BASE_URL}/driver/profile`);
        if (res.success) {
            const profile = res.data;
            profileInfo.innerHTML = `
        <p><b>Name:</b> ${profile.full_name}</p>
        <p><b>Email:</b> ${profile.email}</p>
        <p><b>Status:</b> ${profile.status}</p>
      `;
        }
    }

    /* -------------------------
       Vehicles
    ------------------------- */
    async function loadVehicles() {
        const res = await fetchJSON(`${BASE_URL}/driver/vehicles`);
        vehicleList.innerHTML = "";
        if (res.success && res.data.length) {
            res.data.forEach(v => {
                const div = document.createElement("div");
                div.innerHTML = `<p>${v.make} ${v.model} - ${v.plate_no} (${v.vehicle_status})</p>`;
                vehicleList.appendChild(div);
            });
        } else {
            vehicleList.innerHTML = "<p>No vehicles.</p>";
        }
    }

    /* -------------------------
       Payments
    ------------------------- */
    async function loadPayments() {
        const res = await fetchJSON(`${BASE_URL}/driver/payments`);
        paymentHistory.innerHTML = "";
        if (res.success && res.data.length) {
            res.data.forEach(p => {
                const div = document.createElement("div");
                div.innerHTML = `<p>Payment #${p.id} - Amount: ${p.amount}</p>`;
                paymentHistory.appendChild(div);
            });
        } else {
            paymentHistory.innerHTML = "<p>No payment history.</p>";
        }
    }

    /* -------------------------
       Logout
    ------------------------- */
    btnLogout.addEventListener("click", async () => {
        await fetchJSON(`${BASE_URL}/auth/logout`, { method: "POST" });
        window.location.href = "login.html";
    });

    /* -------------------------
       Init
    ------------------------- */
    loadRideRequests();
    loadOngoingRides();
    loadRideHistory();
    loadProfile();
    loadVehicles();
    loadPayments();
});
