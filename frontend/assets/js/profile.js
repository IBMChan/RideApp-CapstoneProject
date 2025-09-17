// profile.js
const API = "http://localhost:3000/api/driver/profile"; // GET, PATCH
const loginPage = "/RideApp-CapstoneProject/frontend/public/login.html"; // adjust if needed

// Editable fields
const EDITABLE = ["full_name", "phone", "email"];

// Keys to exclude from "All fields" list
const EXCLUDE_KEYS = new Set(["password_hash", "createdAt", "updatedAt", "emailVerified", "phoneVerified"]);

// helper $
const $ = (id) => document.getElementById(id);

function showStatus(msg = "", type = "success") {
  const el = $("formStatus");
  el.textContent = msg;
  if (!msg) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.style.color = type === "error" ? "#b91c1c" : "#16a34a";
}

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function makeSafe(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") {
    try { return JSON.stringify(val); } catch { return String(val); }
  }
  return String(val);
}

function initialsFrom(name) {
  if (!name) return "DR";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function fetchProfile() {
  try {
    showStatus("");
    const res = await fetch(API, {
      method: "GET",
      credentials: "include"
    });

    // redirect to login if unauthorized
    if (res.status === 401 || res.status === 403) {
      window.location.href = loginPage;
      return null;
    }

    const json = await res.json();
    if (!res.ok || (json && typeof json.success !== "undefined" && !json.success)) {
      showStatus(json?.message || "Failed to load profile", "error");
      return null;
    }

    // payload often at json.data
    return json.data || json;
  } catch (err) {
    console.error("Profile fetch error:", err);
    showStatus("Network error while loading profile", "error");
    return null;
  }
}

function renderAllFields(obj) {
  const container = $("fieldsList");
  container.innerHTML = "";

  if (!obj || typeof obj !== "object") {
    container.textContent = "No fields to display";
    return;
  }

  // Order keys: prefer some keys first
  const preferred = ["user_id","full_name","email","phone","role","license","gender","kyc_type","kyc_document"];
  const keys = Object.keys(obj);
  keys.sort((a,b) => {
    const ia = preferred.indexOf(a);
    const ib = preferred.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  for (const key of keys) {
    if (EXCLUDE_KEYS.has(key)) continue;
    // we've already shown Member Since separately so don't include createdAt
    const val = makeSafe(obj[key]);
    const item = document.createElement("div");
    item.className = "field-item";
    item.innerHTML = `<div class="key">${key}</div><div class="val">${val}</div>`;
    container.appendChild(item);
  }
}

function populateForm(profile) {
  // header left
  $("displayName").textContent = profile.full_name || profile.name || "Driver";
  $("displayRole").textContent = (profile.role || "driver").toLowerCase();
  $("memberSince").textContent = profile.createdAt ? formatDate(profile.createdAt) : "—";
  $("acctStatus").textContent = profile.is_active ? "Active" : (profile.status || "—");
  $("avatar").textContent = initialsFrom(profile.full_name || profile.name);

  // Editable fields
  if ("full_name" in profile) $("full_name").value = profile.full_name || "";
  if ("phone" in profile) $("phone").value = profile.phone || "";
  if ("email" in profile) $("email").value = profile.email || "";

  // Some read-only fields also shown in the form
  $("role").value = profile.role || "";
  $("license").value = profile.license || "";
  $("gender").value = profile.gender || "";
  $("kyc_type").value = profile.kyc_type || "";
  $("kyc_document").value = profile.kyc_document || "";

  renderAllFields(profile);
}

function enableEditing(enable) {
  for (const k of EDITABLE) {
    const el = $(k);
    if (el) el.disabled = !enable;
  }
  $("saveBtn").disabled = !enable;
  $("cancelBtn").disabled = !enable;
  if (enable) $("full_name").focus();
}

function validatePayload(payload) {
  const errors = [];
  if (payload.full_name !== undefined && String(payload.full_name).trim().length < 2) {
    errors.push("Full name must be at least 2 characters.");
  }
  if (payload.phone !== undefined && !/^[0-9]{10}$/.test(String(payload.phone).trim())) {
    errors.push("Phone must be 10 digits (numbers only).");
  }
  if (payload.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email).trim())) {
    errors.push("Email format invalid.");
  }
  return errors;
}

document.addEventListener("DOMContentLoaded", async () => {
  // elements
  const editBtn = $("editBtn");
  const saveBtn = $("saveBtn");
  const cancelBtn = $("cancelBtn");
  const btnRefresh = $("btnRefresh");
  const logoutBtn = $("logoutBtn");
  const downloadBtn = $("downloadBtn");
  const form = $("profileForm");

  // initial load
  let currentProfile = await fetchProfile();
  if (!currentProfile) return;
  populateForm(currentProfile);
  enableEditing(false);
  showStatus("");

  // Edit
  editBtn.addEventListener("click", () => {
    enableEditing(true);
    showStatus("Editing enabled. Make changes and click Save.");
  });

  // Cancel - revert to server values
  cancelBtn.addEventListener("click", async () => {
    enableEditing(false);
    const refreshed = await fetchProfile();
    if (refreshed) {
      currentProfile = refreshed;
      populateForm(refreshed);
    }
    showStatus("");
  });

  // Refresh
  btnRefresh.addEventListener("click", async () => {
    const refreshed = await fetchProfile();
    if (refreshed) {
      currentProfile = refreshed;
      populateForm(refreshed);
      showStatus("Profile refreshed.");
      setTimeout(() => showStatus(""), 2000);
    }
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("http://localhost:3000/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) { /* ignore */ }
    // clear local stored user and redirect to login
    try { localStorage.removeItem("user"); } catch(e) {}
    window.location.href = loginPage;
  });

  // Export: download profile as JSON
  downloadBtn.addEventListener("click", () => {
    const data = currentProfile || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile_${data.user_id || "me"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Save (PATCH)
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    showStatus("");

    const payload = {};
    for (const k of EDITABLE) {
      payload[k] = (document.getElementById(k).value || "").trim();
    }

    // validate
    const errors = validatePayload(payload);
    if (errors.length) {
      showStatus(errors.join(" "), "error");
      return;
    }

    // send request
    try {
      saveBtn.disabled = true;
      const res = await fetch(API, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showStatus(data?.message || "Failed to update profile", "error");
        saveBtn.disabled = false;
        return;
      }

      // update UI with returned profile (data.data or data)
      currentProfile = data.data || data;
      populateForm(currentProfile);
      enableEditing(false);
      showStatus("Profile updated successfully.");
      setTimeout(() => showStatus(""), 3000);
      saveBtn.disabled = false;
    } catch (err) {
      console.error("Update error:", err);
      showStatus("Network error while updating profile", "error");
      saveBtn.disabled = false;
    }
  });
});
