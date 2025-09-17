// assets/js/authGuard.js
async function checkAuth() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/check", {
      method: "GET",
      credentials: "include" // ✅ send cookies
    });

    if (!res.ok) {
      // Not logged in -> redirect to login page
      window.location.href = "/public/login.html";
      return;
    }

    const data = await res.json();
    console.log("User verified:", data.user);
  } catch (err) {
    console.error("Auth check failed:", err);
    window.location.href = "/public/login.html";
  }
}

// ✅ Run on page load
checkAuth();
