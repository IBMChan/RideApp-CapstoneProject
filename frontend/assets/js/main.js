const BASE_URL = "http://localhost:3000/api"; // backend API
const FRONTEND_BASE = (() => {
  try {
    const path = window.location.pathname;
    const idx = path.indexOf('/frontend/');
    if (idx !== -1) return path.slice(0, idx + '/frontend'.length);
    const pubIdx = path.indexOf('/public/');
    if (pubIdx !== -1) return path.slice(0, pubIdx);
    return '/frontend';
  } catch (e) {
    return '/frontend';
  }
})(); 

document.addEventListener("DOMContentLoaded", () => {
  let pendingId = null;
 

  // ===== LOGIN =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const identifier = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const msgBox = document.getElementById("responseMsg");

      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            [isEmail ? 'email' : 'phone']: identifier,
            password 
          }),
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
        const role = (data.user.role || '').toLowerCase();
        if (role === "rider") {
          window.location.href = `${FRONTEND_BASE}/views/rider_views/rider_dashboard.html`;
        } else if (role === "driver") {
          window.location.href = `${FRONTEND_BASE}/views/driver_views/driver_dashboard.html`;
        } else {
          window.location.href = `${FRONTEND_BASE}/index.html`;
        }

      } catch (err) {
        console.error("Login error:", err);
        msgBox.textContent = "❌ Something went wrong";
        msgBox.style.color = "red";
      }
    });
  }

  // ===== FORGOT PASSWORD =====
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeModal = document.getElementById('closeModal');
    const doneBtn = document.getElementById('doneBtn');
    
    // Step elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    
    // Button elements
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    
    // Form elements
    const resetEmail = document.getElementById('resetEmail');
    const otpCode = document.getElementById('otpCode');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    // Password requirement elements
    const lengthReq = document.getElementById('lengthReq');
    const upperReq = document.getElementById('upperReq');
    const lowerReq = document.getElementById('lowerReq');
    const numberReq = document.getElementById('numberReq');
    const specialReq = document.getElementById('specialReq');
    
    // Helpers for inline messages in forgot password modal
    const forgotMsgBox = document.getElementById('forgotMsg');
    const clearForgotMsg = () => { if (forgotMsgBox) { forgotMsgBox.textContent=''; forgotMsgBox.className='message'; forgotMsgBox.style.display='none'; } };
    const setForgotError = (msg) => { if (forgotMsgBox) { forgotMsgBox.textContent = msg; forgotMsgBox.className = 'message error'; forgotMsgBox.style.display = 'block'; } };

    // Open modal
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("Forgot password link clicked");
      clearForgotMsg();
      forgotPasswordModal.classList.add('active');
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
      forgotPasswordModal.classList.remove('active');
      resetModal();
      clearForgotMsg();
    });
    
    doneBtn.addEventListener('click', () => {
      forgotPasswordModal.classList.remove('active');
      resetModal();
      clearForgotMsg();
    });
    
    // Reset modal to initial state
    function resetModal() {
      document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
      });
      step1.classList.add('active');
      
      // Clear all inputs
      if (resetEmail) resetEmail.value = '';
      if (otpCode) otpCode.value = '';
      if (newPassword) newPassword.value = '';
      if (confirmPassword) confirmPassword.value = '';
      clearForgotMsg();
    }
    
    // Step 1: Send OTP
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', async () => {
        clearForgotMsg();
        console.log("Send OTP button clicked");
        const email = resetEmail.value;
        
        if (!email) {
          setForgotError('Please enter your email address');
          return;
        }
        
        try {
          console.log(`Sending request to ${BASE_URL}/auth/forgot-password`);
          const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
          });
          
          console.log("Response received:", response);
          const data = await response.json();
          console.log("Response data:", data);
          
          if (response.ok) {
            // Move to step 2
            step1.classList.remove('active');
            step2.classList.add('active');
            
            // For debugging: log OTP to console only (no UI alert)
            if (data.emailOtp) {
              console.log("[DEBUG] Email OTP:", data.emailOtp);
            }
          } else {
            setForgotError(data.message || 'Failed to send OTP. Please try again.');
          }
        } catch (error) {
          console.error("Error sending OTP:", error);
          setForgotError('An error occurred. Please try again.');
        }
      });
    }
    
    // Step 2: Verify OTP
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        clearForgotMsg();
        const otp = otpCode.value;
        
        if (!otp || otp.length !== 6) {
          setForgotError('Please enter a valid 6-digit OTP');
          return;
        }
        
        // Move to step 3 (we'll verify OTP with the reset password API)
        step2.classList.remove('active');
        step3.classList.add('active');
      });
    }
    
    // Password validation
    if (newPassword) {
      newPassword.addEventListener('input', () => { clearForgotMsg(); validatePassword(); });
    }
    
    function validatePassword() {
      const password = newPassword.value;
      
      // Length check
      if (password.length >= 8) {
        lengthReq.classList.add('valid');
        lengthReq.classList.remove('invalid');
      } else {
        lengthReq.classList.add('invalid');
        lengthReq.classList.remove('valid');
      }
      
      // Uppercase check
      if (/[A-Z]/.test(password)) {
        upperReq.classList.add('valid');
        upperReq.classList.remove('invalid');
      } else {
        upperReq.classList.add('invalid');
        upperReq.classList.remove('valid');
      }
      
      // Lowercase check
      if (/[a-z]/.test(password)) {
        lowerReq.classList.add('valid');
        lowerReq.classList.remove('invalid');
      } else {
        lowerReq.classList.add('invalid');
        lowerReq.classList.remove('valid');
      }
      
      // Number check
      if (/[0-9]/.test(password)) {
        numberReq.classList.add('valid');
        numberReq.classList.remove('invalid');
      } else {
        numberReq.classList.add('invalid');
        numberReq.classList.remove('valid');
      }
      
      // Special character check
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        specialReq.classList.add('valid');
        specialReq.classList.remove('invalid');
      } else {
        specialReq.classList.add('invalid');
        specialReq.classList.remove('valid');
      }
    }
    
    // Clear message on user input changes
    if (resetEmail) resetEmail.addEventListener('input', clearForgotMsg);
    if (otpCode) otpCode.addEventListener('input', clearForgotMsg);
    if (confirmPassword) confirmPassword.addEventListener('input', clearForgotMsg);

    // Step 3: Reset Password
    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener('click', async () => {
        const email = resetEmail.value;
        const otp = otpCode.value;
        const password = newPassword.value;
        const confirmPwd = confirmPassword.value;
        
        // Validate password
        clearForgotMsg();
        
        if (password.length < 8) { setForgotError('Password must be at least 8 characters long'); return; }
        if (!/[A-Z]/.test(password)) { setForgotError('Password must contain at least one uppercase letter'); return; }
        if (!/[a-z]/.test(password)) { setForgotError('Password must contain at least one lowercase letter'); return; }
        if (!/[0-9]/.test(password)) { setForgotError('Password must contain at least one number'); return; }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) { setForgotError('Password must contain at least one special character'); return; }
        if (password !== confirmPwd) { setForgotError('Passwords do not match'); return; }
        
        try {
          const response = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              otp,
              newPassword: password
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // Move to success step
            step3.classList.remove('active');
            step4.classList.add('active');
            clearForgotMsg();
          } else {
            setForgotError(data.message || 'Failed to reset password. Please try again.');
          }
        } catch (error) {
          console.error("Error resetting password:", error);
          setForgotError('An error occurred. Please try again.');
        }
      });
    }
  }

  // ===== LOGOUT =====
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
          document.cookie.split(";").forEach(function(c) {
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

  // ===== SIGNUP =====
  // Role selection cards
  const riderCard = document.getElementById("rider-card");
  const driverCard = document.getElementById("driver-card");
  const roleInput = document.getElementById("role");
  const nextToStep2Btn = document.getElementById("nextToStep2");


  
  // Step navigation buttons
  const backToStep1Btn = document.getElementById("backToStep1");
  const nextToStep3Btn = document.getElementById("nextToStep3");
  const backToStep2Btn = document.getElementById("backToStep2");
  const initiateSignupBtn = document.getElementById("initiateSignup");
  const backToStep3Btn = document.getElementById("backToStep3");
  const completeSignupBtn = document.getElementById("completeSignup");
  
  // Form steps
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");
  
  // Progress indicators
  const step1Progress = document.getElementById("step1-progress");
  const step2Progress = document.getElementById("step2-progress");
  const step3Progress = document.getElementById("step3-progress");
  const step4Progress = document.getElementById("step4-progress");
  
  // Driver-specific fields
  const driverFields = document.getElementById("driver-fields");
  
  // Role selection
  if (riderCard && driverCard) {
    riderCard.addEventListener("click", () => {
      riderCard.classList.add("selected");
      driverCard.classList.remove("selected");
      roleInput.value = "rider";
      nextToStep2Btn.disabled = false;
    });
    
    driverCard.addEventListener("click", () => {
      driverCard.classList.add("selected");
      riderCard.classList.remove("selected");
      roleInput.value = "driver";
      nextToStep2Btn.disabled = false;
    });
  }
  
  // Step 1 to Step 2
  if (nextToStep2Btn) {
    nextToStep2Btn.addEventListener("click", () => {
      if (!roleInput.value) {
        showMessage("Please select a role to continue", "error");
        return;
      }
      
      // Clear any previous global messages
      showMessage("");

      step1.classList.remove("active");
      step2.classList.add("active");
      step1Progress.classList.add("completed");
      step2Progress.classList.add("active");
    });
  }
  
  // Step 2 to Step 1
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", () => {
      // Clear any previous global messages
      showMessage("");

      step2.classList.remove("active");
      step1.classList.add("active");
      step1Progress.classList.remove("completed");
      step2Progress.classList.remove("active");
    });
  }
  
  // Step 2 to Step 3
  // Step 2 to Step 3 (with confirm password check)
