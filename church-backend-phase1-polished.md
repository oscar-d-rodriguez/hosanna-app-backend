# Church Backend Phase 1 — Cloud Run + Express

> A step-by-step guide to building a production-ready church app backend.
> Each step explains **what** you're building, **why** it matters, and provides working code.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Step 0 — Project Setup](#step-0--project-setup)
3. [Step 1 — Install Dependencies](#step-1--install-dependencies)
4. [Step 2 — Project Structure (Clean Architecture)](#step-2--project-structure-clean-architecture)
5. [Step 3 — Environment Configuration](#step-3--environment-configuration)
6. [Step 4 — Firebase Admin Setup](#step-4--firebase-admin-setup)
7. [Step 5 — Logging with Pino](#step-5--logging-with-pino)
8. [Step 6 — Auth Middleware (Firebase Token Verification)](#step-6--auth-middleware-firebase-token-verification)
9. [Step 7 — Error Handling](#step-7--error-handling)
10. [Step 8 — Rate Limiting](#step-8--rate-limiting)
11. [Step 9 — Validation Schemas (Zod)](#step-9--validation-schemas-zod)
12. [Step 10 — Repository Layer (Firestore)](#step-10--repository-layer-firestore)
13. [Step 11 — Service Layer (Business Logic)](#step-11--service-layer-business-logic)
14. [Step 12 — Route Layer (API Endpoints)](#step-12--route-layer-api-endpoints)
15. [Step 13 — Express Server](#step-13--express-server)
16. [Step 14 — Dockerfile & Cloud Run Deployment](#step-14--dockerfile--cloud-run-deployment)
17. [Validation Checklist](#validation-checklist)
18. [What's Next (Phase 2)](#whats-next-phase-2)

---

## Architecture Overview

This backend follows **Clean Architecture** (also called layered architecture). The idea is simple: separate your code into layers so each layer has one job.

```
Request → Route → Service → Repository → Firestore
              ↑         ↑
          Middleware   Validation
```

| Layer | Job | Depends On |
|-------|-----|------------|
| **Routes** (`api/`) | Accept HTTP requests, call services, return responses | Services, Middleware |
| **Services** (`services/`) | Business logic — rules like "only admins can delete" | Repositories |
| **Repositories** (`repositories/`) | Read/write data to Firestore | Firebase Admin SDK |
| **Models** (`models/`) | Zod schemas that validate incoming data | Nothing |
| **Middleware** (`middleware/`) | Auth checks, error handling, rate limiting | Firebase Admin SDK |
| **Config** (`config/`) | Firebase init, env vars, logger setup | Environment |

### Why Clean Architecture?

- **Testable** — You can test services without needing a real database.
- **Swappable** — Want to switch from Firestore to PostgreSQL? Only the repository layer changes.
- **Readable** — New developers can find things quickly because everything has a home.

---

## Step 0 — Project Setup

**What:** Initialize a new Node.js project.

```bash
mkdir church-backend && cd church-backend
npm init -y
```

**Why `npm init -y`?** It creates a `package.json` with defaults. This file tracks your dependencies and scripts. The `-y` flag skips the interactive prompts.

---

## Step 1 — Install Dependencies

**What:** Add the libraries this project needs.

```bash
# Production dependencies
npm install express firebase-admin cors dotenv zod pino pino-pretty express-rate-limit

# Development dependencies
npm install --save-dev nodemon
```

### What each package does:

| Package | Purpose |
|---------|---------|
| `express` | Web framework — handles HTTP requests and routing |
| `firebase-admin` | Server-side Firebase SDK — verifies auth tokens, reads/writes Firestore |
| `cors` | Cross-Origin Resource Sharing — lets your frontend (different domain) call this API |
| `dotenv` | Loads `.env` file variables into `process.env` |
| `zod` | Schema validation — ensures incoming data has the right shape and types |
| `pino` | Fast, structured JSON logger (much better than `console.log` in production) |
| `pino-pretty` | Makes Pino logs human-readable during development |
| `express-rate-limit` | Prevents abuse by limiting how many requests a client can make |
| `nodemon` | Auto-restarts the server when you save a file (dev only) |

---

## Step 2 — Project Structure (Clean Architecture)

**What:** Create the folder structure.

```bash
mkdir -p src/{api/routes,services,repositories,models,middleware,config}
```

```
src/
├── api/
│   └── routes/
│       └── events.routes.js    ← HTTP endpoint definitions
├── config/
│   ├── firebase.js             ← Firebase Admin initialization
│   ├── logger.js               ← Pino logger setup
│   └── environment.js          ← Env var loading & validation
├── middleware/
│   ├── auth.middleware.js       ← Firebase token verification
│   ├── error.middleware.js      ← Global error handler
│   └── rateLimiter.middleware.js
├── models/
│   └── event.model.js           ← Zod validation schemas
├── repositories/
│   └── event.repository.js      ← Firestore read/write operations
├── services/
│   └── event.service.js          ← Business logic
└── server.js                     ← Express app entry point
```

**Key rule:** Each file does ONE thing. If a file starts doing too much, split it.

---

## Step 3 — Environment Configuration

**What:** Set up environment variables so secrets never live in your code.

**Why this matters:** Hardcoding secrets (API keys, database URLs) into source code is a security risk. Anyone who sees your code sees your secrets. Environment variables keep them separate.

### Create `.env` (local development only — never commit this)
```
NODE_ENV=development
PORT=8080
```

### Create `.env.example` (commit this — shows other devs what's needed)
```
NODE_ENV=development
PORT=8080
```

### `src/config/environment.js`
```js
require('dotenv').config();

const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = environment;
```

> **Cloud Run note:** Cloud Run automatically sets the `PORT` environment variable. Your app *must* listen on it. That's why we read `process.env.PORT` instead of hardcoding `8080`.

> **Firebase on Cloud Run:** When deployed to Google Cloud, `firebase-admin` automatically uses the service account attached to your Cloud Run service — no JSON key file needed. The key file is only for local development.

---

## Step 4 — Firebase Admin Setup

**What:** Initialize the Firebase Admin SDK so your server can verify auth tokens and access Firestore.

**How it works:** Firebase Admin runs with *elevated privileges* — it bypasses Firestore security rules. This is intentional for a backend: your Express routes and middleware enforce access control instead.

### `src/config/firebase.js`
```js
const admin = require('firebase-admin');
const environment = require('./environment');

// On Cloud Run, default credentials are automatically available.
// Locally, set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
```

### Local development setup:
```bash
# Download a service account key from Firebase Console → Project Settings → Service Accounts
# Then set this env var (add to .env):
GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json
```

> **Security:** Add `firebase-adminsdk.json` to `.gitignore` immediately. Never commit service account keys.

---

## Step 5 — Logging with Pino

**What:** Set up structured logging that works in both development and production.

**Why not `console.log`?** In production (Cloud Run), logs go to Google Cloud Logging. `console.log` outputs plain strings that are hard to search and filter. Pino outputs structured JSON with timestamps, levels, and context — which Cloud Logging can parse and index automatically.

### `src/config/logger.js`
```js
const pino = require('pino');
const environment = require('./environment');

const logger = pino({
  level: environment.isProduction ? 'info' : 'debug',
  ...(environment.isProduction
    ? {} // JSON output in production (Cloud Logging parses it)
    : { transport: { target: 'pino-pretty' } } // Pretty output locally
  ),
});

module.exports = logger;
```

### Usage anywhere in the app:
```js
const logger = require('../config/logger');

logger.info({ userId: '123' }, 'User logged in');    // Structured data + message
logger.error({ err }, 'Failed to create event');      // Attach error objects
logger.debug('This only shows in development');
```

---

## Step 6 — Auth Middleware (Firebase Token Verification)

**What:** Protect your API routes so only authenticated users can access them.

**How it works:**
1. The frontend signs in with Firebase Auth and gets an **ID token** (a JWT).
2. The frontend sends this token in the `Authorization: Bearer <token>` header.
3. This middleware extracts the token, asks Firebase to verify it, and attaches the decoded user info to the request.

### `src/middleware/auth.middleware.js`
```js
const { auth } = require('../config/firebase');
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // This is the critical step — Firebase verifies the token's signature,
    // checks it hasn't expired, and returns the decoded payload
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to the request so routes/services can use it
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'member', // Custom claims for roles
    };

    next();
  } catch (err) {
    logger.warn({ err }, 'Invalid auth token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
```

> **What is `verifyIdToken`?** It does three things: (1) checks the token's cryptographic signature is from Firebase, (2) checks the token hasn't expired, (3) returns the user's UID, email, and any custom claims you've set.

> **Custom Claims for Roles:** You can set roles like `admin` or `leader` using `admin.auth().setCustomUserClaims(uid, { role: 'admin' })`. These claims are embedded in the token and available in `decodedToken.role`.

---

## Step 7 — Error Handling

**What:** A global error handler so unhandled errors return clean JSON instead of crashing the server.

**Why this is critical:** In Express, if an async route throws and you don't catch it, the server can crash or hang. A global error handler catches everything that falls through.

### `src/middleware/error.middleware.js`
```js
const logger = require('../config/logger');

// Custom error class for business logic errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs
  }
}

// Wraps async route handlers so thrown errors reach the error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler — must have 4 parameters so Express recognizes it
const errorHandler = (err, req, res, _next) => {
  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Known operational errors (e.g., "Event not found")
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown errors — log the full error, but don't leak details to the client
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({ error: 'Internal server error' });
};

module.exports = { AppError, asyncHandler, errorHandler };
```

### How these pieces work together:
```js
// In a route file:
const { asyncHandler, AppError } = require('../middleware/error.middleware');

router.get('/:id', asyncHandler(async (req, res) => {
  const event = await eventService.getById(req.params.id);
  if (!event) throw new AppError('Event not found', 404);  // Clean error
  res.json(event);
}));
// If getById() throws unexpectedly, asyncHandler catches it → errorHandler logs it → client gets 500
```

---

## Step 8 — Rate Limiting

**What:** Limit how many requests a client can make in a time window.

**Why:** Without rate limiting, a single client (or bot) can overwhelm your server with thousands of requests. This is one of the simplest and most effective protections against abuse.

### `src/middleware/rateLimiter.middleware.js`
```js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Max 100 requests per window per IP
  standardHeaders: true,     // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

module.exports = apiLimiter;
```

> **Note:** On Cloud Run behind a load balancer, the client's real IP is in the `X-Forwarded-For` header. Express needs `app.set('trust proxy', true)` for rate limiting to use the correct IP.

---

## Step 9 — Validation Schemas (Zod)

**What:** Define the exact shape of data your API accepts using Zod schemas.

**Why Zod?** It validates data at runtime (TypeScript only checks at compile time). If someone sends `{ title: 123 }` instead of `{ title: "Sunday Service" }`, Zod catches it and gives a clear error message. This prevents bad data from ever reaching your database.

### `src/models/event.model.js`
```js
const { z } = require('zod');

const createEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO 8601 datetime string' }),
  location: z.string().max(300).optional(),
  type: z.enum(['service', 'event', 'meeting', 'outreach']).default('event'),
});

const updateEventSchema = createEventSchema.partial();
// .partial() makes all fields optional — perfect for PATCH updates

module.exports = { createEventSchema, updateEventSchema };
```

### How validation integrates with routes:
```js
// In a route handler:
const validated = createEventSchema.parse(req.body);
// If invalid → throws ZodError → caught by errorHandler → returns 400 with field-level details
// If valid → returns the cleaned, typed data
```

---

## Step 10 — Repository Layer (Firestore)

**What:** All Firestore read/write operations live here. No other layer touches the database directly.

**Why isolate database access?** If you later switch from Firestore to PostgreSQL, you only rewrite this layer. Services and routes stay the same.

### `src/repositories/event.repository.js`
```js
const { db } = require('../config/firebase');
const logger = require('../config/logger');

const COLLECTION = 'events';

const eventRepository = {
  async create(data) {
    const docRef = await db.collection(COLLECTION).add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info({ eventId: docRef.id }, 'Event created in Firestore');
    return { id: docRef.id, ...data };
  },

  async getById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async list({ limit = 20, startAfter } = {}) {
    let query = db
      .collection(COLLECTION)
      .orderBy('date', 'asc')
      .limit(limit);

    // Cursor-based pagination — more efficient than offset in Firestore
    if (startAfter) {
      const startDoc = await db.collection(COLLECTION).doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async update(id, data) {
    await db.collection(COLLECTION).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return this.getById(id);
  },

  async delete(id) {
    await db.collection(COLLECTION).doc(id).delete();
    logger.info({ eventId: id }, 'Event deleted from Firestore');
  },
};

module.exports = eventRepository;
```

> **Pagination in Firestore:** Firestore doesn't support `OFFSET`. Instead, you use **cursor-based pagination** with `startAfter()`. The client passes the last document ID it received, and Firestore picks up from there. This is more efficient for large datasets.

---

## Step 11 — Service Layer (Business Logic)

**What:** Business rules live here. Services call repositories, never the other way around.

**Examples of business logic:**
- "Only admins can delete events"
- "Events can't be created in the past"
- "Attach the creating user's ID to the event"

### `src/services/event.service.js`
```js
const eventRepository = require('../repositories/event.repository');
const { AppError } = require('../middleware/error.middleware');

const eventService = {
  async create(data, user) {
    return eventRepository.create({
      ...data,
      createdBy: user.uid,
    });
  },

  async getById(id) {
    const event = await eventRepository.getById(id);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async list(options) {
    return eventRepository.list(options);
  },

  async update(id, data, user) {
    const event = await eventRepository.getById(id);
    if (!event) throw new AppError('Event not found', 404);

    // Only the creator or an admin can update
    if (event.createdBy !== user.uid && user.role !== 'admin') {
      throw new AppError('Not authorized to update this event', 403);
    }

    return eventRepository.update(id, data);
  },

  async delete(id, user) {
    const event = await eventRepository.getById(id);
    if (!event) throw new AppError('Event not found', 404);

    // Only admins can delete
    if (user.role !== 'admin') {
      throw new AppError('Only admins can delete events', 403);
    }

    await eventRepository.delete(id);
  },
};

module.exports = eventService;
```

> **Notice:** The service never imports `express`, `req`, or `res`. It only knows about data and business rules. This makes it easy to test — you can call `eventService.create(data, fakeUser)` in a test without spinning up an HTTP server.

---

## Step 12 — Route Layer (API Endpoints)

**What:** Define your HTTP endpoints. Routes are thin — they parse the request, call a service, and return the response.

### `src/api/routes/events.routes.js`
```js
const { Router } = require('express');
const eventService = require('../../services/event.service');
const { createEventSchema, updateEventSchema } = require('../../models/event.model');
const authMiddleware = require('../../middleware/auth.middleware');
const { asyncHandler } = require('../../middleware/error.middleware');

const router = Router();

// All event routes require authentication
router.use(authMiddleware);

// POST /api/events — Create a new event
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createEventSchema.parse(req.body);
    const event = await eventService.create(data, req.user);
    res.status(201).json(event);
  })
);

// GET /api/events — List events (with optional pagination)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, startAfter } = req.query;
    const events = await eventService.list({
      limit: limit ? parseInt(limit, 10) : undefined,
      startAfter,
    });
    res.json(events);
  })
);

// GET /api/events/:id — Get a single event
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await eventService.getById(req.params.id);
    res.json(event);
  })
);

// PATCH /api/events/:id — Update an event
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateEventSchema.parse(req.body);
    const event = await eventService.update(req.params.id, data, req.user);
    res.json(event);
  })
);

// DELETE /api/events/:id — Delete an event (admin only)
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await eventService.delete(req.params.id, req.user);
    res.status(204).send();
  })
);

module.exports = router;
```

### API Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events` | Required | Create event |
| GET | `/api/events` | Required | List events (paginated) |
| GET | `/api/events/:id` | Required | Get one event |
| PATCH | `/api/events/:id` | Required | Update event (owner/admin) |
| DELETE | `/api/events/:id` | Admin only | Delete event |

---

## Step 13 — Express Server

**What:** Wire everything together into a running Express application.

### `src/server.js`
```js
const express = require('express');
const cors = require('cors');
const environment = require('./config/environment');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/error.middleware');
const apiLimiter = require('./middleware/rateLimiter.middleware');
const eventsRouter = require('./api/routes/events.routes');

const app = express();

// --- Core Middleware ---

// Trust proxy — required on Cloud Run so rate limiter sees real client IPs
app.set('trust proxy', true);

// CORS — restrict origins in production
app.use(
  cors({
    origin: environment.isProduction
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent abuse

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// --- Routes ---

// Health check — Cloud Run uses this to know your service is ready
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/events', eventsRouter);

// --- Error Handling (must be registered LAST) ---
app.use(errorHandler);

// --- Start Server ---
app.listen(environment.port, () => {
  logger.info({ port: environment.port, env: environment.nodeEnv }, 'Server started');
});
```

### Key things to notice:

1. **`trust proxy`** — Cloud Run sits behind a Google load balancer. Without this, `req.ip` returns the load balancer's IP, not the client's.
2. **CORS origin restriction** — In development, allow everything (`*`). In production, only allow your frontend's domain(s) via the `ALLOWED_ORIGINS` env var.
3. **`express.json({ limit: '10kb' })`** — Prevents someone from sending a 100MB JSON body to crash your server.
4. **Error handler is registered LAST** — Express error handlers must come after all routes. If registered before, they won't catch route errors.
5. **Health check at `/health`** — Cloud Run pings this to verify your service is running.

---

## Step 14 — Dockerfile & Cloud Run Deployment

**What:** Package your app into a Docker container and deploy it to Google Cloud Run.

**Why Docker?** Cloud Run runs containers. Docker packages your app + its dependencies into a portable image that runs identically on any machine.

### `Dockerfile`
```dockerfile
# Use a small, secure base image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files first (Docker layer caching — deps only reinstall if package.json changes)
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY src/ ./src/

# Cloud Run sets PORT env var automatically
EXPOSE 8080

# Run as non-root user for security
USER node

CMD ["node", "src/server.js"]
```

### `.dockerignore`
```
node_modules
.env
firebase-adminsdk.json
.git
*.md
```

### `.gitignore`
```
node_modules/
.env
firebase-adminsdk.json
```

### Deploy to Cloud Run:
```bash
# Build and deploy in one command
gcloud run deploy church-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,ALLOWED_ORIGINS=https://your-frontend.com"
```

> **`--allow-unauthenticated`** means the Cloud Run URL is publicly accessible. This is fine because your *Express middleware* handles authentication (Firebase tokens). Cloud Run's own IAM auth and your app's Firebase auth are two different layers.

---

## Validation Checklist

Test each of these before considering Phase 1 complete:

### Local Testing
- [ ] `npm run dev` starts the server without errors
- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] `POST /api/events` without auth token returns `401`
- [ ] `POST /api/events` with invalid token returns `401`
- [ ] `POST /api/events` with valid token + valid body returns `201`
- [ ] `POST /api/events` with valid token + invalid body returns `400` with field errors
- [ ] `GET /api/events` returns the events you created
- [ ] `GET /api/events/:id` returns a single event
- [ ] `PATCH /api/events/:id` as the creator updates the event
- [ ] `PATCH /api/events/:id` as a different non-admin user returns `403`
- [ ] `DELETE /api/events/:id` as a non-admin returns `403`
- [ ] `DELETE /api/events/:id` as an admin succeeds with `204`

### Deployment Testing
- [ ] `gcloud run deploy` succeeds
- [ ] The deployed URL responds to `/health`
- [ ] All the above tests pass against the deployed URL

---

## What's Next (Phase 2)

Phase 1 gives you a solid, secure foundation. Here's what to build next:

- **Members module** — CRUD for church members with profile data
- **Announcements module** — Push notifications via Firebase Cloud Messaging
- **Media/Sermons** — File uploads to Cloud Storage with metadata in Firestore
- **Admin dashboard** — Role-based access with `admin`, `leader`, `member` roles
- **Testing** — Unit tests (Jest) for services, integration tests for routes
- **CI/CD** — GitHub Actions pipeline: lint → test → deploy to Cloud Run

---

## Quick Reference: npm Scripts

Add these to your `package.json`:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

- `npm start` — Run in production (used by Docker/Cloud Run)
- `npm run dev` — Run locally with auto-restart on file changes
