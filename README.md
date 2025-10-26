# jwt-token

Lightweight example Node.js/Express project demonstrating JWT access + refresh token handling with refresh tokens stored (hashed) in MongoDB.

This repo implements:

- User signup and login (creates access token + refresh token cookie)
- Refresh flow that rotates refresh tokens (old refresh tokens are revoked)
- Logout that revokes refresh token and clears cookie
- Protected user update endpoint that requires a Bearer access token

## File structure

- `server.js` - app entry (loads routers, connects DB)
- `config/dbConnect.js` - MongoDB connection helper
- `router/auth.js` - signup, login, refresh, logout routes
- `router/user.js` - protected user update route
- `middleware/userAuth.js` - verifies access token (Authorization: Bearer <token>)
- `models/` - Mongoose models (`user.js`, `token.js`)
- `utils/validation.js` - input validation helper

## Environment variables

Create a `.env` file in the project root with at least:

- `MONGO_URI` - MongoDB connection string
- `ACCESS_TOKEN_KEY` - secret used to sign access tokens
- `REFRESH_TOKEN_KEY` - secret used to sign refresh tokens
- `ACCESS_TOKEN_EXPIRY` - access token expiry (e.g. `10m`)
- `REFRESH_TOKEN_EXPIRY` - refresh token expiry (e.g. `7d`)

MONGO_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/mydb
ACCESS_TOKEN_KEY=some_long_random_secret_for_access
REFRESH_TOKEN_KEY=some_other_random_secret_for_refresh
ACCESS_TOKEN_EXPIRY=10m
REFRESH_TOKEN_EXPIRY=7d

## Install

Make sure you have Node.js installed (Node 14+ recommended).

```powershell
# install dependencies (PowerShell)
npm install
```

## Run

```powershell
# start server (PowerShell)
node server.js
```

The server will print `DB Connected` and `Server listening on port <port>` when ready. By default the port is `8000` unless you set the environment variable named `port` (case-sensitive) before starting the app.

## API — routes (exact names from `router/*.js`)

All routes are registered at the root path in `server.js`.

1) POST /signup
- Purpose: create a new user
- Body: { "username": string, "password": string }
- Successful response: 201 Created, body: { id, username }
- Example (PowerShell):

```powershell
Invoke-RestMethod -Uri http://localhost:8000/signup -Method POST -Body '{"username":"alice","password":"s3cret"}' -ContentType 'application/json'
```

2) POST /login
- Purpose: authenticate and receive an access token (JSON) and a refresh token cookie
- Body: { "username": string, "password": string }
- Response: { accessToken, user }
- Behavior: server sets a `refreshToken` httpOnly cookie (SameSite=None, secure=true)

Example (curl, *POSIX style*):

```bash
# This example uses curl and will print JSON response. It also receives the cookie.
curl -i -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"s3cret"}'
```

3) POST /refresh
- Purpose: use the `refreshToken` cookie to obtain a new access token. This route rotates refresh tokens (revokes old one and issues new one).
- Body: none (server reads cookie)
- Response: { accessToken }

Note: The client must send the cookie. In browsers this is automatic for the same origin; in other clients you must preserve/send cookies.

4) POST /logout
- Purpose: revoke refresh token in DB and clear the cookie
- Body: none (server reads cookie)
- Response: { message: 'Logout successful' }

5) PATCH /update
- Purpose: protected endpoint to update the logged-in user
- Header: Authorization: Bearer <accessToken>
- Body: fields to update (the middleware attaches the user to `req.user`)
- Example:

```powershell
# Example: update display name (PowerShell)
Invoke-RestMethod -Uri http://localhost:8000/update -Method Patch -Headers @{ Authorization = "Bearer <ACCESS_TOKEN>" } -Body '{"displayName":"Alice"}' -ContentType 'application/json'
```

## How authentication works (short)

- On login: server issues a short-lived access token (signed with `ACCESS_TOKEN_KEY`) and a longer-lived refresh token (signed with `REFRESH_TOKEN_KEY`) which is stored in a DB `Token` collection as a hashed value.
- Access tokens are sent in `Authorization: Bearer <token>` for protected routes.
- When access token expires, client calls `/refresh`. Server verifies the refresh cookie, compares it to the hashed DB value, revokes the old DB record, issues a new access token & refresh token, and sets the new refresh cookie.
- Logout revokes refresh token in DB and clears the cookie.

## Security notes

- Refresh tokens are stored hashed in DB — good practice.
- Cookies are configured `httpOnly` and `secure` (SameSite=None). In local development without HTTPS, you may need to adjust `secure` to `false` or test with a tool that supports cookies over HTTP. Prefer using HTTPS in production.
- Keep your `ACCESS_TOKEN_KEY` and `REFRESH_TOKEN_KEY` safe and long.

## Testing & tools

- Postman is convenient for testing cookie-based flows.
- To test via PowerShell and preserve cookies, use a WebSession object:

```powershell
# PowerShell example to keep cookies between requests
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri http://localhost:8000/login -Method POST -Body '{"username":"alice","password":"s3cret"}' -ContentType 'application/json' -WebSession $session
Invoke-RestMethod -Uri http://localhost:8000/refresh -Method POST -WebSession $session
```

## Next steps / suggestions

- Add automated tests (e.g., Jest + Supertest) for auth flows.
- Add rate limiting / brute-force protection on login/signup.
- Add HTTPS / environment-specific cookie settings for local vs production.