if (nextToStep3Btn) {
  nextToStep3Btn.addEventListener("click", () => {
    // Clear previous global messages when attempting to proceed
    showMessage("");
    const fullName = document.getElementById("full_name").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const errorEl = document.getElementById("password-error");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!fullName || !password || !confirmPassword) {
      showMessage("Please fill in all required fields", "error");
      return;
    }
const gender = document.getElementById("gender").value;

if (!gender) {
  showMessage("⚠️ Please select a gender before continuing.", "error");
  return;
}


    if (!passwordRegex.test(password)) {
      errorEl.textContent =
        "❌ Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
      errorEl.style.display = "block";
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = "❌ Passwords do not match!";
      errorEl.style.display = "block";
      return;
    }

    // Clear any password error if we are proceeding
    errorEl.textContent = "";
    errorEl.style.display = "none";

    // Clear global message when moving to next step
    showMessage("");

    step2.classList.remove("active");
    step3.classList.add("active");
    step2Progress.classList.add("completed");
    step3Progress.classList.add("active");

    if (roleInput.value === "driver") {
      driverFields.style.display = "block";
    } else {
      driverFields.style.display = "none";
    }
  });
}


  
  // Step 3 to Step 2
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener("click", () => {
      step3.classList.remove("active");
      step2.classList.add("active");
      step2Progress.classList.remove("completed");
      step3Progress.classList.remove("active");
    });
  }
  
  // Initiate Signup (Step 3 to Step 4)
  
 if (initiateSignupBtn) {
  initiateSignupBtn.addEventListener("click", async () => {
    const role = (roleInput.value || '').trim();
    const full_name = (document.getElementById("full_name").value || '').trim();
    const email = (document.getElementById("email").value || '').trim();
    const phone = (document.getElementById("phone").value || '').trim();
    const password = (document.getElementById("password").value || '').trim();
    const gender = (document.getElementById("gender").value || '').trim();

    // Regex validators
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^[6-9]\d{9}$/; // India 10-digit starting 6-9

    // Required field checks
    if (!full_name || !gender || !password || !email || !phone) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    // Email and phone regex validation
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }
    if (!phoneRegex.test(phone)) {
      showMessage("Please enter a valid 10-digit phone number", "error");
      return;
    }

    // Driver-specific required validations
    let license = null, kyc_type = null, kyc_document = null;
    if (role === "driver") {
      license = (document.getElementById("license").value || '').trim();
      kyc_type = (document.getElementById("kyc_type").value || '').trim().toLowerCase();
      kyc_document = (document.getElementById("kyc_document").value || '').trim();

      if (!kyc_type) {
        showMessage("Please select an ID type (PAN or Aadhaar)", "error");
        return;
      }
      if (!license) {
        showMessage("Please enter your Driver's License number", "error");
        return;
      }
      if (!kyc_document) {
        showMessage("Please enter your selected ID number", "error");
        return;
      }
    }

    try {
      // Prepare request data
      const requestData = {
        full_name,
        email,
        phone,
        role,
        password,
        gender
      };

      // Add driver-specific fields if applicable
      if (role === "driver") {
        requestData.license = license;
        requestData.kyc_type = kyc_type;
        requestData.kyc_document = kyc_document;
      }
      
      console.log("Sending signup request:", requestData);
      
      // Send signup initiation request
      const res = await fetch(`${BASE_URL}/auth/signup/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      
      console.log("Signup response:", res);
      const data = await res.json();
      console.log("Signup data:", data);
      
      if (!res.ok) {
        showMessage(`❌ ${data.message}`, "error");
        return;
      }
      
      // Store the pending ID for the complete step
      pendingId = data.pendingId;
      console.log("Stored pendingId:", pendingId);
      
      // For demo purposes, show the OTPs
      if (data.emailOtp && data.phoneOtp) {
        showMessage(`For demo: Email OTP: ${data.emailOtp}, Phone OTP: ${data.phoneOtp}`, "success");
      }
      
      // Move to step 4
      step3.classList.remove("active");
      step4.classList.add("active");
      step3Progress.classList.add("completed");
      step4Progress.classList.add("active");
      
    } catch (err) {
      console.error("Signup initiation error:", err);
      showMessage("❌ Something went wrong", "error");
    }
  });
}

  
  // Step 4 to Step 3
  if (backToStep3Btn) {
    backToStep3Btn.addEventListener("click", () => {
      step4.classList.remove("active");
      step3.classList.add("active");
      step3Progress.classList.remove("completed");
      step4Progress.classList.remove("active");
    });
  }
  
  // Complete Signup

if (completeSignupBtn) {
  completeSignupBtn.addEventListener("click", async () => {
    console.log("Complete signup button clicked");
    const emailOtp = document.getElementById("emailOtp").value;
    const phoneOtp = document.getElementById("phoneOtp").value;
    
    console.log("OTP data:", { emailOtp, phoneOtp, pendingId });
    
    if (!emailOtp || !phoneOtp) {
      showMessage("Please enter both verification codes", "error");
      return;
    }
    
    if (!pendingId) {
      showMessage("Session expired. Please start over.", "error");
      return;
    }
    
    try {
      console.log("Sending complete signup request:", { pendingId, emailOtp, phoneOtp });
      
      const res = await fetch(`${BASE_URL}/auth/signup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingId, emailOtp, phoneOtp })
      });
      
      console.log("Complete signup response:", res);
      const data = await res.json();
      console.log("Complete signup data:", data);
      
      if (!res.ok) {
        showMessage(`❌ ${data.message}`, "error");
        return;
      }
      
      showMessage("✅ Account created successfully!", "success");
      
      // Save user info
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect based on role after a short delay
      setTimeout(() => {
        const role = (data.user.role || '').toLowerCase();
        if (role === "rider") {
          window.location.href = `${FRONTEND_BASE}/views/rider_dashboard.html`;
        } else if (role === "driver") {
          window.location.href = `${FRONTEND_BASE}/views/driver_dashboard.html`;
        } else {
          window.location.href = `${FRONTEND_BASE}/index.html`;
        }
      }, 1500);
      
    } catch (err) {
      console.error("Complete signup error:", err);
      showMessage("❌ Something went wrong", "error");
    }
  });
}

  // Helper function to show messages
  function showMessage(message, type) {
    const msgBox = document.getElementById("responseMsg");
    if (msgBox) {
      msgBox.textContent = message;
      msgBox.className = "message";
      if (type) {
        msgBox.classList.add(type);
      }
    }
  }
});




