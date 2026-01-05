# Single-stage build to ensure canvas native bindings work correctly
FROM node:24.9.0

WORKDIR /app

# Install canvas build AND runtime dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy full project
COPY . .

# Build Next.js frontend
RUN npm run build

# Note: We keep all dependencies installed because autoremove
# incorrectly removes runtime libraries that canvas needs for colors

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Install pm2 globally
RUN npm install -g pm2

# Copy ecosystem config
COPY ecosystem.config.js ./

# Start both servers
CMD ["pm2-runtime", "ecosystem.config.js"]
