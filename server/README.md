# Disaster Management Backend (TypeScript + Express + MongoDB)

This is a minimal scaffold of the Express + MongoDB backend in TypeScript.

Quick start (development):

1. Install dependencies

```powershell
cd server
npm install
```

2. Create `.env` (copy `.env.example` and fill values)

3. Start in dev mode

```powershell
npm run dev
```

Build & run production:

```powershell
npm run build
npm start
```

Environment variables:
- `MONGODB_URI` - MongoDB connection string
- `PORT` - server port (default 4000)
- `JWT_SECRET` - secret for signing JWTs
- `JWT_EXPIRES_IN` - expiration (example `7d`)

This scaffold includes basic JWT auth, models for User/RescueCenter/Guest and routes for auth, centers and guests.
