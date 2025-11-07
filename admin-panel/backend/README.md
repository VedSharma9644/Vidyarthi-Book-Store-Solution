# Admin Panel Backend

Backend API server for the Admin Panel using Node.js and Express.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration.

3. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not in git)
├── .env.example      # Example environment file
├── routes/           # API routes (to be created)
├── controllers/      # Route controllers (to be created)
├── models/          # Data models (to be created)
├── middleware/      # Custom middleware (to be created)
└── utils/          # Utility functions (to be created)
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Base
- `GET /` - API information

## Development

The server runs on `http://localhost:5000` by default (configurable via PORT in .env).

## Next Steps

1. Set up database connection
2. Create API routes for:
   - Orders management
   - Grades management
   - Schools management
   - Categories management
   - Books management
3. Add authentication middleware
4. Add validation middleware
5. Add error handling

