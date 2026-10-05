FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build app
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Create volume mount point for persistent database storage
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server.js"]
