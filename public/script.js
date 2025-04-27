// public/script.js
const backendURL = window.location.hostname.includes('localhost')
  ? 'http://localhost:3000'
  : 'https://student-resource-booking.onrender.com';

document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();
    
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;
    const errorEl = document.getElementById("error");
  
    if (!name || !email || !password || !confirmPassword || !role) {
      errorEl.textContent = "Please fill out all fields.";
      return;
    }
  
    if (password !== confirmPassword) {
      errorEl.textContent = "Passwords do not match.";
      return;
    }
  
    errorEl.textContent = "";
  
    // Send to backend (will set up next)
    fetch(`${backendURL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password, role })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Registration successful!");
        // Redirect or clear form
        // Redirect to login page
        window.location.href = 'login.html'; // <-- change to your login page URL
      } else {
        errorEl.textContent = data.message || "Registration failed.";
      }
    })
    .catch(err => {
      console.error(err);
      errorEl.textContent = "Error connecting to server.";
    });
  });
  
