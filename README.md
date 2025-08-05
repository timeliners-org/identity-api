# Identity Server with Email Verification

A Fastify-based Identity Server with email verification, JWT authentication, and user/group management, developed in TypeScript.

## Features

- ✅ User registration with email verification
- ✅ Email verification via token
- ✅ Login with verification check
- ✅ JWT access and refresh tokens
- ✅ Token refresh and revocation
- ✅ User and group management system
- ✅ Admin user creation and management
- ✅ Resending verification emails
- ✅ Prisma ORM with PostgreSQL
- ✅ Swagger API documentation
- ✅ Automatic token cleanup service

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

### 3. SMTP Configuration

For **Gmail**:

1. Enable 2-factor authentication
2. Create an app password in Google account settings
3. Configure in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

For **Outlook/Hotmail**:

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

For **other SMTP providers**:
Configure the SMTP settings according to your provider.

### 4. Database Setup

```bash
# Start PostgreSQL database (with Docker)
docker-compose up -d

# Apply Prisma schema
pnpm run prisma:migrate
```

### 5. Start Server

```bash
# Development mode
pnpm run dev

# Production build
pnpm run build
pnpm start
```

## API Endpoints

### Authentication

#### Registration

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword"
}
```

**Response**: Sends a verification email to the specified address.

#### Email Verification

```http
GET /auth/verify-email?token={verification-token}
```

**Response**: Activates the user account.

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "id": "user@example.com",
  "password": "securepassword"
}
```

**Response**: Returns JWT tokens for authenticated users.

#### Token Refresh

```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Token Revocation (Logout)

```http
POST /auth/revoke-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Revoke All Tokens (Logout from all devices)

```http
POST /auth/revoke-all-tokens
Authorization: Bearer <access-token>
```

#### Get Profile

```http
GET /auth/profile
Authorization: Bearer <access-token>
```

#### Resend Verification Email

```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### User Management (Admin only)

#### Create User

```http
POST /user/create
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword"
}
```

#### Get User by ID

```http
GET /user/{user-id}
Authorization: Bearer <access-token>
```

#### Get User ID

```http
POST /user/get-user-id
Content-Type: application/json

{
  "identifier": "user@example.com"
}
```

#### Get Own Groups

```http
GET /user/group
Authorization: Bearer <access-token>
```

#### Get User Groups

```http
GET /user/{user-id}/groups
Authorization: Bearer <access-token>
```

### Group Management

#### List Groups

```http
GET /group/list
```

#### Get Group Members

```http
GET /group/{group-name}/member
Authorization: Bearer <access-token>
```

## API Documentation

Complete API documentation is available at `/docs` when the server is running:

```
http://localhost:3000/docs
```

## JWT Authentication

This project uses JWT tokens for authentication:

- **Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Token Rotation**: New refresh tokens on every renewal
- **Automatic Cleanup**: Expired tokens are automatically removed

For detailed JWT documentation, see [JWT_DOCUMENTATION.md](JWT_DOCUMENTATION.md).

## Email Templates

Email templates are defined in `src/services/emailService.ts` and include:

- HTML and text versions
- Responsive design
- English localization
- Security notices

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Email uniqueness
- ✅ Username uniqueness
- ✅ Token expiration (24 hours for email verification)
- ✅ One-time token usage
- ✅ Email verification before login
- ✅ JWT access and refresh tokens
- ✅ Token rotation and revocation
- ✅ Admin-only routes protection

## User and Group System

- **Admin Group**: Automatically created with full permissions
- **User Management**: Create, retrieve, and manage users
- **Group Management**: List groups and manage memberships
- **Permission System**: Role-based access control

## Development

### Modify Database Schema

```bash
# After schema changes in prisma/schema.prisma
pnpm run prisma:migrate
```

### Prisma Studio

```bash
pnpm run prisma:studio
```

## Deployment

### With Docker

```bash
docker build -t identity-server .
docker run -p 3000:3000 identity-server
```

### With Docker Compose

```bash
docker-compose up --build
```

## Environment Variables

| Variable             | Description                 | Example                                          |
| -------------------- | --------------------------- | ------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection       | `postgresql://user:pass@localhost:5432/identity` |
| `SMTP_HOST`          | SMTP server                 | `smtp.gmail.com`                                 |
| `SMTP_PORT`          | SMTP port                   | `587`                                            |
| `SMTP_SECURE`        | Use TLS                     | `false`                                          |
| `SMTP_USER`          | SMTP username               | `email@example.com`                              |
| `SMTP_PASS`          | SMTP password               | `app-password`                                   |
| `SMTP_FROM`          | Sender email                | `noreply@identity-server.com`                    |
| `BASE_URL`           | Base URL of the application | `http://localhost:3000`                          |
| `JWT_ACCESS_SECRET`  | JWT access token secret     | `random-access-secret-key`                       |
| `JWT_REFRESH_SECRET` | JWT refresh token secret    | `random-refresh-secret-key`                      |
| `JWT_ACCESS_EXPIRY`  | Access token expiry         | `15m`                                            |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry        | `7d`                                             |

## Troubleshooting

### Email Not Sent

1. Check SMTP settings in `.env`
2. For Gmail: Use app password, not regular password
3. Check firewall settings for port 587
4. Check server logs for errors

### Invalid Token

- Tokens are valid for 24 hours (email verification)
- Tokens can only be used once
- Request new verification if problems occur

### Database Issues

```bash
# Reset database (Warning: deletes all data!)
pnpm run prisma:reset

# Retry migration
pnpm run prisma:migrate
```

## Admin User

An admin user is automatically created on first startup. Check the console logs for the generated credentials, or set them via environment variables:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```
