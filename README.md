# ExpirEase

ExpirEase is a personal inventory tracker that helps people keep track of expiry dates and reduce avoidable waste. It brings everyday products—food, medicines, personal care, household supplies, and other items—into one place, with clear views of what needs attention and when.

> **Medicine scope:** ExpirEase provides expiry tracking and reminders only. It does not provide medical advice, treatment guidance, or recommendations about whether a medicine is safe to use.

## Problem statement

Products are easy to forget once they are stored away. Expiry dates may be spread across packaging, cupboards, and different parts of a home. Without a simple way to track them, people can miss the opportunity to use products in time, overlook expired items, or buy replacements unnecessarily.

## Solution

ExpirEase lets users record products and their purchase and expiry dates, then organizes the inventory by urgency. A dashboard summarizes the inventory, while search, filters, and sorting make it easier to find a particular product. Optional reminders provide a timely heads-up before expiry.

Product data is associated with the signed-in user and stored by the backend. A new account starts with an empty inventory; products are added by the user.

## Features

- **Account access:** Register, sign in, restore an authenticated session, and sign out.
- **Inventory management:** Add, view, edit, delete, mark products consumed, or mark products discarded.
- **Expiry tracking:** See expired, expiring today, expiring soon, and safe products. Expiry status is calculated from dates rather than stored as a fixed status.
- **Dashboard:** View active inventory totals, expiry counts, consumed and discarded counts, category distribution, and an expiry outlook.
- **Find and organize:** Search by product name; filter by category, expiry status, consumed, or discarded state; sort and paginate inventory.
- **Use These First:** See active products ordered by the nearest expiry, with expired and approaching-expiry products prioritized.
- **Reminders:** View in-app reminders and optionally enable email reminders at 7, 3, 1, and 0 days before expiry.
- **Settings:** Update the display name and save in-app, email, and reminder-day preferences.
- **Responsive interface:** Use the dashboard and inventory on desktop, tablet, and mobile layouts.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | React 18, JavaScript/JSX, Vite |
| Styling and UI | Tailwind CSS, custom CSS, Lucide React |
| Routing and charts | React Router DOM, Recharts |
| User feedback | React Hot Toast |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Email and scheduling | Nodemailer, node-cron |

## Application architecture

```text
Browser
  React/Vite frontend
       | JSON requests with JWT Bearer token
       v
  Express API
       | Mongoose queries scoped to authenticated user
       v
  MongoDB

Express reminder scheduler
  Daily check at 09:00 Asia/Kolkata
       |-- persistent in-app reminder records
       `-- optional SMTP email delivery through Nodemailer
```

The frontend API base URL is configurable through `VITE_API_BASE_URL`. The backend exposes authenticated APIs for the user’s inventory, dashboard, preferences, and notifications. SMTP is optional; when it is not configured, the backend can continue to provide the rest of the application and in-app reminders.

## Project structure

```text
ExpirEase/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Requirements

- Node.js and npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- SMTP account details only if email reminders are required

## Getting started

### 1. Configure the backend

Open a terminal at the repository root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and set:

| Variable | Purpose |
|---|---|
| `PORT` | API port; defaults to `5000` in the template. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Private signing secret; use a random value of at least 32 characters. |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d`. |
| `CLIENT_URL` | Frontend origin allowed by CORS, normally `http://localhost:5173`. |

Start the API:

```powershell
npm run dev
```

The health endpoint is `http://localhost:5000/api/health`.

### 2. Configure and run the frontend

Open a second terminal at the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend template sets `VITE_API_BASE_URL=http://localhost:5000`. Change it in `frontend/.env` if the backend is hosted elsewhere. Vite prints the local frontend URL when the development server starts.

To create a frontend production build:

```powershell
cd frontend
npm run build
```

## Email reminder configuration

Email is optional. To enable it, fill these values in the local `backend/.env` using credentials and sender details from your SMTP provider:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Then restart the backend and enable **Email reminders** in the application’s Settings page. Keep all secrets in local environment files; never put them in frontend code or commit them to Git.

The scheduler runs daily at 09:00 Asia/Kolkata and checks active products for the 7-, 3-, 1-, and 0-days-remaining email milestones. A reminder is recorded as sent only after the SMTP provider accepts the recipient. Persistent reminder records prevent duplicate attempts for the same product, expiry date, milestone, and channel. Products added after a milestone’s daily check do not receive that missed email retrospectively. Email delivery depends on valid SMTP configuration and is not guaranteed by the application alone.

## API overview

Protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication and account

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account. |
| `POST` | `/api/auth/login` | Sign in and receive a token. |
| `GET` | `/api/auth/me` | Retrieve the authenticated account. |
| `PATCH` | `/api/auth/me` | Update the display name or notification/reminder preferences. |

### Inventory and dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/products` | Add a product. |
| `GET` | `/api/products` | List products with search, filters, sorting, and pagination. |
| `GET` | `/api/products/:id` | Retrieve one product. |
| `PUT` | `/api/products/:id` | Update a product. |
| `DELETE` | `/api/products/:id` | Delete a product. |
| `PATCH` | `/api/products/:id/consumed` | Mark a product consumed. |
| `PATCH` | `/api/products/:id/discarded` | Mark a product discarded. |
| `GET` | `/api/products/expired` | List expired products. |
| `GET` | `/api/products/expiring/today` | List products expiring today. |
| `GET` | `/api/products/expiring/soon` | List products expiring within the next seven days, excluding today. |
| `GET` | `/api/products/safe` | List products more than seven days from expiry. |
| `GET` | `/api/products/priority` | List active products ordered by nearest expiry. |
| `GET` | `/api/dashboard` | Retrieve inventory statistics and category/expiry summaries. |

Product list query parameters include `search`, `category`, `status=expired|today|soon|safe`, `consumed`, `discarded`, `sort=nearest|farthest|name|recent`, `page`, and `limit` (maximum 100).

### Notifications

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/notifications` | List in-app reminders and report whether SMTP is configured. |
| `PATCH` | `/api/notifications/:id/read` | Mark an in-app reminder as read. |

## Data, privacy, and scope

- Inventory and account data are stored by the backend in MongoDB, not duplicated in product LocalStorage.
- Product operations are scoped to the authenticated user.
- Passwords are hashed by the backend; passwords are not stored in browser LocalStorage.
- Environment files containing secrets are local configuration and must remain untracked.
- Expiry tracking and reminders are informational. ExpirEase does not determine product or medicine safety.

## Current limitations

- Email delivery requires the user to configure a working SMTP provider and sender address.
- Reminder emails are scheduled once daily, so the exact delivery time depends on the backend being running and connected to MongoDB.
- This repository provides the application source and local run instructions; production hosting and operational monitoring must be configured separately.
