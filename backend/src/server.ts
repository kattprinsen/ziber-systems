import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import usersRouter from './routes/users.routes.js';
import syncRouter from './routes/sync.routes.js';
import timeRouter from './routes/time.routes.js';
import performanceRouter from './routes/performance.routes.js';
import syncService from './services/sync.service.js';
import { setServerStartTime } from './controllers/sync.controller.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Record server start time (T063)
const SERVER_START_TIME = new Date().toISOString();
setServerStartTime(SERVER_START_TIME);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom request logger
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/sync', syncRouter);  // T063: Sync status endpoints
app.use('/api', timeRouter);
app.use('/api/performance', performanceRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Startup Sync & Server Launch
// ============================================================================

/**
 * Perform user synchronization from Tidig API on startup.
 * This is a "fast-fail" approach with 5-second timeout.
 * If sync fails, the application continues with existing local data.
 */
async function performStartupSync(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔄 Starting Tidig User Synchronization...');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const result = await syncService.performSync();

    if (result.success) {
      console.log('✅ User synchronization completed successfully');
      console.log(`   - Users processed: ${result.syncLog.usersProcessed}`);
      console.log(`   - Users added: ${result.syncLog.usersAdded}`);
      console.log(`   - Duration: ${result.syncLog.duration}ms`);

      if (result.syncLog.warnings.length > 0) {
        console.warn(`   ⚠️  Warnings: ${result.syncLog.warnings.length}`);
        result.syncLog.warnings.forEach((warning) => {
          console.warn(`      - ${warning.message}`);
        });
      }
    } else {
      console.error('❌ User synchronization FAILED');
      console.error('   The application will continue with existing local user data.');
      
      if (result.syncLog.errors.length > 0) {
        console.error('');
        console.error('   Errors:');
        result.syncLog.errors.forEach((error) => {
          console.error(`   - [${error.code}] ${error.message}`);
        });
      }

      console.error('');
      console.error('   ⚠️  ADMINISTRATOR ACTION REQUIRED:');
      console.error('   1. Check Tidig API credentials in .env file');
      console.error('   2. Verify network connectivity to Tidig API');
      console.error('   3. Check backend logs for detailed error information');
      console.error('   4. User data may be out of sync with Tidig');
    }
  } catch (error) {
    console.error('❌ Unexpected error during startup sync:', error);
    console.error('   The application will continue with existing local user data.');
    console.error('');
    console.error('   ⚠️  ADMINISTRATOR ACTION REQUIRED:');
    console.error('   - Check backend logs for error details');
    console.error('   - Verify Tidig API configuration');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Start the server and perform initial sync
 */
async function startServer(): Promise<void> {
  // Perform startup sync (non-blocking - continues even if sync fails)
  await performStartupSync();

  // Start Express server
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 API documentation available at http://localhost:${PORT}/api`);
    console.log('');
  });
}

// Launch the server
startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});

export default app;
