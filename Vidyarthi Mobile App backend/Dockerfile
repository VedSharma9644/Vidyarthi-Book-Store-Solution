# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build if needed)
RUN npm ci

# Copy application files
COPY . .

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Set PORT environment variable (Cloud Run requirement)
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/server.js"]

