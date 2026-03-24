# Quickstart: Consultant Contribution Analysis MVP

This guide explains how to run the backend API and frontend UI for the Consultant Contribution Analysis MVP.

## Prerequisites

- Node.js LTS (e.g., 20.x) installed
- npm (bundled with Node.js)

## 1. Install dependencies

From the repository root:

```sh
cd backend
npm install

cd ../frontend
npm install
```

## 2. Run the backend API

From the `backend` directory:

```sh
npm run dev
```

- The API listens on `http://localhost:4000` by default.
- CORS is configured to allow requests from the Vite dev server at `http://localhost:5173`.
- Data is stored in JSON files under `backend/data/`.

## 3. Run the frontend

In a separate terminal, from the `frontend` directory:

```sh
npm run dev
```

- Open the printed Vite dev URL (typically `http://localhost:5173`).
- The dashboard loads the current month, lets you enter hours, and shows per-consultant and team summaries.

## 4. Core flows to try

1. **Set up consultants**
   - Switch to the **Consultants** tab.
   - Create a few consultants with salary, hourly rate, and status `active`.
2. **Enter monthly hours**
   - Switch back to the **Dashboard** tab.
   - Select a month and enter billable/non-billable hours for each active consultant.
   - Click **Save hours** to persist data and update summaries.
3. **Manage consultants**
   - Mark a consultant as `inactive`.
   - Confirm they disappear from new months' input forms but remain in historical summaries.
4. **View trends**
   - After entering data for at least three months, look at the **3-month team trend** section on the dashboard.

## 5. Running tests

From the `backend` directory:

```sh
npm test
```

This runs unit tests for domain calculations and summary logic, plus a small integration test that exercises entries and summaries together.
