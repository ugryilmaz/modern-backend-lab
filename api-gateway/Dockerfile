
FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

COPY api-gateway/package.json ./api-gateway/
COPY backend-for-frontend/package.json ./backend-for-frontend/

COPY services/auth-service/package.json ./services/auth-service/
COPY services/user-service/package.json ./services/user-service/
COPY services/order-service/package.json ./services/order-service/
COPY services/payment-service/package.json ./services/payment-service/
COPY services/notification-service/package.json ./services/notification-service/

COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY tsconfig*.json ./

COPY api-gateway/tsconfig.json ./api-gateway/
COPY api-gateway/src ./api-gateway/src

COPY packages/shared/src ./packages/shared/src

RUN npm run build -w api-gateway


FROM node:24-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./

COPY api-gateway/package.json ./api-gateway/
COPY backend-for-frontend/package.json ./backend-for-frontend/

COPY services/auth-service/package.json ./services/auth-service/
COPY services/user-service/package.json ./services/user-service/
COPY services/order-service/package.json ./services/order-service/
COPY services/payment-service/package.json ./services/payment-service/
COPY services/notification-service/package.json ./services/notification-service/

COPY packages/shared/package.json ./packages/shared/

RUN npm ci --omit=dev

FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app ./
COPY --from=builder /app/api-gateway/dist ./api-gateway/dist

EXPOSE 3000

CMD ["node", "api-gateway/dist/app/server.js"]