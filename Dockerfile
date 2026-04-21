# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY new-frontend/package*.json ./
RUN npm ci
COPY new-frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY new-backend/package*.json ./
RUN npm ci --production
COPY new-backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

# Serve static files from /public in production
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server.js"]
