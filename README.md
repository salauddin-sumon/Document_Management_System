# Document_Management_System

An internal app for keeping records about your company's dealers: their details, issue letters, internal notices, and documents. Dealers never log in and are never notified. Only your staff use it.

Built with the **MERN** stack (MongoDB, Express, React, Node) using an **MVC** structure.

## Features

- **Login:** admins sign in with email and password. ZM/HOS and staff sign in with their **staff ID** and password. Sessions use a JWT in an httpOnly cookie. There is no public signup.
- **Roles:**

  | | Admin | ZM/HOS | Staff |
  |---|---|---|---|
  | View dealers, letters, notices, documents | ✓ | ✓ | ✓ |
  | Issue letters ("Issue a letter") | ✓ | ✓ | |
  | Edit/delete issue letters | ✓ | | |
  | Add/edit/delete dealers, notices, documents | ✓ | | |
  | Manage users | ✓ | | |

- **Dealers:** each dealer (person) gets an automatic unique **Dealer ID** (DLR-0001…) and has owner name, mobile, NID number, trade license and status. **Add dealer** takes one dealer code at a time (code, BU, sales group, zone, base name, code open date). If the NID number **or** trade license already belongs to a dealer, the form asks whether to keep that Dealer ID (add the code under it) or create a new one. When both match it can only be added under the existing ID. With no match, a new dealer is created. Searching an exact Dealer ID shows the full profile with every code.
- **Letters:** issue date, reference no (unique), dealer code, BU (taken from the dealer code), issuer name, issuer staff ID, designation, note and an optional attachment.
- **Notices and other files:** internal notes and extra files on each dealer.
- **Overview:** counts of dealers, dealer codes, Active/Suspended/Closed dealers and letters this year, plus recent letters and recently updated dealers.
- **UI:** green, white and red theme with English and Bangla labels.

## Project structure (MVC)

```
server/                  Express API
  models/                M — Mongoose schemas (User, Dealer + dealer codes, Counter, IssueLetter, Notice, Document)
  controllers/           C — request handling / business logic
  routes/                URL → middleware → controller
  middleware/            auth, validation, file upload, errors
  config/db.js           MongoDB connection
  utils/seed.js          creates the first admin
  app.js / server.js     Express app / startup
client/                  React (Vite) app
  src/pages/             V — one component per screen
  src/components/        shared UI pieces
  src/context/           AuthContext (logged-in user)
  src/api/client.js      axios instance
```

Request flow: React page → axios → `/api/...` route → middleware → controller → model → MongoDB → JSON → React.

## Setup

1. **Install everything** from the project root:
   ```
   npm run install-all
   ```
2. **Configure** `server/.env` (copy `server/.env.example` if it's missing):
   - `MONGO_URI`: your MongoDB Atlas connection string
   - `JWT_SECRET`: any long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: your first admin login
3. **Create the admin user:**
   ```
   npm run seed
   ```
4. **Run in development** (API on :5050, React on :5180):
   ```
   npm run dev
   ```
   Open http://localhost:5180 and log in.

## Production

```
npm run build                         # builds client/dist
NODE_ENV=production npm start         # Express serves the API and the React build on :5050
```

## File storage (Backblaze B2)

MongoDB stores the data. Uploaded files (letter attachments, dealer files) are stored separately:

- **Backblaze B2**, when `B2_ENDPOINT`, `B2_BUCKET`, `B2_KEY_ID` and `B2_APP_KEY` are set in `server/.env`. Files are private and only reachable through the app's logged-in download links. They survive restarts and redeploys, so free hosting works.
- **Local disk** (`server/uploads/`) when those values are empty. This is fine for development, but free hosts wipe this folder on restart.

The server prints which one it uses at startup (`File storage: ...`).

```
npm run storage:check     # uploads, reads back and deletes a test file to prove the settings work
npm run storage:migrate   # copies files still in server/uploads into B2 (safe to run more than once)
```

Code: `server/utils/storage.js` (B2 or disk) and `server/utils/files.js` (save, stream, delete).

## API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` (`{ identifier, password }`; identifier = staff ID, or email for admins) · `/api/auth/logout` | public |
| GET | `/api/auth/me` · PUT `/api/auth/password` | logged in |
| GET, POST | `/api/users` · PUT, DELETE `/api/users/:id` | admin |
| GET | `/api/dealers` (`?search=&zone=&bu=&status=&page=`) · `/api/dealers/:id` | all |
| GET | `/api/dealers/meta` (zones, BUs, sales groups, base names) · `/api/dealers/lookup` (admin) · `/api/dealers/codes` (all codes) | all |
| POST | `/api/dealers` (with `codes: [{ dealerCode, business, businessName, codeOpenDate }]`) · PUT, DELETE `/api/dealers/:id` | admin |
| GET | `/api/issue-letters` (`?search=&letterType=&dealer=&page=`) · `/types` · `/:id` · `/:id/attachment` | all |
| POST (multipart, optional `attachment`) | `/api/issue-letters` | admin, ZM/HOS |
| PUT, DELETE | `/api/issue-letters/:id` | admin |
| GET | `/api/dealers/:id/notices` · `/api/dealers/:id/documents` · `/api/documents/:id/download` | all |
| POST, PUT, DELETE | notices and documents | admin |
| GET | `/api/dashboard/stats` | all |
"# Document_Management_System" 
