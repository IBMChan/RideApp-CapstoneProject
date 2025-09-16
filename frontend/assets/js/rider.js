// Put at: frontend/assets/js/main.js
(() => {
  const baseApiUrl = window.baseApiUrl || ''; // update if backend is on different origin, e.g. 'http://localhost:3000'
  window.baseApiUrl = baseApiUrl;

  // simple header year
  document.getElementById('year')?.textContent = new Date().getFullYear();

  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      // demo: show a friendly message
      alert('Thanks, we received your message. (Demo frontend)');
      contactForm.reset();
    });
  }

  // Signup form (initiate)
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(signupForm).entries());
      try {
        const res = await fetch(`${baseApiUrl}/api/auth/signup/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        const out = document.getElementById('signupResult');
        if (!res.ok) {
          out.textContent = json.message || 'Signup failed';
          out.style.color = 'crimson';
          return;
        }
        out.style.color = 'green';
        out.textContent = `OTP sent to email & phone (demo). PendingId: ${json.pendingId}\nEmailOTP: ${json.emailOtp} PhoneOTP: ${json.phoneOtp}\nNow call /api/auth/signup/complete from backend or implement UI to complete OTP verification (demo).`;
      } catch (err) {
        console.error(err);
        document.getElementById('signupResult').textContent = 'Network error';
      }
    });
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());
      try {
        const res = await fetch(`${baseApiUrl}/api/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) {
          alert(json.message || 'Login failed');
          return;
        }
        // user object returned (user_id, role)
        const role = json.user?.role;
        if (role === 'driver' || role === 'rider') {
          // redirect to their dashboard (you can replace with your view)
          window.location.href = '/views/rider.html';
        } else {
          // if admin redirect to admin console
          window.location.href = '/admin.html';
        }
      } catch (err) {
        console.error(err);
        alert('Network error during login');
      }
    });
  }

  // small floating car animation / bounce effect on hero
  const car = document.querySelector('.vehicle-card svg');
  if (car) {
    let dir = 1;
    setInterval(() => {
      car.style.transform = `translateX(${(Math.sin(Date.now()/700) * 6)}px)`;
    }, 60);
  }

})();
