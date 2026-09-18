# Security audit baseline

## Applied in this refactor
- Private API secrets remain server-side (`process.env.GROQ_API_KEY`); no GROQ secret is added to the browser bundle.
- Vercel sends `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options`, and a restrictive `Permissions-Policy`.
- Legacy routes are rewrites to the canonical Admin/Pelanggan paths.
- Firebase web configuration is centralized but remains public application configuration; it is **not** treated as a secret.

## Important follow-up before exposing AI endpoints broadly
`/api/admin-ai` is still an unauthenticated HTTP endpoint in the supplied baseline. The refactor does not pretend to solve server-side authorization because there is no safe admin identity/claim configuration in the ZIP itself. Before production hardening, add server-side Firebase ID-token verification plus an admin authorization check, and add a durable rate limiter.

## Firebase boundary
Frontend Firebase config is allowed to be shipped to the browser. Service-account private keys, admin SDK credentials, and other server secrets must stay in Vercel environment variables/server runtime only.
