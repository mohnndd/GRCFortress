# Frontend

React + Vite + TypeScript SPA in `frontend/`.

## Key pieces

- **`src/api/client.ts`** — shared axios instance. Reads
  `VITE_API_BASE_URL` (see `.env.example`), attaches `Authorization: Bearer
  <token>` from `localStorage` via a request interceptor.
- **`src/api/authApi.ts`** — typed wrappers for `/api/v1/auth/*`. Follow this
  pattern for new domains: `src/api/<domain>Api.ts` with request/response
  TypeScript interfaces matching the backend DTOs.
- **`src/auth/AuthContext.tsx`** — `AuthProvider`/`useAuth()`. Holds
  `user`, `isAuthenticated`, and token persistence/refresh logic.
- **`src/auth/ProtectedRoute.tsx`** — wraps routes that require
  authentication, redirecting to `/login` otherwise. For role-gated pages
  (e.g. admin integration settings), check `user.roles` from `useAuth()`
  inside the route/page and redirect or hide UI accordingly.
- **`src/pages/<Feature>/`** — one folder per page, with a `.tsx` and
  `.css` file (see `Login/`, `Dashboard/` for the pattern).
- **`src/App.tsx`** — route table. Add new routes here, wrapped in
  `ProtectedRoute` unless intentionally public.

## Adding a new feature page

1. Add `src/api/<domain>Api.ts` mirroring the backend controller's DTOs.
2. Add `src/pages/<Feature>/<Feature>Page.tsx` + matching `.css`.
3. Register the route in `App.tsx` (inside `ProtectedRoute` if it needs
   auth, with a role check if it's admin-only).
4. Add navigation (link/menu entry) from the dashboard or a shared nav
   component.

## Styling

`src/index.css` defines CSS custom properties (theme colors, spacing) used
across pages — reuse these variables rather than introducing new hardcoded
values, to keep a consistent look as more GRC modules are added.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` (defaults to
`http://localhost:8080`).