// const BASE_URL = "http://localhost:3000/api";

// document.addEventListener("DOMContentLoaded", () => {

//   // ===== LOGIN =====
//   const loginForm = document.getElementById("loginForm");
//   if (loginForm) {
//     loginForm.addEventListener("submit", async (e) => {
//       e.preventDefault();

//       const email = document.getElementById("email").value;
//       const password = document.getElementById("password").value;
//       const msgBox = document.getElementById("responseMsg");

//       try {
//         const res = await fetch(`${BASE_URL}/auth/login`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({ email, password }),
//           credentials: "include", // ✅ Important to send cookie
//         });

//         const data = await res.json();

//         if (!res.ok) {
//           msgBox.textContent = `❌ ${data.message}`;
//           msgBox.style.color = "red";
//           return;
//         }

//         msgBox.textContent = `✅ Welcome, ${data.user.full_name}!`;
//         msgBox.style.color = "lightgreen";

//         // Save user info
//         localStorage.setItem("user", JSON.stringify(data.user));

//         // Redirect based on role
//         if (data.user.role === "rider") {
//           window.location.href = "/RideApp-CapstoneProject/frontend/views/rider_views/rider_dashboard.html";
//         } else if (data.user.role === "driver") {
//           window.location.href = "/RideApp-CapstoneProject/frontend/views/driver_views/driver_dashboard.html";
//         } else {
//           window.location.href = "/RideApp-CapstoneProject/frontend/index.html";
//         }

