FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

RUN npm install -D typescript @types/node && npm run build

FROM node:18-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --chown=nodejs:nodejs .sequelizerc ./
COPY --chown=nodejs:nodejs src/config ./src/config
COPY --chown=nodejs:nodejs src/migrations ./src/migrations

USER nodejs

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
