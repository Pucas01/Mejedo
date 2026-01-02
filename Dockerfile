# -------- Stage 1: Build frontend --------
FROM node:24.9.0 AS builder

WORKDIR /app

# Install canvas dependencies for asciify-image color support
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy full project
COPY . .

# Build Next.js frontend (root package.json, frontend in src/app)
RUN npm run build

# -------- Stage 2: Runtime --------
FROM node:24.9.0 AS runtime

WORKDIR /app

# Install canvas dependencies (both build and runtime) then rebuild canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy everything from builder
COPY --from=builder /app ./

# Rebuild canvas native bindings for runtime environment
RUN npm rebuild canvas --build-from-source \
    && apt-get update && apt-get remove -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Install pm2 globally
RUN npm install -g pm2

# Copy ecosystem config
COPY ecosystem.config.js ./

# Start both servers
CMD ["pm2-runtime", "ecosystem.config.js"]
