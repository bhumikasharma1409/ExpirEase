# ExpirEase

ExpirEase is a Smart Expiry Tracker with a React/Vite frontend and an Express/MongoDB backend. The frontend tracks food, medicines, personal care, household, and other products. Medicine functionality is limited to expiry tracking and reminders.

## Frontend

The responsive React application lives in `frontend/`. It uses the backend for authentication, inventory, dashboard analytics, settings, and in-app reminders.

From the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

By default, the frontend calls `http://localhost:5000`. Set `VITE_API_BASE_URL` in `frontend/.env` to override the backend base URL. Build with `npm run build` from `frontend/`.

## Backend

The Express API and Mongoose models live in `backend/`.

From the repository root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Set `MONGO_URI` to the MongoDB Atlas connection string and configure a private `JWT_SECRET` of at least 32 characters in `backend/.env`. The database name is `expirEase_db`. Do not commit or share the `.env` file.

The API defaults to port `5000`; health check: `GET http://localhost:5000/api/health`.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me` — update the profile name and reminder preferences.

### Inventory and dashboard

All routes below require a valid Bearer token.

- `POST /api/products` — add a product.
- `GET /api/products` — list products. Query parameters: `search`, `category`, `status=expired|today|soon|safe`, `consumed=true|false`, `discarded=true|false`, `sort=nearest|farthest|name|recent`, `page`, and `limit` (maximum 100).
- `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`.
- `PATCH /api/products/:id/consumed` and `PATCH /api/products/:id/discarded`.
- `GET /api/products/expired`, `/api/products/expiring/today`, `/api/products/expiring/soon`, `/api/products/safe`, and `/api/products/priority`.
- `GET /api/dashboard` — inventory statistics, category distribution, and expiry outlook.
- `GET /api/notifications` and `PATCH /api/notifications/:id/read` — in-app reminder list and read status.

Product ownership is derived from the verified JWT. Expiry status is calculated dynamically and is not stored in the database.

## Reminder configuration

The backend checks active products daily at 09:00 Asia/Kolkata time. In-app reminders are stored in MongoDB when enabled in user settings. Email reminders are sent at 7, 3, 1, and 0 days before expiry when enabled. Persistent reminder records have uniqueness constraints to prevent duplicate reminders for the same product, expiry date, reminder interval, and delivery channel. A product added after a milestone's 09:00 check does not receive that missed email reminder retrospectively.

Email delivery is optional. Configure the following values in the local `backend/.env` to enable it:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Set `EMAIL_FROM` to a sender address accepted by your SMTP provider. Keep all SMTP credentials in `backend/.env`, never in the frontend or Git. Email preference changes are stored on the user profile. The backend records an email as sent only after SMTP reports the recipient as accepted; failed attempts are recorded separately and are not shown as sent. If SMTP is not configured, the backend continues to run and in-app reminders remain available.

## Project layout

```text
ExpirEase/
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── index.html
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
