# Stage 1: Build stage for Python dependencies
FROM python:3.11-slim AS python-builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make && \
    rm -rf /var/lib/apt/lists/*

# Create virtual environment and install Python dependencies
COPY requirements.txt .
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
# Use pip cache and parallel downloads for faster installation
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install -r requirements.txt && \
    find /opt/venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find /opt/venv -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /opt/venv -name "*.pyc" -delete && \
    find /opt/venv -name "*.pyo" -delete && \
    find /opt/venv -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true

# Stage 2: Build stage for Node.js dependencies
FROM node:24-slim AS node-builder

WORKDIR /build

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Stage 3: Final runtime stage
FROM node:24-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    curl \
    ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install PM2 globally
RUN npm install pm2 -g && npm cache clean --force

# Copy Python virtual environment from builder
COPY --from=python-builder /opt/venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Copy Node.js dependencies from builder
COPY --from=node-builder /build/node_modules ./node_modules

# Copy application files
COPY --chown=node:node server.js main.py start-services.sh ./
COPY --chown=node:node config ./config/
COPY --chown=node:node models ./models/
COPY --chown=node:node routes ./routes/
COPY --chown=node:node services ./services/
COPY --chown=node:node views ./views/
COPY --chown=node:node public ./public/
COPY --chown=node:node schemas.js swagger.js ecosystem.config.js package.json ./

# Make startup script executable
RUN chmod +x start-services.sh

# Configure persistent data volume
VOLUME ["/app/data"]

# Switch to non-root user
USER node

# Configure application port
EXPOSE ${PAPERLESS_AI_PORT:-3000}

# Add health check with dynamic port
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PAPERLESS_AI_PORT:-3000}/health || exit 1

# Set production environment
ENV NODE_ENV=production

# Start both Node.js and Python services using our script
CMD ["./start-services.sh"]
