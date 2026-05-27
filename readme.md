# jwt-redis-auth-api

Secure REST API with JWT refresh token rotation, Redis caching, and rate limiting.

my devlog where i explain the project = https://devlog-app-beta.vercel.app/project/jwt-redis-auth-api


## Features

- JWT access tokens (short-lived, stateless)
- Refresh token rotation with family-based reuse attack detection
- Refresh tokens stored as SHA-256 hashes
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


`.env` file in root directory:

```
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
DATABASE_URL=
REDIS_URL=
PORT=3000
```

### Database PostgreSQL

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

### How To run

```bash
npm run dev
```

## API endpoints

### Auth

- | POST | `/api/auth/register` | Register a new user |
- | POST | `/api/auth/login` | Login and receive tokens |
- | POST | `/api/auth/refresh` | Rotate refresh token |
- | POST | `/api/auth/logout` | Invalidate refresh token | Protected |

### User

- | GET | `/api/user/profile` | Get current user profile | Protected |
- | PATCH | `/api/user/updateprofile` | Update email or password | Protected |


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
