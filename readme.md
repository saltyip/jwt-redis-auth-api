# jwt-redis-auth-api

Secure REST API with JWT refresh token rotation, Redis caching, and rate limiting.

## Features

- JWT access tokens (short-lived, stateless)
- Refresh token rotation with family-based reuse attack detection
- Refresh tokens stored as SHA-256 hashes — never plaintext
- httpOnly cookies for refresh token transport
- Redis caching on profile endpoints with automatic invalidation
- Rate limiting on auth endpoints (brute force protection)
- bcrypt password hashing with input length validation (bcrypt DoS prevention)
- IDOR protection on logout
- Zod input validation on all endpoints

## Tech Stack

- Node.js + Express
- PostgreSQL (pg)
- Redis (ioredis)
- JSON Web Tokens (jsonwebtoken)
- bcrypt
- Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Installation

```bash
git clone https://github.com/saltyip/jwt-redis-auth-api
cd jwt-redis-auth-api
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
DATABASE_URL=
REDIS_URL=
PORT=3000
```

### Database Setup

Run the following SQL to set up the schema:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  family_id UUID NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### Run

```bash
npm run dev
```

## API Reference

### Auth

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive tokens | No |
| POST | `/api/auth/refresh` | Rotate refresh token | No |
| POST | `/api/auth/logout` | Invalidate refresh token | Yes |

### User

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/api/user/profile` | Get current user profile | Yes |
| PATCH | `/api/user/updateprofile` | Update email or password | Yes |

### Request/Response Examples

**Register**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "accessToken": "eyJhbGc..."
}
```

**Protected requests** — include access token in header:
```
Authorization: Bearer <accessToken>
```

**Update Profile**
```json
PATCH /api/user/updateprofile
{
  "current_passwd": "oldpassword",
  "new_email": "newemail@example.com",
  "new_passwd": "newpassword"
}
```

## Security Design

### Token Flow

1. Login issues an access token (15min, in-memory) and refresh token (7 days, httpOnly cookie)
2. Access token is stateless — verified by signature alone, no DB lookup
3. On expiry, client hits `/refresh` — refresh token is single-use, rotated on every call
4. All refresh tokens in a session share a `family_id` — if a reused token is detected, the entire family is invalidated

### Attack Detection

If a stolen refresh token is used after the legitimate user has already consumed it:
- Server detects `is_revoked = true` on an incoming token
- Entire token family is nuked
- Both the attacker and victim are forced to re-login

### Rate Limiting

- Login: 10 attempts per 15 minutes per IP
- Register: 5 attempts per hour per IP

## Project Structure

```
  config/
    db.js
    redis.js
  middleware/
    auth.middleware.js
    validate.js
    schemas.js
    user.middleware
  modules/
    auth/
      auth.routes.js
      auth.controller.js
      auth.service.js
    user/
      user.routes.js
      user.controller.js
      user.service.js
  utils/
    tokenUtils.js
    catchAsync.js
index.js
app.js
```
