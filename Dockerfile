
FROM node:24.9.0

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000
EXPOSE 4000

RUN npm install -g pm2

COPY ecosystem.config.js ./

CMD ["pm2-runtime", "ecosystem.config.js"]
