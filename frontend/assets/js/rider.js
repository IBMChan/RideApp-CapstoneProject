// rider.js
const RiderAPI = (function () {
  const BASE = window.API_BASE || "http://localhost:3000/api";

  async function req(path, opts = {}) {
    let token = null;
    try {
      const u = localStorage.getItem("user");
      if (u) token = JSON.parse(u)?.token;
    } catch (e) {}

    const headers = Object.assign({}, opts.headers || {});
    if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    if (token && !headers["Authorization"]) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(BASE + path, { ...opts, headers, credentials: "include" });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return text; }
  }

  return {
    // getProfile: () => req("/rider/profile"),
    // updateProfile: (data) => req("/rider/profile", { method: "PUT", body: JSON.stringify(data) }),
    requestRide: (pickup, drop) => req("/rides/create", { method: "POST", body: JSON.stringify({ pickup_loc: pickup, drop_loc: drop }) }),
    rideHistory: () => req("/rides/history"),
    cancelRide: (ride_id) => req(`/rides/cancel/${ride_id}`, { method: "POST" }),
    listRides: () => req("/rides/list"),
  };
})();

// ===== Usage Example =====
// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     const profile = await RiderAPI.getProfile();
//     document.getElementById("riderName").textContent = profile.data?.full_name || "N/A";
//     document.getElementById("riderEmail").textContent = profile.data?.email || "N/A";
//   } catch (err) {
//     console.error("Failed to load rider profile:", err);
//   }
// });
