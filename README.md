# FinSync — Smart Expense Tracker & Finance Dashboard

FinSync is a modern, responsive full-stack personal finance application. It provides users with live financial health updates, budgeting targets, manual transaction logging, a simulated bank account connection (sandbox statement sync), and automated CSV and email statement exports.

---

## 🚀 Key Features

- **Double-Factor OTP Verification**: Protects accounts with 6-digit email confirmation codes during registration, login blocks for unverified users, and password recovery flows.
- **Dynamic Dashboard Metrics**: Instantly computes monthly totals, net savings, and savings rates based on verified income baseline configurations.
- **Visual Analytics**: Lightweight rendering of category share allocations (dynamic SVG doughnut chart) and recent transaction history (dynamic SVG bar chart).
- **Simulated Bank Feed**: Link online banking profiles (sandbox simulation) to automatically import mock transactions complete with multi-stage authentication visual progress bars.
- **CSV & Email Export Engine**: Download records in Excel-compatible CSV files, or request reports sent directly to an email address with automated attachments.
- **Togglable Light/Dark Themes**: Sleek visual elements with responsive grid columns designed for mobile and desktop screens.

---

## 🛠️ Tech Stack

### Client-Side (Frontend)
- React.js (Vite build bundler)
- Vanilla CSS Custom Properties (Theme controllers)
- Lucide React Icon Pack

### Server-Side (Backend)
- Node.js & Express.js (v5)
- MongoDB & Mongoose (NoSQL Data Models)
- Nodemailer (SMTP dispatch pipeline)
- Bcrypt & JSON Web Tokens (Security & auth tokens)

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB installed locally on port `27017` or a MongoDB Atlas connection string.

### 1. Configure the Environment
Navigate to the `backend/` directory and configure the environment settings:

```bash
cd backend
# Create or open your .env file
```

Add your credentials to the `backend/.env` file:
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=your_jwt_signing_secret_here

# SMTP Credentials (e.g., Mailtrap, Gmail, SendGrid)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_pass
```

### 2. Run the Server
Install dependencies and run the Node server:
```bash
cd backend
npm install
npm run dev
```

### 3. Run the Frontend Client
Open a new terminal window, install frontend packages, and start the Vite dev server:
```bash
cd forntend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing OTP Validation Locally
If you do not have SMTP credentials, the backend prints all OTP verification codes directly to your terminal console.
1. Click **Get Started** and register a new profile.
2. Check your backend terminal window for the OTP code printout.
3. Paste the verification code into the client OTP field to verify the account.
