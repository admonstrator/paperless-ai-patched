# Use a slim Node.js (LTS) image as base
FROM node:22-slim

WORKDIR /app

# Install system dependencies and clean up in single layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install PM2 process manager globally
RUN npm install pm2 -g

# Install Python dependencies for RAG service in a virtual environment
COPY requirements.txt /app/
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    find /app/venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/venv -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/venv -name "*.pyc" -delete && \
    find /app/venv -name "*.pyo" -delete

# Copy package files for dependency installation
COPY package*.json ./

# Install node dependencies with clean install
RUN npm ci --only=production && npm cache clean --force

# Copy only necessary application files
COPY server.js main.py start-services.sh ./
COPY config ./config/
COPY models ./models/
COPY routes ./routes/
COPY services ./services/
COPY views ./views/
COPY public ./public/
COPY schemas.js swagger.js ecosystem.config.js ./

# Make startup script executable
RUN chmod +x start-services.sh

# Configure persistent data volume
VOLUME ["/app/data"]

# Configure application port - aber der tatsächliche Port wird durch PAPERLESS_AI_PORT bestimmt
EXPOSE ${PAPERLESS_AI_PORT:-3000}

# Add health check with dynamic port
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PAPERLESS_AI_PORT:-3000}/health || exit 1

# Set production environment
ENV NODE_ENV=production

# Start both Node.js and Python services using our script
CMD ["./start-services.sh"]
