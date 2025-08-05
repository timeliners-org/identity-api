# Dockerfile
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set workdir
WORKDIR /app

# Copy deps and install
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN pnpm install

# Copy everything else
COPY . .

# Generate Prisma client
RUN pnpm run prisma:generate

# Build TypeScript
RUN pnpm run build:prod

# Start the server
CMD ["pnpm", "start"]
