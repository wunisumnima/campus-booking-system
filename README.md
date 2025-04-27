**Student Resource Booking System**
📚 Project Overview
The Student Resource Booking System allows students to register, login, and book resources like study rooms or equipment.
Admins can manage available resources and view bookings.
The project includes user authentication and separate dashboards for students and admins.

🚀 Deployment Links
Frontend (GitHub Pages): https://wunisumnima.github.io/campus-booking-system-frontend/

Backend (Render): https://student-resource-booking.onrender.com

🔑 Login Details (For Testing)
Admin Login:

Username: jane.doe@acity.edu.gh

Password: janedoe

Student Login:

Username: james.brown@acity.edu.gh

Password: jamesbrown

✅ Feature Checklist
User Registration & Authentication (15 Marks) 
• Secure registration and login system ✅
• Role-based access: Regular users vs. Admins ✅
• Authentication using JSON Web Tokens (JWT) ✅
Resource Listing & Availability (15 Marks) 
• Show available resources with status (Available, Booked) ✅
• Include descriptions, availability slots, and categories ✅
Booking System (15 Marks) 
• Allow students to book available slots ✅
• Users can view, update, or cancel their bookings ✅
Admin Panel (15 Marks) 
• Admins can add, update, or remove resources ✅
• View all bookings and manage users ✅


🛠 Installation Instructions (Running Locally)
1. Clone the repositories
git clone https://github.com/your-username/student-resource-booking-frontend.git
git clone https://github.com/your-username/student-resource-booking-backend.git

2. Backend Setup
cd student-resource-booking-backend
npm install
Create a .env file with your environment variables:
PORT=3000
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
JWT_SECRET=your-jwt-secret
Start the backend server:
npm start

3. Frontend Setup
Simply open the index.html file in a browser for local development.

Or use a simple static server:
cd student-resource-booking-frontend
npx serve .

4. Usage
Visit your Frontend URL.
Register a new student account or login as an admin.
Start booking resources or managing resources via the dashboard!
