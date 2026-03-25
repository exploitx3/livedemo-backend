# Contributing

Thank you for your interest in contributing to livedemo-backend!

## Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm`)
- MongoDB running locally on port `27017`

## Getting started

1. **Fork** this repository and clone your fork.
2. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feat/your-change
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Copy the dev environment file and fill in your secrets:
   ```bash
   cp dev.env local.env
   ```
5. Start the server and verify it runs:
   ```bash
   npm start
   ```
6. Make your changes, then **open a Pull Request** against `main`.

## Branch naming

| Prefix | Use for |
|---|---|
| `feat/` | New features or improvements |
| `fix/` | Bug fixes |
| `docs/` | Documentation-only changes |
| `refactor/` | Code restructuring without behavior change |
| `chore/` | Maintenance (dependency bumps, config tweaks) |

## Commit style

Use short, imperative-mood commit messages:

```
fix: handle missing story id in getStoryById handler
feat: add rate limiting to demo creation endpoint
docs: document STORY_API env variable
refactor: extract shared pagination helper
```

## Code conventions

- ESM (`import`/`export`) throughout - no `require()`
- Handler files are named after the HTTP operation they serve (e.g. `getStories.js`, `createStory.js`)
- One handler per file in `src/handlers/`
- Shared logic goes in `src/helpers/`
- Mongoose models live in `src/models/`

## Adding a new endpoint

1. Create a handler file in `src/handlers/` (e.g. `src/handlers/getMyResource.js`)
2. Register the route in `src/setup.js`
3. Add or update a Mongoose model in `src/models/` if needed
4. Document any new environment variables in `README.md`

## Pull request checklist

Before submitting, please ensure:

- [ ] Your branch is up to date with `main`
- [ ] `npm start` launches the server without errors
- [ ] New or changed endpoints are tested manually
- [ ] No secrets or credentials are committed
- [ ] Environment variable changes are reflected in `README.md` and `dev.env`

## Reporting issues

Open a [GitHub Issue](../../issues) using the appropriate template. Please include:

- Node.js version (`node --version`)
- pnpm version (`pnpm --version`)
- Full error output or stack trace
- Steps to reproduce

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
