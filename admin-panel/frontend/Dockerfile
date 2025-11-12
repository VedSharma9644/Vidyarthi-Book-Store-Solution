# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Set production backend URL for build (can be overridden with build arg)
ARG VITE_API_BASE_URL=https://admin-panel-backend-594708558503.us-central1.run.app
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the React app
RUN npm run build

# Production stage - serve static files
FROM node:18-alpine

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Set PORT environment variable
ENV PORT=8080

# Serve the built files
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]

