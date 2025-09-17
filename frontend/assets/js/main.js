const BASE_URL = "http://localhost:3000/api"; // backend port

// ===== LOGIN =====
document.addEventListener("DOMContentLoaded", () => {
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
          credentials: "include", // so cookies from backend are stored
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          msgBox.textContent = `❌ ${data.message}`;
          msgBox.style.color = "red";
          return;
        }

        msgBox.textContent = `✅ Welcome, ${data.user.full_name}!`;
        msgBox.style.color = "lightgreen";

        // save user info in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // optionally redirect
        setTimeout(() => {
          if (data.user.role === "rider") {
            window.location.href = "../views/rider_dashboard.html";
          } else if (data.user.role === "driver") {
            window.location.href = "../views/driver_dashboard.html";
          } else {
            window.location.href = "../index.html";
          }
        }, 300); // 300ms delay


      } catch (err) {
        console.error("Login error:", err);
        msgBox.textContent = "❌ Something went wrong";
        msgBox.style.color = "red";
      }
    });
  }

  // small floating car animation / bounce effect on hero
  const car = document.querySelector('.vehicle-card svg');
  if (car) {
    let dir = 1;
    setInterval(() => {
      car.style.transform = `translateX(${(Math.sin(Date.now() / 700) * 6)}px)`;
    }, 60);
  }

});
