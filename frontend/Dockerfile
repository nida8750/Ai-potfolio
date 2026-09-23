FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL=http://localhost:43127
ARG NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=43127 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 10001 app && adduser -u 10001 -G app -s /sbin/nologin -D app
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE 43127
CMD ["npm", "run", "start"]
