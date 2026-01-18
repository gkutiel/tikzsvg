# Stage 1: Build TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build server
RUN npm run build:server

# Stage 2: Production with LaTeX
FROM texlive/texlive:latest

WORKDIR /app

# Install Node.js 22
RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install LaTeX packages
RUN tlmgr update --self && \
    tlmgr install polyglossia tikz xcolor geometry fancyhdr

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy fonts
COPY fonts ./fonts

# Create temp directory
RUN mkdir -p /app/temp

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/server/app.js"]