//       } catch (err) {
//         console.error("Login error:", err);
//         msgBox.textContent = "❌ Something went wrong";
//         msgBox.style.color = "red";
//       }
//     });
//   }

//   // ===== LOGOUT (for rider, driver, admin dashboards) =====
//   const logoutBtn = document.getElementById("logoutBtn");
//   if (logoutBtn) {
//     logoutBtn.addEventListener("click", async (e) => {
//       e.preventDefault();
//       try {
//         const res = await fetch(`${BASE_URL}/auth/logout`, {
//           method: "POST",
//           credentials: "include",
//         });

//         if (res.ok) {
//           // Clear localStorage and cookies
//           localStorage.removeItem("user");
//           document.cookie.split(";").forEach(function (c) {
//             document.cookie = c
//               .replace(/^ +/, "")
//               .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
//           });

//           // Redirect to main index page
//           window.location.href = "/RideApp-CapstoneProject/frontend/index.html";
//         } else {
//           console.error("Logout failed");
//         }
//       } catch (err) {
//         console.error("Logout error:", err);
//       }
//     });
//   }

// });


//   const logoutBtn = document.getElementById("logoutBtn");
//   if (logoutBtn) {
//     logoutBtn.addEventListener("click", async (e) => {
//       e.preventDefault();
//       try {
//         const res = await fetch(`${BASE_URL}/auth/logout`, {
//           method: "POST",
//           credentials: "include",
//         });

//         if (res.ok) {
//           // Clear localStorage and cookies
//           localStorage.removeItem("user");
//           document.cookie.split(";").forEach(function (c) {
//             document.cookie = c
//               .replace(/^ +/, "")
//               .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
//           });

//           // Redirect to main index page
//           window.location.href = "/RideApp-CapstoneProject/frontend/index.html";
//         } else {
//           console.error("Logout failed");
//         }
//       } catch (err) {
//         console.error("Logout error:", err);
//       }
//     });
//   }

// });
