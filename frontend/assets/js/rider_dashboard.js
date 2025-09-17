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
      const targetId = link.getAttribute("href").substring(1); // "#save" -> "save"

      console.log(`[NAV] Switching to section: ${targetId}`);

      // Hide all sections
      sections.forEach(sec => sec.style.display = "none");

      // Show the selected section
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.style.display = "block";
      } else {
        console.warn(`[NAV] No section found with id: ${targetId}`);
      }
    });
  });
  /* ===============================
   SAVE / LOAD / DELETE ONLY
================================ */

// unified add handler (only POST)
async function addLocationHandler(e) {
  e.preventDefault();
  console.log("[SAVE] addLocationHandler called");

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
    const url = `http://localhost:3000/api/rider/${riderId}/locations`;
    const res = await fetch(url, {
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
    alert("Something went wrong while saving the location.");
  }
}

// load and render saved locations
async function loadSavedLocations() {
  const user = JSON.parse(localStorage.getItem("user"));
  const riderId = user?.user_id;
  if (!riderId) return;

  try {
    const res = await fetch(`http://localhost:3000/api/rider/${riderId}/locations`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      console.warn("[LOAD] failed to fetch saved locations:", res.status);
      return;
    }

    const locations = await res.json();
    const savedLocationsList = document.getElementById("savedLocationsList");
    savedLocationsList.innerHTML = ""; // clear

    if (!Array.isArray(locations) || locations.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No saved locations yet.";
      empty.style.color = "#888";
      empty.style.textAlign = "center";
      savedLocationsList.appendChild(empty);
      return;
    }

    locations.forEach((loc) => {
      const item = document.createElement("div");
      item.className = "location-item";
      item.dataset.id = loc.saved_loc_id;

      const label = document.createElement("span");
      label.textContent = `${loc.label} - ${loc.address}`;
      item.appendChild(label);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.type = "button";
      deleteBtn.textContent = "🗑️ Delete";
      item.appendChild(deleteBtn);

      // Delete handler
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Delete saved location "${loc.label}"?`)) return;
        try {
          const delRes = await fetch(
            `http://localhost:3000/api/rider/${riderId}/locations/${loc.saved_loc_id}`,
            { method: "DELETE", credentials: "include" }
          );

          if (delRes.ok) {
            item.remove();
            console.log("[DELETE] Removed location", loc.saved_loc_id);
          } else {
            const err = await delRes.json().catch(() => ({ message: "delete failed" }));
            alert(err.message || "Failed to delete location");
          }
        } catch (err) {
          console.error("[DELETE] Error:", err);
          alert("Delete failed");
        }
      });

      savedLocationsList.appendChild(item);
    });
  } catch (err) {
    console.error("[LOAD] Error loading locations:", err);
  }
}

/* ===== hook up handlers ===== */
const saveLocationForm = document.getElementById("saveLocationForm");
if (saveLocationForm) {
  saveLocationForm.addEventListener("submit", addLocationHandler);
}

// load on page ready
loadSavedLocations();

/* ===============================
   SHARE RIDE STATUS
================================= */
const shareRideForm = document.getElementById("shareRideForm");
const shareRideMsg = document.getElementById("shareRideMsg");

if (shareRideForm) {
  shareRideForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    const riderId = user?.user_id;
    if (!riderId) {
      alert("Rider not logged in. Please login again.");
      return;
    }

    const recipientEmail = document.getElementById("shareEmail").value.trim();
    if (!recipientEmail) {
      alert("Please enter a valid email");
      return;
    }

    try {
      // 1️⃣ Fetch the latest rides for this rider
      const rideRes = await fetch(`http://localhost:3000/api/rides/list`, {
        method: "GET",
        credentials: "include"
      });

      if (!rideRes.ok) {
        shareRideMsg.textContent = "❌ Could not fetch rides.";
        shareRideMsg.style.color = "red";
        return;
      }

      const ride = await rideRes.json();
      if (!ride?.data?.rides?.length) {
        shareRideMsg.textContent = "❌ No active ride to share.";
        shareRideMsg.style.color = "red";
        return;
      }

      const rideId = ride.data.rides[0].ride_id; // use first ride (latest/active)
      console.log("[SHARE] Found ride:", rideId);

      // 2️⃣ Call backend to send email
      const res = await fetch(
        `http://localhost:3000/api/rider/share-ride-email/${rideId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ riderId, recipientEmail })
        }
      );

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
      shareRideMsg.textContent = "❌ Something went wrong.";
      shareRideMsg.style.color = "red";
    }
  });
}

});