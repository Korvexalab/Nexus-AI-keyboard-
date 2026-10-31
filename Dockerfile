# Multi-stage production build for Nexora AI Backend (Node.js LTS)

# Stage 1: Build the frontend web simulator
FROM node:20-slim AS builder
WORKDIR /app

# Copy package definition
COPY package*.json ./
RUN npm install

# Copy frontend source and configuration
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Build static assets into /app/dist
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package definitions and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server source and configuration
COPY server.ts tsconfig.json ./

# Cloud Run / container default port
EXPOSE 8080

# Start Express server
CMD ["npm", "start"]
