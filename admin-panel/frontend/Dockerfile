# Multi-stage build for React app
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY .env ./

# Build the app
RUN npm run build

# Production stage - use a simple static server
FROM node:18-alpine

# Install serve globally
RUN npm install -g serve

# Copy built app
COPY --from=build /app/build /app/build

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Start the static server
CMD ["serve", "-s", "build", "-l", "3000"]
