const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const config = require('./config/environment');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const ResponseHelper = require('./helpers/response.helper');

// Create Express app
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.frontend.url,
      'http://localhost:4200',
      'http://localhost:3000',
    ];

    if (config.env === 'development') {
      // In development, allow all origins
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Session middleware (for OAuth state)
app.use(session({
  secret: config.jwt.secret || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 15, // 15 minutes
  },
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check route
app.get('/health', (req, res) => {
  ResponseHelper.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  }, 'Server is healthy');
});

// API routes (to be added in future PRs)
app.get('/api', (req, res) => {
  ResponseHelper.success(res, {
    message: 'GitHub Integration API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      integrations: '/api/integrations',
      sync: '/api/sync',
      data: '/api/data',
    },
  }, 'API Information');
});

// Auth routes
app.use('/api/auth', require('./routes/auth.routes'));

// Integration routes (placeholder for PR3)
// app.use('/api/integrations', require('./routes/integration.routes'));

// Sync routes (placeholder for PR4)
// app.use('/api/sync', require('./routes/sync.routes'));

// Data routes (placeholder for PR5)
// app.use('/api/data', require('./routes/data.routes'));

// 404 handler
app.use(notFoundHandler);

// Error handler (should be last)
app.use(errorHandler);

module.exports = app;