# Secure MERN Banking App

## Features Implemented
- JWT auth with role-based access (`user`, `admin`)
- Rule-based security checks:
  - unusual login time (`23:00 - 06:00`)
  - huge transfer (>= 100000)
- Lockout policy:
  - 10 failed logins -> 15 min lockout
  - account marked blocked
  - SMS warning (mock service, pluggable)
- GPay-style bank selection UI during registration
- User operations:
  - check balance
  - transfer funds
- Admin Dashboard:
  - filter users by bank
  - inspect full user history (transactions, loans, security events, logs)
  - real-time monitoring of security events and user logs via Socket.IO
- MongoDB status flags:
  - `normal`, `flagged`, `blocked`
- CORS setup to avoid localhost origin mismatch issues

## Project Structure
- `server` - Node.js, Express, MongoDB, Socket.IO
- `client` - React + Vite UI

## Local Setup
1. Start MongoDB locally (MongoDB Compass can connect to this URI):
   - `mongodb://127.0.0.1:27017/secure_banking_app`
2. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
3. Run backend:
   - `cd server && npm run dev`
4. Run frontend:
   - `cd client && npm run dev`
5. Open:
   - `http://localhost:5173`

## Notes
- For real SMS, replace `server/src/services/smsService.js` with Twilio/Fast2SMS integration.
- Seed an admin account by registering with `role: "admin"` through API/Postman, or add a small seed script.
