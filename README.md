# BiteSpeed Identity Reconciliation Service

This is a production-ready backend service built with Node.js, Express, TypeScript, and Prisma ORM to reconcile customer identities across multiple purchases.

## Features

- **Identity Reconciliation**: Links customer contacts using email or phone number matching.
- **Primary/Secondary Hierarchy**: Automatically determines the oldest contact as PRIMARY and links others as SECONDARY.
- **Automatic Merging**: Merges previously separate primary contacts when a new purchase links them.
- **RESTful API**: Simple POST `/identify` endpoint.
- **Database Indexing**: Optimized for performance with indexes on email and phone number.

## Tech Stack

- **Node.js** (v18+)
- **TypeScript**
- **Express**
- **Prisma ORM**
- **PostgreSQL**

## Project Structure

```text
src/
  controllers/   # Request handlers
  services/      # Business logic (Reconciliation algorithm)
  routes/        # API route definitions
  db/            # Database client setup
  utils/         # Helper functions
  app.ts         # Express application setup
  server.ts      # Server entry point
prisma/          # Prisma schema and migrations
```

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd bitespeed
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed?schema=public"
PORT=3000
```

### 4. Database Setup
Run Prisma migrations to create the tables:
```bash
npx prisma migrate dev --name init
```

### 5. Start the Server
- **Development**: `npm run dev`
- **Production**: `npm run build && npm run start`

---

## API Usage

### `POST /identify`

Consolidates contact information.

**Request Body:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response Body:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

## Postman Verification

To verify the implementation, import the following scenarios into Postman:

### Example 1: New Contact
- **Endpoint**: `POST /identify`
- **Body**: `{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}`
- **Expected**: A new primary contact is created.

### Example 2: Same Phone, Different Email
- **Endpoint**: `POST /identify`
- **Body**: `{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}`
- **Expected**: A secondary contact is created linking to the primary from Example 1. Both emails appear in the response.

### Example 3: Merging Two Primaries
1. Create Primary A: `{"email": "george@hillvalley.edu", "phoneNumber": "999999"}`
2. Create Primary B: `{"email": "biff@hillvalley.edu", "phoneNumber": "888888"}`
3. Merge them: `{"email": "george@hillvalley.edu", "phoneNumber": "888888"}`
- **Expected**: The oldest primary remains PRIMARY, the other becomes SECONDARY. All info is consolidated.

---

## Deployment on Render.com

1. **Connect Repository**: Link your GitHub repo to Render as a **Web Service**.
2. **Environment Variables**: Add `DATABASE_URL` (from your managed Postgres instance).
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Render Infrastructure**: Render will automatically run the `postinstall` script in `package.json` to generate the Prisma client.

**Important Note on Migrations**: Since Render's ephemeral disk doesn't persist, you should run `npx prisma migrate deploy` as part of your build process or manually via a shell if you're not using a database that auto-migrates. Recommended Build Command: `npm install && npx prisma migrate deploy && npm run build`.
