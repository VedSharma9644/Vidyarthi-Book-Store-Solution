FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --quiet

# Copy source
COPY . .

# Build with API base URL passed at build time
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

# Serve the build with a lightweight image
FROM node:18-alpine AS runner
WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 8080

CMD ["serve", "-s", "build", "-l", "8080"]








