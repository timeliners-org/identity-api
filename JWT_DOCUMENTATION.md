# JWT Token System - Documentation

The Identity Server system has been extended with a comprehensive JWT (JSON Web Token) system that supports access tokens and refresh tokens.

## Features

- **Access Tokens**: Short-lived tokens (15 minutes by default) for API access
- **Refresh Tokens**: Long-lived tokens (7 days by default) for token renewal
- **Token Rotation**: New refresh tokens on every renewal
- **Automatic Cleanup**: Expired tokens are automatically removed
- **Security**: Separate secrets for access and refresh tokens

## API Endpoints

### Login (extended)

`POST /auth/login`

**Request:**

```json
{
  "id": "user-id-or-email-or-username",
  "password": "password"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "isVerified": true
  },
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 900000
  }
}
```

### Token erneuern

`POST /auth/refresh-token`

**Request:**

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**

```json
{
  "message": "Token successfully renewed",
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refreshToken": "g7h8i9j0k1l2...",
    "expiresIn": 900000
  }
}
```

### Token widerrufen (Logout)

`POST /auth/revoke-token`

**Request:**

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**

```json
{
  "message": "Token successfully revoked"
}
```

### Alle Tokens widerrufen (Logout von allen Geräten)

`POST /auth/revoke-all-tokens`

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "All tokens successfully revoked"
}
```

### Protected Route (example)

`GET /auth/profile`

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "isVerified": true
  }
}
```

## Environment Variables

Add these variables to your `.env` file:

```bash
# JWT Configuration
JWT_ACCESS_SECRET=your-very-secure-access-secret-key
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## Authentication in Client Applications

### 1. Perform login

```javascript
const loginResponse = await fetch("/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "user@example.com",
    password: "password123",
  }),
});

const { tokens } = await loginResponse.json();
localStorage.setItem("accessToken", tokens.accessToken);
localStorage.setItem("refreshToken", tokens.refreshToken);
```

### 2. API requests with access token

```javascript
const apiCall = async (url, options = {}) => {
  const accessToken = localStorage.getItem("accessToken");

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
```

### 3. Automatic token renewal

```javascript
const apiCallWithRefresh = async (url, options = {}) => {
  let response = await apiCall(url, options);

  if (response.status === 401) {
    // Token expired, renew
    const refreshToken = localStorage.getItem("refreshToken");

    const refreshResponse = await fetch("/auth/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshResponse.ok) {
      const { tokens } = await refreshResponse.json();
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      // Repeat original request
      response = await apiCall(url, options);
    } else {
      // Refresh failed, user must log in again
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
  }

  return response;
};
```

### 4. Logout

```javascript
const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (refreshToken) {
    await fetch("/auth/revoke-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};
```

## Security Notes

1. **Secrets**: Use strong, random secrets for production
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**:
   - Access tokens: In memory or sessionStorage
   - Refresh tokens: In httpOnly cookies (more secure) or localStorage
4. **Token Rotation**: Refresh tokens are rotated on every renewal
5. **Automatic Cleanup**: Expired tokens are automatically removed from the DB

## Database Schema

The system creates a new `RefreshToken` table:

```sql
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
```

## Migration

To use the new features, run the migration:

```bash
pnpm run prisma:migrate
```

The migration `20250729192942_add_refresh_token_table` will be applied automatically.
