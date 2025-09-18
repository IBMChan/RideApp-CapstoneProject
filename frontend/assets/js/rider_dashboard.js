// Raksha & Harshit
document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
     SECTION TOGGLING (Sidebar nav)
  ================================ */
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const sections = document.querySelectorAll(".main-content section");

  // Hide all except Home on load
  sections.forEach(sec => {
    if (sec.id !== "home") sec.style.display = "none";
  });

  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);

      console.log(`[NAV] Switching to section: ${targetId}`);
      sections.forEach(sec => sec.style.display = "none");

      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = "block";
    });
  });

  /* ===============================
     SAVE / LOAD / DELETE LOCATIONS
  ================================ */
  async function addLocationHandler(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    const riderId = user?.user_id;
    if (!riderId) {
      alert("Rider not logged in. Please login again.");
      return;
    }

    const locationData = {
      label: document.getElementById("locationLabel").value.trim(),
      address: document.getElementById("locationAddress").value.trim(),
      latitude: document.getElementById("latitude").value.trim(),
      longitude: document.getElementById("longitude").value.trim(),
    };

    if (!locationData.label || !locationData.address) {
      alert("Please provide a label and address.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/rider/${riderId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(locationData),
      });
      const data = await res.json();
      console.log("[SAVE] Response:", res.status, data);

      if (res.ok) {
        document.getElementById("saveLocationForm").reset();
        await loadSavedLocations();
      } else {
        alert(data.error || data.message || "Failed to save location");
      }
    } catch (err) {
      console.error("[SAVE] Error:", err);
    }
  }

  async function loadSavedLocations() {
    const user = JSON.parse(localStorage.getItem("user"));
    const riderId = user?.user_id;
    if (!riderId) return;

    try {
      const res = await fetch(`http://localhost:3000/api/rider/${riderId}/locations`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) return;
      const locations = await res.json();
      const savedLocationsList = document.getElementById("savedLocationsList");
      savedLocationsList.innerHTML = "";

      if (!Array.isArray(locations) || locations.length === 0) {
        savedLocationsList.innerHTML = "<p style='color:#888;text-align:center'>No saved locations yet.</p>";
        return;
      }

      locations.forEach((loc) => {
        const item = document.createElement("div");
        item.className = "location-item";
        item.dataset.id = loc.saved_loc_id;

        const label = document.createElement("span");
        label.textContent = `${loc.label} - ${loc.address}`;
        item.appendChild(label);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "🗑️ Delete";
        item.appendChild(deleteBtn);

        deleteBtn.addEventListener("click", async () => {
          if (!confirm(`Delete saved location "${loc.label}"?`)) return;
          try {
            const delRes = await fetch(
              `http://localhost:3000/api/rider/${riderId}/locations/${loc.saved_loc_id}`,
              { method: "DELETE", credentials: "include" }
            );
            if (delRes.ok) item.remove();
          } catch (err) {
            console.error("[DELETE] Error:", err);
          }
        });

        savedLocationsList.appendChild(item);
      });
    } catch (err) {
      console.error("[LOAD] Error loading locations:", err);
    }
  }

  const saveLocationForm = document.getElementById("saveLocationForm");
  if (saveLocationForm) saveLocationForm.addEventListener("submit", addLocationHandler);
  loadSavedLocations();

  /* ===============================
     SHARE RIDE STATUS
  ================================ */
  const shareRideForm = document.getElementById("shareRideForm");
  const shareRideMsg = document.getElementById("shareRideMsg");

  if (shareRideForm) {
    shareRideForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = JSON.parse(localStorage.getItem("user"));
      const riderId = user?.user_id;
      if (!riderId) return;

      const recipientEmail = document.getElementById("shareEmail").value.trim();
      if (!recipientEmail) return;

      try {
        const rideRes = await fetch(`http://localhost:3000/api/rides/list`, {
          method: "GET",
          credentials: "include"
        });
        if (!rideRes.ok) return;

        const ride = await rideRes.json();
        console.log("[SHARE] Active ride:", ride);

        const res = await fetch(`http://localhost:3000/api/rider/share-ride-email/${ride.data.rides[0].ride_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ riderId, recipientEmail })
        });

        const data = await res.json();
        if (res.ok) {
          shareRideMsg.textContent = "✅ Ride status shared successfully!";
          shareRideMsg.style.color = "green";
          shareRideForm.reset();
        } else {
          shareRideMsg.textContent = `❌ ${data.message || "Failed to share ride"}`;
          shareRideMsg.style.color = "red";
        }
      } catch (err) {
        console.error("[SHARE] Error:", err);
      }
    });
  }

  /* ===============================
     RATINGS (Postman API)
     POST /api/rider/rate/:rideId
     GET  /api/rider/rate/:rideId?riderId=...
  ================================ */
  (() => {
    const BASE_URL = "http://localhost:3000/api";
    const user = JSON.parse(localStorage.getItem("user"));
    const riderId = user?.user_id;

    if (!riderId) return;
    console.log("[RATINGS INIT] riderId:", riderId);

    const ratingForm = document.getElementById("ratingForm");
    const ratingMsg = document.getElementById("ratingMsg");
    const fetchRatingForm = document.getElementById("fetchRatingForm");
    const fetchedRating = document.getElementById("fetchedRating");

    // ---- Submit Rating ----
    ratingForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const rideId = document.getElementById("ratingRideId").value.trim();
      const driverId = document.getElementById("ratingDriverId").value.trim();
      const rate = document.getElementById("ratingStars").value.trim();
      const comment = document.getElementById("ratingComment").value.trim();

      console.log("[RATINGS] Submit inputs:", { rideId, driverId, rate, comment });

      const url = `${BASE_URL}/rider/rate/${rideId}`;
      const body = { riderId: Number(riderId), driverId: Number(driverId), rate: Number(rate), comment };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body)
        });
        const data = await res.json();
        console.log("[RATINGS] Submit response:", res.status, data);

        if (res.ok) {
          ratingMsg.textContent = "✅ Rating submitted";
          ratingMsg.style.color = "green";
          ratingForm.reset();
        } else {
          ratingMsg.textContent = `❌ ${data.message || "Failed"}`;
          ratingMsg.style.color = "red";
        }
      } catch (err) {
        console.error("[RATINGS] Error submit:", err);
      }
    });

    // ---- Fetch Rating ----
  // ---- Fetch Rating ----
fetchRatingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rideId = document.getElementById("fetchRideId").value.trim();
  if (!rideId) return;

  const url = `${BASE_URL}/rider/rate/${rideId}?riderId=${riderId}`;
  try {
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const data = await res.json();
    console.log("[RATINGS] Fetch response:", res.status, data);

    fetchedRating.innerHTML = "";

    if (res.ok && data.success && data.data?.r_to_d) {
      const r = data.data.r_to_d;

      let driverText = "Unknown driver";

      // --- Step 1: Fetch ride details to get driver_id ---
      try {
        const rideRes = await fetch(`${BASE_URL}/rides/${rideId}`, {
          method: "GET",
          credentials: "include"
        });
        const rideData = await rideRes.json();
        console.log("[RATINGS] Ride details:", rideData);

        if (rideRes.ok && rideData.success && rideData.data?.ride) {
          const driverId = rideData.data.ride.driver_id;
          driverText = `Driver ${driverId}`;

          // --- Step 2: Try to fetch driver name ---
          try {
            const driverRes = await fetch(`${BASE_URL}/driver/profile/${driverId}`, {
              method: "GET",
              credentials: "include"
            });
            const driverData = await driverRes.json();
            console.log("[RATINGS] Driver details:", driverData);

            if (driverRes.ok && driverData.success && driverData.data?.name) {
              driverText = driverData.data.name;
            }
          } catch (err) {
            console.warn("[RATINGS] Could not fetch driver name:", err);
          }
        }
      } catch (err) {
        console.warn("[RATINGS] Could not fetch ride details:", err);
      }

      fetchedRating.textContent = `⭐ ${r.rate} — ${r.comment || "No comment"} (${driverText})`;
      fetchedRating.style.color = "green";
    } else {
      fetchedRating.textContent = "No ratings found.";
      fetchedRating.style.color = "red";
    }
  } catch (err) {
    console.error("[RATINGS] Error fetch:", err);
    fetchedRating.textContent = "❌ Failed to load ratings.";
  }
});
  })();
});
