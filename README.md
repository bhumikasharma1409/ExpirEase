# ExpirEase

Smart Expiry Tracker is a frontend-only React application for tracking product expiry dates, inventory, and reminders.

## Frontend

The React/Vite application lives in [`frontend/`](./frontend/). It uses LocalStorage for demo inventory, profile, and preference persistence. Authentication and reminder delivery are frontend-only; no backend APIs or email/push services are configured.

### Run locally

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Create a production build with `npm run build` from `frontend/`.

### Project layout

```text
ExpirEase/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── Vite, Tailwind CSS, and PostCSS configuration
├── .gitignore
└── README.md
```
