# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be passed as build args here rather than only via the container's
# runtime env_file (which would be too late for anything already baked into
# the compiled output).
#
# NEXT_PUBLIC_BACKEND_URL defaults to empty on purpose: lib/api.ts falls back
# to `${window.location.protocol}//${window.location.hostname}:8000` in the
# browser when this is unset, which resolves to the exact same
# http://localhost:8000 for today's local dev setup but also keeps working
# unmodified behind a future domain/Nginx — no rebuild needed. Pass a real
# value here only when the backend won't be reachable at "same host, port
# 8000" (e.g. a different port, or once Nginx fronts it at a sub-path).
ARG NEXT_PUBLIC_BACKEND_URL=
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
