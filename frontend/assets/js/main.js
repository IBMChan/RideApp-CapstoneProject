const BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {

  // ===== LOGIN =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const msgBox = document.getElementById("responseMsg");

      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
          credentials: "include", // ✅ Important to send cookie
        });

        const data = await res.json();

        if (!res.ok) {
          msgBox.textContent = `❌ ${data.message}`;
          msgBox.style.color = "red";
          return;
        }

        msgBox.textContent = `✅ Welcome, ${data.user.full_name}!`;
        msgBox.style.color = "lightgreen";

        // Save user info
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on role
        if (data.user.role === "rider") {
          window.location.href = "/RideApp-CapstoneProject/frontend/views/rider_views/rider_dashboard.html";
        } else if (data.user.role === "driver") {
          window.location.href = "/RideApp-CapstoneProject/frontend/views/driver_views/driver_dashboard.html";
        } else {
          window.location.href = "/RideApp-CapstoneProject/frontend/index.html";
        }

      } catch (err) {
        console.error("Login error:", err);
        msgBox.textContent = "❌ Something went wrong";
        msgBox.style.color = "red";
      }
    });
  }

  // ===== LOGOUT (for rider, driver, admin dashboards) =====
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          // Clear localStorage and cookies
          localStorage.removeItem("user");
          document.cookie.split(";").forEach(function (c) {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });

          // Redirect to main index page
          window.location.href = "/RideApp-CapstoneProject/frontend/index.html";
        } else {
          console.error("Logout failed");
        }
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  }

});
