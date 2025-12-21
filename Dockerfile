# Multi-stage build for Vite React app
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies
# Try npm first, fallback to bun if available
RUN if [ -f bun.lockb ]; then \
      npm install -g bun && bun install --frozen-lockfile; \
    else \
      npm ci --legacy-peer-deps; \
    fi

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
# nginx:alpine automatically processes .template files in /etc/nginx/templates/
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Expose port (default 80, Railway will override with PORT env var)
EXPOSE 80

# Health check (nginx:alpine entrypoint handles template substitution)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-80}/health || exit 1

# nginx:alpine entrypoint automatically processes templates and starts nginx

