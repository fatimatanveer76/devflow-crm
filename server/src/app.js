import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import v1Routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration with credentials support for HTTP-only cookies
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// HTTP request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Cookie parser for HTTP-only refresh tokens
app.use(cookieParser(config.cookie.secret));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API v1 root mount
app.use('/api/v1', v1Routes);

// Root baseline route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'DevFlow CRM API',
      version: '1.0.0',
      status: 'active',
      documentation: '/api/v1/health',
    },
  });
});

// 404 Not Found Middleware
app.use(notFound);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
