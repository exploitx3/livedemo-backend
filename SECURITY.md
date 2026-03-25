# Security Policy

## Supported Versions

Only the latest version on the `main` branch is actively maintained and receives security updates.

| Branch | Supported |
|---|---|
| `main` | ✅ Yes |
| older branches | ❌ No |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability, please report it responsibly:

1. **Email** the maintainers directly (see commit history or `package.json` for contact).
2. Include as much detail as possible:
   - A clear description of the vulnerability and its potential impact
   - Steps to reproduce or a proof-of-concept
   - Any suggested mitigations
3. You will receive an acknowledgement within **48 hours** and a resolution timeline within **7 days**.

## Scope

Security concerns particularly relevant to this project:

- Authentication or authorization bypass in any API endpoint
- Injection vulnerabilities (NoSQL injection, command injection, etc.)
- Insecure handling of secrets or tokens
- Exposed credentials in committed files (e.g. `dev.env`, `local.env`)
- Stripe webhook or billing manipulation
- File upload vulnerabilities (path traversal, malicious uploads)
- Dependency vulnerabilities with known CVEs

## Out of scope

- Vulnerabilities in upstream services (MongoDB, Stripe, OpenAI, Mux, AWS) — report those to the respective vendors.
- Issues that only affect local development environments with no network exposure.

## Security best practices for contributors

- Never commit real secrets to `dev.env`, `local.env`, or any tracked file.
- Use `sk_test_` Stripe keys and test API keys in development.
- Keep dependencies up to date: `pnpm update`.
- Review any new endpoint for proper authentication and input validation before submitting a PR.
