// document.getElementById('startRideForm').addEventListener('submit', async function (e) {
//   e.preventDefault();

//   const rideId = document.getElementById('rideId').value.trim();
//   const ridePin = document.getElementById('ridePin').value.trim();
//   const messageEl = document.getElementById('responseMessage');
//   const completeBtn = document.getElementById('completeRideBtn');

//   // Clear previous message
//   messageEl.textContent = '';
//   messageEl.style.color = 'black';

//   if (!rideId || !ridePin) {
//     messageEl.textContent = 'Please enter both Ride ID and PIN.';
//     messageEl.style.color = 'red';
//     return;
//   }

//   try {
//     const response = await fetch(`http://localhost:3000/api/rides/status/${rideId}`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         status: 'in_progress',
//         pin: ridePin,
//       }),
//       credentials: "include",
//     });

//     const result = await response.json();

//     if (response.ok) {
//       messageEl.textContent = '✅ Ride started successfully!';
//       messageEl.style.color = 'green';
//       document.getElementById('startRideForm').reset();

//       // Show Complete Ride button
//       completeBtn.style.display = 'inline-block';

//       // Remove any previous event listeners to avoid duplicates
//       completeBtn.replaceWith(completeBtn.cloneNode(true));
//       const newCompleteBtn = document.getElementById('completeRideBtn');

//       newCompleteBtn.addEventListener('click', async () => {
//         try {
//           const completeResponse = await fetch(`http://localhost:3000/api/rides/complete/${rideId}`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             credentials: 'include',
//           });

//           const completeResult = await completeResponse.json();

//           if (completeResponse.ok) {
//             messageEl.textContent = '✅ Ride completed successfully!';
//             messageEl.style.color = 'green';
//             newCompleteBtn.style.display = 'none';
//           } else {
//             messageEl.textContent = `❌ ${completeResult.message || 'Failed to complete ride.'}`;
//             messageEl.style.color = 'red';
//           }
//         } catch (err) {
//           console.error('Error completing ride:', err);
//           messageEl.textContent = '⚠️ An error occurred while completing the ride.';
//           messageEl.style.color = 'red';
//         }
//       });

//     } else {
//       messageEl.textContent = `❌ ${result.message || 'Failed to start ride.'}`;
//       messageEl.style.color = 'red';
//       completeBtn.style.display = 'none';
//     }
//   } catch (error) {
//     console.error('Error starting ride:', error);
//     messageEl.textContent = '⚠️ An error occurred. Please try again later.';
//     messageEl.style.color = 'red';
//     completeBtn.style.display = 'none';
//   }
// });


console.log("startRide.js loaded");

let isLoggedIn = false;

async function checkLogin() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/me", {
      credentials: "include"
    });
    const data = await res.json();
    if (res.ok && data.success) {
      console.log("User logged in:", data.user);
      isLoggedIn = true;
    } else {
      console.warn("User not logged in");
      isLoggedIn = false;
      document.getElementById('responseMessage').textContent = "⚠️ You must be logged in to start a ride.";
      document.getElementById('responseMessage').style.color = 'red';
    }
  } catch (err) {
    console.error("Login check error:", err);
    isLoggedIn = false;
  }
}

// Run login check on page load
document.addEventListener("DOMContentLoaded", checkLogin);

document.getElementById('startRideForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!isLoggedIn) {
    const messageEl = document.getElementById('responseMessage');
    messageEl.textContent = "⚠️ Please login before starting a ride.";
    messageEl.style.color = "red";
    return;
  }

  const rideId = document.getElementById('rideId').value.trim();
  const ridePin = document.getElementById('ridePin').value.trim();
  const messageEl = document.getElementById('responseMessage');
  const completeBtn = document.getElementById('completeRideBtn');

  // Clear previous message
  messageEl.textContent = '';
  messageEl.style.color = 'black';

  if (!rideId || !ridePin) {
    messageEl.textContent = 'Please enter both Ride ID and PIN.';
    messageEl.style.color = 'red';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/rides/status/${rideId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'in_progress',
        pin: ridePin,
      }),
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok) {
      messageEl.textContent = '✅ Ride started successfully!';
      messageEl.style.color = 'green';
      document.getElementById('startRideForm').reset();

      // Show Complete Ride button
      completeBtn.style.display = 'inline-block';

      // Remove any previous event listeners to avoid duplicates
      completeBtn.replaceWith(completeBtn.cloneNode(true));
      const newCompleteBtn = document.getElementById('completeRideBtn');

      newCompleteBtn.addEventListener('click', async () => {
        try {
          const completeResponse = await fetch(`http://localhost:3000/api/rides/complete/${rideId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          const completeResult = await completeResponse.json();

          if (completeResponse.ok) {
            messageEl.textContent = '✅ Ride completed successfully!';
            messageEl.style.color = 'green';
            newCompleteBtn.style.display = 'none';
          } else {
            messageEl.textContent = `❌ ${completeResult.message || 'Failed to complete ride.'}`;
            messageEl.style.color = 'red';
          }
        } catch (err) {
          console.error('Error completing ride:', err);
          messageEl.textContent = '⚠️ An error occurred while completing the ride.';
          messageEl.style.color = 'red';
        }
      });

    } else {
      messageEl.textContent = `❌ ${result.message || 'Failed to start ride.'}`;
      messageEl.style.color = 'red';
      completeBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error starting ride:', error);
    messageEl.textContent = '⚠️ An error occurred. Please try again later.';
    messageEl.style.color = 'red';
    completeBtn.style.display = 'none';
  }
});
