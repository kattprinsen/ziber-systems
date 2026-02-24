# Quickstart: Tidig API User Synchronization

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Date**: February 23, 2026

## Overview

This guide helps developers set up and implement the Tidig API user synchronization feature. Follow these steps to get started.

---

## Prerequisites

### Required Tools
- Node.js 20+ and npm/pnpm/yarn
- Git
- Code editor (VS Code recommended)
- Access to Tidig API credentials

### Knowledge Requirements
- TypeScript basics
- Express.js backend development
- React frontend development
- REST API concepts
- Async/await patterns

---

## 1. Environment Setup

### Backend Configuration

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install new dependencies**:
   ```bash
   npm install axios dotenv fs-extra zod
   npm install --save-dev @types/fs-extra vitest @vitest/ui
   ```

3. **Create `.env` file** (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```
   
   Or create `.env` with:
   ```bash
   # Server Configuration
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   
   # Tidig API Configuration
   TIDIG_API_URL=https://api.tidig.se
   TIDIG_API_KEY=your-api-key-here
   TIDIG_API_TIMEOUT=5000
   ```

4. **Update `.env.example`** with template:
   ```bash
   # Add to .env.example (without real API key)
   TIDIG_API_URL=https://api.tidig.se
   TIDIG_API_KEY=your-api-key-here
   TIDIG_API_TIMEOUT=5000
   ```

5. **Ensure `.env` is in `.gitignore`**:
   ```bash
   # Verify this line exists in backend/.gitignore
   .env
   ```

### Frontend Configuration

1. **Navigate to frontend directory**:
   ```bash
   cd ..  # Back to root
   ```

2. **Install new dependencies** (if using toast notifications):
   ```bash
   npm install react-hot-toast
   # OR
   npm install react-toastify
   ```

---

## 2. Backend Implementation

### File Structure to Create

```
backend/
├── src/
│   ├── models/
│   │   └── tidig.model.ts           [NEW]
│   ├── services/
│   │   ├── tidig.service.ts         [NEW]
│   │   ├── sync.service.ts          [NEW]
│   │   └── user-merge.service.ts    [NEW]
│   ├── controllers/
│   │   └── sync.controller.ts       [NEW]
│   ├── routes/
│   │   └── sync.routes.ts           [NEW]
│   ├── types/
│   │   └── sync.types.ts            [NEW]
│   └── utils/
│       └── tidig-client.ts          [NEW]
├── tests/
│   ├── unit/
│   │   └── user-merge.service.test.ts [NEW]
│   └── integration/
│       └── tidig-sync.test.ts        [NEW]
└── vitest.config.ts                   [NEW]
```

### Development Order

**Phase 1: Core Infrastructure**
1. ✅ Set up environment variables
2. Create Tidig API client (`utils/tidig-client.ts`)
3. Define TypeScript types (`types/sync.types.ts`, `models/tidig.model.ts`)
4. Implement Tidig service (`services/tidig.service.ts`)

**Phase 2: Sync Logic**
5. Implement user merge service (`services/user-merge.service.ts`)
6. Implement sync orchestration (`services/sync.service.ts`)
7. Write unit tests for merge logic
8. Write integration tests for sync

**Phase 3: API Endpoints**
9. Create sync controller (`controllers/sync.controller.ts`)
10. Create sync routes (`routes/sync.routes.ts`)
11. Register routes in `server.ts`

**Phase 4: Startup Integration**
12. Add sync call to `server.ts` startup
13. Add error handling for startup sync
14. Test full startup flow

---

## 3. Quick Start Implementation

### Step 1: Create Tidig Client

```typescript
// backend/src/utils/tidig-client.ts
import axios, { AxiosInstance } from 'axios';
import 'dotenv/config';

const TIDIG_API_URL = process.env.TIDIG_API_URL;
const TIDIG_API_KEY = process.env.TIDIG_API_KEY;
const TIDIG_API_TIMEOUT = parseInt(process.env.TIDIG_API_TIMEOUT || '5000');

if (!TIDIG_API_URL || !TIDIG_API_KEY) {
  throw new Error('Tidig API configuration missing. Check TIDIG_API_URL and TIDIG_API_KEY environment variables.');
}

export const tidigClient: AxiosInstance = axios.create({
  baseURL: TIDIG_API_URL,
  timeout: TIDIG_API_TIMEOUT,
  headers: {
    'x-apikey': TIDIG_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Logging interceptor
tidigClient.interceptors.request.use(
  config => {
    console.log(`[Tidig API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

tidigClient.interceptors.response.use(
  response => {
    console.log(`[Tidig API] Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('[Tidig API] Request timeout');
    } else if (error.response) {
      console.error(`[Tidig API] Error: ${error.response.status} from ${error.config.url}`);
    } else {
      console.error('[Tidig API] Network error:', error.message);
    }
    return Promise.reject(error);
  }
);
```

### Step 2: Define Types

```typescript
// backend/src/types/sync.types.ts
export type SyncResultStatus = 'success' | 'partial_success' | 'failed';

export type ErrorCode =
  | 'SYNC_TIMEOUT'
  | 'SYNC_AUTH_FAILED'
  | 'SYNC_API_ERROR'
  | 'SYNC_DATA_INVALID'
  | 'SYNC_WRITE_FAILED'
  | 'SYNC_NETWORK_ERROR';

export type WarningCode =
  | 'MISSING_EMPLOYEE_ID'
  | 'DUPLICATE_EMPLOYEE_ID'
  | 'INCOMPLETE_USER_DATA'
  | 'INVALID_EMAIL_FORMAT'
  | 'USERS_INACTIVATED';

export interface SyncError {
  code: ErrorCode;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

export interface SyncWarning {
  code: WarningCode;
  message: string;
  context?: Record<string, any>;
}

export interface SyncLog {
  syncId: string;
  timestamp: string;
  duration: number;
  status: SyncResultStatus;
  usersProcessed: number;
  usersAdded: number;
  usersUpdated: number;
  usersInactivated: number;
  usersReactivated: number;
  errors: SyncError[];
  warnings: SyncWarning[];
}

export interface SyncStatus {
  lastSync: string;
  source: 'tidig' | 'local';
  wasInactive?: boolean;
}
```

### Step 3: Add Sync to Startup

```typescript
// backend/src/server.ts - Add after imports
import { syncService } from './services/sync.service.js';

// ... existing setup ...

// Add before app.listen()
async function initializeServer() {
  // Perform startup sync
  console.log('[Startup] Initiating user sync from Tidig...');
  try {
    const syncResult = await syncService.performSync();
    if (syncResult.status === 'success') {
      console.log(`[Startup] Sync completed successfully (${syncResult.duration}ms)`);
      console.log(`[Startup] Users: ${syncResult.usersAdded} added, ${syncResult.usersUpdated} updated`);
    } else if (syncResult.status === 'partial_success') {
      console.warn('[Startup] Sync completed with warnings');
      syncResult.warnings.forEach(w => console.warn(`  - ${w.message}`));
    } else {
      console.error('[Startup] Sync failed - using local user data');
      syncResult.errors.forEach(e => console.error(`  - ${e.message}`));
    }
  } catch (error) {
    console.error('[Startup] Sync error - using local user data:', error);
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
}

// Replace app.listen() with:
initializeServer().catch(error => {
  console.error('[Startup] Failed to initialize server:', error);
  process.exit(1);
});
```

---

## 4. Testing Setup

### Create Vitest Config

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ]
    },
  },
});
```

### Add Test Scripts

```json
// backend/package.json - Add to scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Run Tests

```bash
cd backend
npm test                 # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open UI for test exploration
```

---

## 5. Frontend Implementation

### Add Sync Status Component

```tsx
// frontend/src/components/sync/SyncStatus.tsx
import { useEffect, useState } from 'react';
import { syncService } from '../../services/syncService';
import type { SyncLog } from '../../types/sync';

export function SyncStatus() {
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await syncService.getStatus();
        if (response.success && response.data?.lastSync) {
          setLastSync(response.data.lastSync);
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, []);

  // Show notification if sync failed
  if (lastSync?.status === 'failed') {
    return (
      <div className="alert alert-error">
        ⚠️ User sync failed - using last known data
      </div>
    );
  }

  return null; // Or show subtle success indicator
}
```

### Add to Layout

```tsx
// frontend/src/components/layout/Layout.tsx
import { SyncStatus } from '../sync/SyncStatus';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Navbar />
      <SyncStatus />  {/* Add this */}
      <main>{children}</main>
    </div>
  );
}
```

---

## 6. Development Workflow

### Daily Development

1. **Start backend** (with watch mode):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Run tests** (in watch mode):
   ```bash
   cd backend
   npm run test:watch
   ```

### Testing Sync

**Without Tidig API access** (during development):
- Use mock responses in tests
- Create mock Tidig service that returns test data
- Test with users.json manipulation

**With Tidig API access**:
1. Add real API key to `.env`
2. Restart backend server
3. Watch console logs for sync results
4. Verify users.json is updated
5. Check frontend for sync notifications

---

## 7. Debugging

### Enable Debug Logging

```typescript
// backend/src/utils/tidig-client.ts
tidigClient.interceptors.request.use(config => {
  if (process.env.DEBUG_TIDIG === 'true') {
    console.log('[Tidig Debug] Request:', JSON.stringify(config, null, 2));
  }
  return config;
});

tidigClient.interceptors.response.use(response => {
  if (process.env.DEBUG_TIDIG === 'true') {
    console.log('[Tidig Debug] Response:', JSON.stringify(response.data, null, 2));
  }
  return response;
});
```

Add to `.env`:
```bash
DEBUG_TIDIG=true
```

### Common Issues

**Issue**: `TIDIG_API_KEY` not found
- **Solution**: Verify `.env` file exists and contains the key
- **Check**: `console.log(process.env.TIDIG_API_KEY)` to verify loading

**Issue**: Sync timeout after 5 seconds
- **Solution**: Check network connection to Tidig API
- **Check**: Try curl: `curl -H "x-apikey: YOUR_KEY" https://api.tidig.se/Api/Employee/SubTree`

**Issue**: Users not updating
- **Solution**: Check console logs for errors during sync
- **Check**: Verify users.json file permissions (write access)

**Issue**: Frontend not showing sync status
- **Solution**: Check browser console for API errors
- **Check**: Verify `/api/sync/status` endpoint is accessible

---

## 8. Implementation Checklist

### Backend
- [ ] Install dependencies (axios, dotenv, fs-extra, zod, vitest)
- [ ] Create `.env` with Tidig API credentials
- [ ] Implement Tidig client with timeout and auth
- [ ] Define TypeScript types for sync
- [ ] Implement Tidig service (API calls)
- [ ] Implement user merge logic
- [ ] Implement sync orchestration service
- [ ] Write unit tests for merge logic
- [ ] Write integration tests (with mocks)
- [ ] Create sync controller and routes
- [ ] Add startup sync to server.ts
- [ ] Test full flow with real/mock API

### Frontend
- [ ] Install toast notification library
- [ ] Create sync service (API client)
- [ ] Define TypeScript types
- [ ] Create SyncStatus component
- [ ] Add SyncStatus to Layout
- [ ] Test notifications display correctly
- [ ] Style notifications appropriately

### Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Add troubleshooting guide
- [ ] Create ADR (Architecture Decision Record) if needed

---

## 9. Resources

### Documentation
- **Feature Spec**: [spec.md](spec.md)
- **Implementation Plan**: [plan.md](plan.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: 
  - [Tidig External API](contracts/tidig-api.md)
  - [Internal Sync Service](contracts/sync-service.md)

### External Resources
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Zod Documentation](https://zod.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### Code Examples
- See `specs/001-dark-ui-layout` for similar feature structure
- See `specs/002-money-slider-tool` for component patterns

---

## 10. Next Steps

After completing quickstart setup:

1. **Review contracts**: Read [contracts/tidig-api.md](contracts/tidig-api.md) and [contracts/sync-service.md](contracts/sync-service.md)

2. **Review data model**: Read [data-model.md](data-model.md) for entity relationships

3. **Start implementation**: Follow the development order in Section 2

4. **Write tests first**: TDD approach - write tests before implementation

5. **Generate tasks**: Run `/speckit.tasks` to break down work into actionable tasks

---

## Support

**Questions?**
- Review feature specification: [spec.md](spec.md)
- Check research decisions: [research.md](research.md)
- Review API contracts: [contracts/](contracts/)

**Issues?**
- Check logs: `backend/logs/` (if logging configured)
- Enable debug mode: Set `DEBUG_TIDIG=true` in `.env`
- Run tests: `npm run test:coverage` to identify failing areas

---

**Last Updated**: February 23, 2026  
**Status**: Ready for development
