const app = require('./app');
const config = require('./config/environment');
const database = require('./config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await database.connect();

    // Start Express server
    const server = app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 GitHub Integration Backend Server                        ║
║                                                                ║
║   Environment: ${config.env.padEnd(47)}║
║   Port: ${String(config.port).padEnd(55)}║
║   MongoDB: Connected                                          ║
║   API URL: http://localhost:${config.port}/api                       ║
║   Health Check: http://localhost:${config.port}/health                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        database.disconnect();
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        database.disconnect();
        console.log('💥 Process terminated!');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();