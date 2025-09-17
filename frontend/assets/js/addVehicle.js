console.log("vehicleForm.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const vehicleForm = document.getElementById("vehicleForm");
  if (vehicleForm) {
    vehicleForm.addEventListener("submit", (e) => handleAddVehicle(e));
  }
});

async function handleAddVehicle(e) {
  e.preventDefault();

  const messageDiv = document.getElementById("message");
  messageDiv.textContent = "Submitting...";
  messageDiv.style.color = "#555";

  const token = localStorage.getItem("token");

  const vehicleData = {
    model: document.getElementById("model").value.trim(),
    make: document.getElementById("make").value.trim(),
    year: parseInt(document.getElementById("year").value),
    plate_no: document.getElementById("plate_no").value.trim(),
    color: document.getElementById("color").value.trim(),
    seating: parseInt(document.getElementById("seating").value),
    category: document.getElementById("category").value.trim(),
  };

  try {
    const res = await fetch("http://localhost:3000/api/driver/vehicles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials:'include',
      body: JSON.stringify(vehicleData)
    });

    const data = await res.json();
    console.log("Add vehicle response:", data);

    if (res.ok && data.success) {
      messageDiv.textContent = "✅ Vehicle added successfully!";
      messageDiv.style.color = "green";
      document.getElementById("vehicleForm").reset();
    } else {
      messageDiv.textContent = data.message || "❌ Failed to add vehicle";
      messageDiv.style.color = "red";
    }

  } catch (error) {
    console.error("Error adding vehicle:", error);
    messageDiv.textContent = "⚠️ Something went wrong!";
    messageDiv.style.color = "red";
  }
}
