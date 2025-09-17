const BASE_URL = "http://localhost:3000/api/rider";
let riderId;
let locations = [];
let currentPage = 1;
const rowsPerPage = 10;

document.addEventListener("DOMContentLoaded", async () => {
  await getUser();
  setupSidebarNavigation();
  setupLogout();
});

// ✅ Get logged-in rider from cookie
async function getUser() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/check", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unauthorized");
    riderId = data.user.id;
  } catch (err) {
    alert("Not logged in. Redirecting...");
    window.location.href = "/frontend/index.html";
  }
}

/* =============================
   SPA SIDEBAR NAVIGATION
============================= */
function setupSidebarNavigation() {
  const mainContent = document.getElementById("mainContent");

  document.querySelectorAll(".sidebar-link").forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const page = e.target.getAttribute("href").replace("#", "");

      try {
        const res = await fetch(`pages/${page}.html`);
        const html = await res.text();
        mainContent.innerHTML = html;

        // Reinitialize scripts depending on page
        if (page === "save_location") {
          await fetchLocations();
          setupFormToggle();
          setupAddLocationForm();
        }
      } catch (err) {
        console.error(err);
        mainContent.innerHTML = "<p>⚠️ Page not found</p>";
      }
    });
  });
}

/* =============================
   SAVE LOCATION FUNCTIONS
============================= */
// Fetch saved locations
async function fetchLocations() {
  try {
    const res = await fetch(`${BASE_URL}/${riderId}/locations`, {
      method: "GET",
      credentials: "include",
    });
    locations = await res.json();
    renderTable();
  } catch (err) {
    console.error(err);
    alert("Failed to fetch locations.");
  }
}

// Render table with pagination
function renderTable() {
  const tbody = document.querySelector("#locationsTable tbody");
  tbody.innerHTML = "";

  if (!locations.length) {
    tbody.innerHTML = `<tr><td colspan="6">No saved locations found</td></tr>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageItems = locations.slice(start, end);

  pageItems.forEach((loc, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${loc.label}</td>
      <td>${loc.address}</td>
      <td>${loc.longitude}</td>
      <td>${loc.latitude}</td>
      <td><button class="delete-btn" data-id="${loc.saved_loc_id}">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  setupDeleteButtons();
  renderPagination();
}

// Pagination buttons
function renderPagination() {
  const pageCount = Math.ceil(locations.length / rowsPerPage);
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable();
    });
    paginationDiv.appendChild(btn);
  }
}

// Delete location
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      try {
        await fetch(`${BASE_URL}/${riderId}/locations/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        locations = locations.filter((loc) => loc.saved_loc_id != id);
        renderTable();
      } catch (err) {
        console.error(err);
        alert("Failed to delete location");
      }
    });
  });
}

// Add Location Form Toggle
function setupFormToggle() {
  const addBtn = document.getElementById("addLocationBtn");
  const form = document.getElementById("addLocationForm");
  const cancelBtn = document.getElementById("cancelAdd");

  if (!addBtn || !form) return;

  addBtn.addEventListener("click", () => form.style.display = "block");
  cancelBtn.addEventListener("click", () => form.style.display = "none");
}

// Add Location Form Submit
function setupAddLocationForm() {
  const form = document.getElementById("addLocationForm");
  const saveBtn = document.getElementById("saveLocationBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saving...";

    const payload = {
      label: document.getElementById("label").value,
      address: document.getElementById("address").value,
      latitude: document.getElementById("latitude").value,
      longitude: document.getElementById("longitude").value,
    };

    try {
      const res = await fetch(`${BASE_URL}/${riderId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save location");
      const newLocation = await res.json();
      locations.push(newLocation);
      renderTable();
      form.reset();
      form.style.display = "none";
    } catch (err) {
      console.error(err);
      alert("Error saving location");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
}

/* =============================
   LOGOUT
============================= */
function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      window.location.href = "/frontend/index.html";
    });
  });
}
