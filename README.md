# Ledger — Customer Loan & Finance Tracker

A full-stack app for tracking customers, loans, and repayment transactions.

- **Backend:** Node.js, Express, MySQL (`mysql2`), JWT auth, bcrypt password hashing, Multer for photo uploads
- **Frontend:** Static HTML/CSS/vanilla JS (no build step) — served directly by the Express server

## 1. Create the database

Open MySQL Workbench (or the `mysql` CLI) connected as `root` and run:

```sql
SOURCE backend/schema.sql;
```

This creates the `finance_db` database and the `users`, `password_resets`, `customers`, and `transactions` tables.

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

The defaults already match the brief (`root` / `root` / `finance_db`). Edit `.env` if your MySQL setup differs. **Set `JWT_SECRET` to a random string before deploying anywhere real.**

## 3. Install & run

```bash
cd backend
npm install
npm start
```

The server starts on **http://localhost:5000** and serves both the API (`/api/...`) and the frontend pages (`index.html`, `home.html`, etc.) from the same origin — no separate frontend server needed.

## 4. Using the app

1. Open `http://localhost:5000` → you'll land on the **Log in** page.
2. Click **Create an account** to sign up (name, email, password).
3. Log in → **Home** page with three tiles: Customers, Calendar, Balance.
4. **Customers** → "Add customer" opens a modal (name, mobile, national ID, photo, initial loan amount). "Remove customer" turns on row checkboxes for bulk delete with a confirmation step.
5. Click a customer's **name** → their transaction ledger, with "Add amount" / "Minus amount" buttons.
6. Click **Information** → the customer's profile card (photo, mobile, ID, loan amount).
7. **Calendar** → click any day to see every transaction recorded that day, across all customers.
8. **Balance** → dashboard totals: customers, total loan amount, total profit, net outstanding.

## Forgot / reset password

No email service is configured, so `POST /api/auth/forgot-password` returns the reset link directly in the JSON response (and logs it to the server console) instead of emailing it — the **Forgot password** page displays this link so the flow is fully testable end to end. To wire up real email delivery, replace the `console.log` / response field in `backend/routes/auth.js` with a call to your email provider (SendGrid, SES, etc.) and stop returning `resetLink` in the response.

## Business rules

- A customer's **balance** = `initial_loan_amount + SUM(ADD transactions) − SUM(MINUS transactions)`.
- `ADD` = money lent to the customer (increases what they owe).
- `MINUS` = a repayment received (decreases what they owe).
- On the Balance page, **Total profit** = sum of all `ADD` transactions across customers, and **Net outstanding amount** = total loan amount + total added − total repaid.

## Project structure

```
backend/
  config/db.js            MySQL connection pool
  middleware/auth.js       JWT auth guard
  middleware/upload.js     Multer config for customer photos
  routes/auth.js           signup, login, forgot-password, reset-password
  routes/me.js              session check
  routes/customers.js       customer CRUD + balances
  routes/transactions.js    add/minus transactions
  routes/calendar.js        date-based transaction queries
  routes/balance.js         dashboard totals
  schema.sql                 database schema
  server.js                  app entry point
frontend/
  index.html, signup.html, forgot-password.html, reset-password.html
  home.html, customers.html, customer-transactions.html, customer-details.html
  calendar.html, day-transactions.html, balance.html
  css/style.css               shared design system
  js/api.js                   API client + helpers
  js/layout.js                 sidebar/app-shell renderer
```
