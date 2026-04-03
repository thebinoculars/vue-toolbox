# ToolBox

A collection of developer utilities built with Vue 3, TypeScript, and Naive UI.

## Tech Stack

**Frontend:** Vue 3, TypeScript, Vite, Naive UI, Tailwind CSS

**Backend:** Netlify Functions (TypeScript), Mongoose, JWT

## Getting Started

```bash
npm install
netlify dev
```

## Environment Variables

```env
MONGODB_URI=
JWT_SECRET=
```

## Project Structure

```
src/
├── components/   # Layout, Sidebar
├── composables/  # useAuth, useDarkMode
├── data/         # Tool registry
├── pages/        # Route pages & tools
├── router/
└── services/     # API client

netlify/functions/
├── _lib/         # db, jwt helpers
├── login.ts
├── register.ts
├── me.ts
└── proxy.ts
```
