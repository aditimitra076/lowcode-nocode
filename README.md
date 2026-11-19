# VisualForge Studio

A low-code / no-code website builder with a developer marketplace.

- `frontend/` – React + Vite app (builder, marketplace, admin)
- `backend/` – Express + MongoDB API
- `test/` – black box and white box tests (see `test/README.md`)

## Run it on a new computer

You need **Node.js 22 or newer** and access to the project's **MongoDB** database.

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Create `backend/.env`

`backend/.env` is **not in git** (it holds secrets), so a fresh clone does not have it. Copy the example and fill it in:

```bash
cd backend
cp .env.example .env
```

| Variable | What to put there |
|---|---|
| `MONGODB_URI` | The database connection string. **Ask the project owner for it** (do not commit it). Without it nothing works: login, projects and the marketplace all fail. |
| `JWT_SECRET` | A long random string. Use the same value as the owner if you share their database and want existing logins to stay valid. |
| `CLIENT_ORIGIN` | Address(es) the frontend is opened from, comma-separated, for example `http://localhost:5173,http://192.168.1.20:5173`. |
| `PORT` | API port, default `5000`. |
| `SEED_ADMIN_PASSWORD` | Only needed for `npm run seed:admin` (below). |

### 3. Allow your computer in MongoDB Atlas

If the database is on MongoDB Atlas, Atlas only accepts connections from IP addresses on its allow list.
In Atlas open **Network Access → Add IP Address** and add this computer's public IP (or ask the owner to).
Until this is done the API answers every request with *"The server cannot reach its database"* (HTTP 503).

### 4. Start

Two terminals:

```bash
cd backend && npm run dev      # API on http://localhost:5000, prints "Database connected!"
cd frontend && npm run dev     # app on http://localhost:5173
```

Check the API and database any time: open `http://localhost:5000/api/health` – it should show `"database":"connected"`.

### 5. Only for an empty database

If you point `MONGODB_URI` at a **new, empty** database there are no accounts and no marketplace listings yet:

```bash
cd backend
npm run seed:admin       # creates admin@vf.test with the password in SEED_ADMIN_PASSWORD
npm run seed:showcase    # creates three sample sites and publishes them to the marketplace
```

Do **not** run `seed:showcase` against the shared database: it deletes and recreates the showcase sites.

## Marketplace rules

- A project is published from the builder (**Publish**). It becomes `Pending`.
- Only **Approved** listings are visible to other people. An **Admin** approves or rejects them in the admin area.
- Visitors can browse and open approved listings without logging in. Using a listing as a template needs an account.

## Letting other people open your copy

- Other people on the same network can open `http://<your-computer-ip>:5173` while both servers are running on your computer. Allow Node.js / ports 5173 and 5000 through the Windows firewall if the page does not load.
- `localhost` always means *the computer you are on*, so it does not work from another device.
- If the frontend is hosted on a different address than the API, build it with `VITE_API_URL=<api address>` (see `frontend/.env.example`) and add the frontend address to `CLIENT_ORIGIN`.

## Troubleshooting

| What you see | Cause |
|---|---|
| `http proxy error … ECONNREFUSED` in the frontend terminal | The backend is not running. Start it (`npm run dev` in `backend/`). |
| "The server cannot reach its database right now" / HTTP 503 | `MONGODB_URI` is missing or wrong, or this computer's IP is not allowed in Atlas. The backend log says which, and retries every 10 seconds. |
| Marketplace is empty for other people | The listing is not **Approved** yet, or they are connected to a different (empty) database. |
| Login says "Could not reach the API server" | The frontend cannot reach the backend (not running, wrong `VITE_API_URL`, or CORS: add the frontend address to `CLIENT_ORIGIN`). |
