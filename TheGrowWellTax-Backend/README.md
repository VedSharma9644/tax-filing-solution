# Tax Filing Backend API

A simple Node.js/Express.js backend API for the Tax Filing mobile application.

## Features

- **Security**: Helmet for security headers
- **Logging**: Morgan for request logging
- **CORS**: Cross-origin resource sharing enabled
- **Health Check**: Basic health monitoring

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Endpoints

- `GET /` - API information
- `GET /health` - Health check

## Port

Default port: 3001
