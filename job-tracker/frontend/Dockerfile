# syntax=docker/dockerfile:1

# ── Build ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# `npm ci` needs the lockfile and installs exactly what it pins. Copying only
# the manifests first keeps this layer cached across source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# No VITE_API_URL / VITE_WS_URL are set on purpose: nginx serves the app and
# the API from the same origin, so the client's defaults ('/api' and a ws://
# URL derived from window.location) are already correct. Baking an absolute
# host in here would break the moment the deployment URL changes.
RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx's own image already runs the daemon in the foreground via its
# entrypoint; this is explicit so the CMD isn't a mystery.
CMD ["nginx", "-g", "daemon off;"]
