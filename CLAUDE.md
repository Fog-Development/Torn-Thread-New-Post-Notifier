# Torn Thread Notifier - Technical Documentation

## Project Overview

**Torn Thread Notifier** is a cross-browser Manifest v3 extension for **Chrome** and **Firefox** that monitors Torn forum threads and sends browser notifications when new posts are detected. The extension allows users to track specific forum threads, configure monitoring intervals, and manage API usage efficiently.

## Purpose

This extension solves the problem of manually checking Torn forum threads for new posts. Users can:
- Import their subscribed threads or manually add threads by URL
- Receive instant notifications when new posts are detected
- Configure check frequency and API usage settings
- Monitor API rate limits with visual warnings

## Architecture

### Technology Stack

- **Language**: TypeScript (strict mode)
- **Build System**: Vite with browser-specific builds (Chrome + Firefox)
- **Browser Extension**: Manifest v3 (service worker-based)
- **Cross-Browser Compatibility**: webextension-polyfill
- **API**: Torn API v2
- **Styling**: Vanilla CSS with custom modern design
- **Storage**: Browser Storage API (sync + local)

### Cross-Browser Compatibility

The extension supports both Chrome and Firefox through a unified codebase with browser-specific builds.

**webextension-polyfill Integration**:
- All source code uses `import browser from 'webextension-polyfill'`
- Provides Promise-based API for both Chrome and Firefox
- Chrome's `chrome.*` namespace automatically wrapped
- Firefox's native `browser.*` namespace used directly
- Type safety via `@types/webextension-polyfill`

**Dual Manifest Strategy**:
- **manifest-chrome.json**: Chrome-specific configuration
  - Uses `"service_worker"` with `"type": "module"`
  - Standard Chrome Manifest v3 format

- **manifest-firefox.json**: Firefox-specific configuration
  - Uses `"scripts": []` array (no `type` field)
  - Includes `browser_specific_settings.gecko.id`
  - Minimum Firefox version: 121.0
  - Extension ID: `torn-thread-notifier@fog-dev.com`

**Build System**:
- Environment variable `BROWSER` controls target (chrome/firefox)
- Separate output directories: `dist-chrome/` and `dist-firefox/`
- Cross-platform build via `cross-env` package
- Vite copies correct manifest per browser
- Package script creates separate `.zip` files

**Browser API Differences Handled**:
- Background scripts: Chrome uses service_worker, Firefox uses scripts array
- Type assertions for polyfill return types (TypeScript compatibility)
- All storage, alarms, notifications, and runtime APIs abstracted

### Core Components

#### 1. Service Worker (Background)
Location: [src/background/](src/background/)

The service worker orchestrates all background operations:

- **service-worker.ts**: Main entry point
  - Handles extension installation/updates
  - Listens for alarms and notification clicks
  - Processes messages from popup
  - Coordinates thread checking logic

- **alarm-manager.ts**: Scheduling system
  - Creates/updates alarms based on user settings
  - Implements "continue" vs "fresh start" behavior
  - Handles 1-hour buffer for fresh starts

- **thread-checker.ts**: Monitoring engine
  - Iterates through monitored threads with configurable delays
  - Compares current post counts vs stored values
  - Auto-adjusts cooldown if API usage exceeds 80 req/min
  - Returns check results for notification processing

- **notification-manager.ts**: Notification system
  - Sends browser notifications for new posts
  - Tracks error rates (>50% failure over last 3 cycles)
  - Throttles error notifications (max once per 30 min)
  - Handles notification clicks to open threads

#### 2. Popup Interface
Location: [src/popup/](src/popup/)

Modern, sleek UI for user interaction:

- **popup.html**: Structure
  - Header with settings button
  - Thread list display
  - Add/Import actions
  - Settings modal overlay

- **popup.css**: Styling
  - Dark theme with navy/blue/teal colors
  - Smooth transitions and hover effects
  - Responsive 400×600px layout
  - Custom slider and toggle components

- **popup.ts**: Main controller
  - Initializes all components
  - Handles thread addition (URL parsing)
  - Imports subscribed threads
  - Manages form validation

- **components/settings-modal.ts**: Settings UI logic
  - API key validation (500ms debounced)
  - Slider controls (auto-save on change)
  - Restart behavior toggle
  - Visual feedback (green ✓ / red ✗)

- **components/thread-list.ts**: Thread display
  - Renders monitored threads
  - Truncates titles with full text on hover
  - Delete functionality with confirmation
  - Empty state messaging

- **components/stats-display.ts**: API usage calculator
  - Calculates requests per minute
  - Shows warnings (yellow: 25+, red: 50+)
  - Alerts about auto-adjustments at 80+

#### 3. Data Layer
Location: [src/lib/](src/lib/)

##### Storage ([src/lib/storage/](src/lib/storage/))

- **settings-store.ts**: Settings persistence
  - Stores API key, validation status, check frequency, delays
  - Handles browser.storage.sync quota errors
  - Provides update helpers for individual settings
  - Uses webextension-polyfill for cross-browser compatibility

- **threads-store.ts**: Thread data management
  - CRUD operations for monitored threads
  - Duplicate detection
  - Post count updates after each check
  - Reset functionality for fresh starts
  - Type assertions for polyfill return types

- **error-tracker.ts**: Failure tracking
  - Tracks check results over last 3 cycles
  - Calculates failure rates
  - Enforces 30-minute notification throttle
  - Uses browser.storage.local abstraction

##### API ([src/lib/api/](src/lib/api/))

- **torn-api.ts**: Base API client
  - Fetch wrapper with exponential backoff retry (max 3)
  - Error parsing for Torn API error codes
  - Custom ApiError class for error handling

- **endpoints.ts**: API endpoint wrappers
  - `validateApiKey()`: Tests key via /user/forumsubscribedthreads
  - `getSubscribedThreads()`: Fetches user's subscribed threads
  - `getThreadDetails()`: Gets thread post count and metadata

- **rate-limiter.ts**: Rate limiting logic
  - Calculates requests per minute based on settings
  - Determines warning levels (none/yellow/red)
  - Computes recommended cooldown if >80 req/min
  - Provides delay injection function

##### Models ([src/lib/models/](src/lib/models/))

- **thread.ts**: Thread interfaces
  - `MonitoredThread`: Stored thread data
  - `ThreadCheckResult`: Check operation results

- **settings.ts**: Settings interfaces
  - `ExtensionSettings`: User configuration
  - `ApiUsageStats`: API usage calculations
  - `DEFAULT_SETTINGS`: Default values

- **api-types.ts**: Torn API types
  - Based on OpenAPI v2 specification
  - Forum thread response types
  - Error codes enum
  - Comprehensive type safety

##### Utilities ([src/lib/utils/](src/lib/utils/))

- **url-parser.ts**: URL parsing
  - Extracts thread ID from `t=` parameter
  - Supports hash fragments and query strings
  - Builds thread URLs from IDs

- **validators.ts**: Input validation
  - API key format (16 alphanumeric)
  - Thread ID validation
  - Settings bounds checking

- **formatters.ts**: String formatting
  - Truncates titles for display
  - Relative time formatting ("2 hours ago")
  - Post count with proper pluralization
  - Notification title formatting

## Data Models

### MonitoredThread
```typescript
{
  id: number;
  title: string;
  forum_id: number;
  totalPosts: number;
  lastCheckedPosts: number;
  addedAt: number; // timestamp
  lastChecked?: number;
  lastNotified?: number;
}
```

### ExtensionSettings
```typescript
{
  apiKey: string;
  apiKeyValid: boolean;
  apiKeyError?: string;
  checkFrequencyMinutes: number; // 1-120, default 5
  delayBetweenChecksSeconds: number; // 0.1-3.0, default 0.5
  restartBehavior: 'continue' | 'fresh';
  lastCheckTimestamp?: number;
  lastValidationTimestamp?: number;
}
```

## Key Features

### 1. Thread Monitoring
- Import subscribed threads from Torn
- Manually add threads via URL (parses `t=` parameter)
- Background monitoring via Chrome alarms (minimum 1 minute interval)
- Configurable check frequency (1-120 minutes)
- Configurable delay between checks (0.1-3.0 seconds)

### 2. Notifications
- Browser notifications for new posts
- Format: "{X} new post{s} on Thread '{title}'"
- Click notification to open thread in new tab
- Error notifications when >50% failures over 3 cycles
- Error notification throttling (max once per 30 min)

### 3. API Rate Limiting
- Real-time calculation of requests per minute
- Visual warnings:
  - Yellow: 25-49 req/min (approaching high usage)
  - Red: 50+ req/min (high usage detected)
- Auto-adjustment: If >80 req/min, cooldown automatically increases
- User notification when auto-adjustment occurs

### 4. Restart Behavior
Two modes for handling browser restarts:

- **Continue**: Resume with last known post counts
  - No notifications for posts added while offline

- **Fresh Start**: Reset to current post counts
  - Only if >1 hour has passed since last check
  - Prevents notification spam on restart

### 5. Settings Auto-Save
- All settings save immediately on change
- API key validation debounced (500ms)
- No explicit "Save" button needed
- Visual feedback for all changes

## API Integration

### Torn API v2 Endpoints Used

1. **GET /user/forumsubscribedthreads**
   - Purpose: Validate API key, import subscribed threads
   - Required permission: Minimal access
   - Returns: Array of subscribed threads with post counts

2. **GET /forum/{threadId}/thread**
   - Purpose: Get current post count for monitoring
   - Required permission: Public access
   - Returns: Thread details including total posts

### Error Handling

The extension handles all Torn API error codes:

- **Code 2** (Invalid Key): Mark API key as invalid, show error
- **Code 5** (Rate Limited): Increase delay, notify user
- **Code 6** (Thread Not Found): Thread may be deleted
- **Network Errors**: Retry with exponential backoff (max 3 attempts)

### Rate Limiting Strategy

**Torn API Limits**: 100 requests per minute (default)

**Extension Limits** (configurable):
- Yellow warning: 25-49 req/min
- Red warning: 50-79 req/min
- Auto-adjust: ≥80 req/min

**Calculation**:
```
requestsPerMinute = (threadCount / checkFrequencyMinutes)
```

Example: 10 threads checked every 5 minutes = 2 req/min

## Browser Compatibility & Manifest v3 Considerations

### Service Worker Lifecycle
- Service worker can terminate at any time (Chrome & Firefox)
- All state stored in browser.storage (never in memory)
- browser.alarms persist across terminations
- All operations designed to be idempotent

### Storage Limits
- browser.storage.sync: 100KB total, 8KB per item
- Quota exceeded errors handled gracefully
- Can fall back to browser.storage.local if needed
- Same limits apply to both Chrome and Firefox

### Permissions Required
- `storage`: Persist settings and thread data
- `notifications`: Browser notifications
- `alarms`: Background scheduling
- `host_permissions`: ["https://www.torn.com/*"] for future features

### Minimum Alarm Interval
- Both browsers enforce 1-minute minimum
- User can select 1-120 minutes
- UI enforces this limit

### Firefox-Specific Considerations

**Manifest Differences**:
- Firefox uses `background.scripts` array instead of `service_worker`
- Does NOT support `"type": "module"` in background configuration
- Requires `browser_specific_settings.gecko.id` for submission
- Minimum Firefox version set to 121.0

**Temporary Add-ons**:
- Temporary add-ons in Firefox are removed on browser restart
- For development: reload after each restart via `about:debugging`
- Production users: install from Firefox Add-ons once approved

**Add-ons Validation**:
- Do NOT include `data_collection_permissions` field (omit entirely)
- Background script must use scripts array format
- All other Manifest v3 features supported

## Build System

### Development
```bash
npm install    # Install dependencies
npm run dev    # Start Vite dev server with hot reload (Chrome by default)
```

**Chrome Development**:
- Load unpacked extension from `dist-chrome/` directory in Chrome
- Navigate to `chrome://extensions/`, enable Developer mode, click "Load unpacked"

**Firefox Development**:
- Build Firefox version: `npm run build:firefox`
- Navigate to `about:debugging#/runtime/this-firefox`
- Click "Load Temporary Add-on", select any file in `dist-firefox/`
- Note: Temporary add-ons removed on Firefox restart

### Production Build

**Build Commands**:
```bash
# Build both browsers
npm run build

# Build specific browser
npm run build:chrome    # TypeScript + Vite → dist-chrome/
npm run build:firefox   # TypeScript + Vite → dist-firefox/

# Package for distribution
npm run package           # Creates both .zip files
npm run package:chrome    # Chrome only → torn-thread-notifier-chrome.zip
npm run package:firefox   # Firefox only → torn-thread-notifier-firefox.zip
```

**Build Process**:
1. `BROWSER` environment variable set via cross-env (chrome/firefox)
2. TypeScript compilation with webextension-polyfill types
3. Vite builds to `dist-${browser}/` directory
4. Correct manifest copied: `manifest-${browser}.json` → `manifest.json`
5. Icons and assets copied to output directory
6. Package script creates browser-specific `.zip` files

### CI/CD (GitHub Actions)

Workflow triggers on push to any branch:

1. Install dependencies
2. Build both Chrome and Firefox versions
3. Package both as separate `.zip` files
4. Create GitHub release
   - Master branch → Regular release (v1.0.0)
   - Other branches → Pre-release (v1.0.0-branch-timestamp)
5. Upload both `.zip` files as release assets:
   - `torn-thread-notifier-chrome-{version}.zip`
   - `torn-thread-notifier-firefox-{version}.zip`

## File Structure

```
src/
├── background/           # Service worker components
│   ├── service-worker.ts
│   ├── alarm-manager.ts
│   ├── thread-checker.ts
│   └── notification-manager.ts
├── popup/                # User interface
│   ├── popup.html
│   ├── popup.css
│   ├── popup.ts
│   └── components/
│       ├── settings-modal.ts
│       ├── thread-list.ts
│       └── stats-display.ts
├── lib/                  # Shared libraries
│   ├── api/             # Torn API integration
│   ├── storage/         # Data persistence (webextension-polyfill)
│   ├── models/          # TypeScript interfaces
│   └── utils/           # Helper functions
├── assets/icons/         # Extension icons
├── manifest-chrome.json  # Chrome-specific manifest
└── manifest-firefox.json # Firefox-specific manifest

dist-chrome/              # Chrome build output
dist-firefox/             # Firefox build output
.github/workflows/        # CI/CD automation (dual builds)
scripts/                  # Build scripts (browser-aware packaging)
tests/                    # Testing (future)
```

## Development Guidelines

### Adding New Features

1. **New API Endpoint**: Add to `lib/api/endpoints.ts`
2. **New Setting**: Update `lib/models/settings.ts` and `lib/storage/settings-store.ts`
3. **New UI Component**: Create in `popup/components/`
4. **New Background Logic**: Add to appropriate `background/` file

### Type Safety

- All files use strict TypeScript
- Import types from `lib/models/`
- Use `.js` extensions in imports (for ESM compatibility)
- Use `@types/webextension-polyfill` for browser API types
- Add type assertions for polyfill return types when needed

### Cross-Browser Development

- **ALWAYS** use `import browser from 'webextension-polyfill'`
- **NEVER** use `chrome.*` namespace directly
- Use `browser.storage`, `browser.alarms`, `browser.notifications`, etc.
- Test in both Chrome and Firefox during development
- Build both versions before committing: `npm run build`

### Storage Patterns

- Use provided store modules (settings-store, threads-store)
- Always handle quota exceeded errors
- Use browser.storage.sync for user data
- Use browser.storage.local for temporary/large data
- Add type assertions for polyfill results: `(result[key] as Type) || defaultValue`

## Testing

### Manual Testing Checklist

Test in **both Chrome and Firefox** for comprehensive validation:

- API key validation
- Thread import/addition/deletion
- Background monitoring (verify service worker runs in both browsers)
- Notifications (check system permissions per browser)
- Settings persistence (browser.storage.sync)
- Error handling
- Browser-specific builds and packaging
- Firefox temporary add-on reload after restart

### Unit Testing (Future Enhancement)

Potential test files in `tests/unit/`:
- `url-parser.test.ts`
- `rate-limiter.test.ts`
- `validators.test.ts`
- `formatters.test.ts`

## Known Limitations

1. **Minimum Check Frequency**: 1 minute (browser alarm limitation for both Chrome & Firefox)
2. **Storage Quota**: 100KB for browser.storage.sync (both browsers)
3. **API Rate Limits**: Must respect Torn's 100 req/min limit
4. **Service Worker Lifespan**: Can terminate anytime (design accounts for this)
5. **Firefox Temporary Add-ons**: Removed on browser restart (until approved on Firefox Add-ons)

## Future Enhancement Possibilities

1. **Thread Categorization**: Group threads by forum category
2. **Custom Notifications**: Sound options, priority levels
3. **Thread Search**: Search within monitored threads
4. **Export/Import**: Backup monitored threads list
5. **Statistics Dashboard**: Historical data on checks and notifications
6. **Multiple API Keys**: Support for multiple Torn accounts
7. **Dark/Light Theme**: User-selectable theme
8. **Thread Notes**: Add custom notes to monitored threads
9. **Filtering**: Show only threads with new posts
10. **Badge Counter**: Show unread post count on extension icon

## Troubleshooting

### Common Issues

**API Key Not Validating**:
- Ensure key is exactly 16 alphanumeric characters
- Check key has required permissions (minimal access)
- Verify internet connection
- Test in both browsers if dual-deploying

**Notifications Not Appearing**:
- Check browser notification permissions in system settings
- Ensure API key is valid
- Verify check frequency is reasonable (not too infrequent)
- **Chrome**: Check chrome://extensions/ for errors
- **Firefox**: Verify background script running in about:debugging

**High API Usage Warnings**:
- Reduce number of monitored threads
- Increase check frequency (check less often)
- Increase delay between checks

**Service Worker Not Running**:
- **Chrome**: Check chrome://extensions/, view service worker console
- **Firefox**: Check about:debugging#/runtime/this-firefox, inspect background script
- Restart extension if needed
- Verify correct manifest for browser

**Firefox Build Errors**:
- Ensure BROWSER=firefox environment variable set
- Check manifest-firefox.json has `scripts` array (not service_worker)
- Verify no `"type": "module"` in background configuration
- Confirm browser_specific_settings.gecko.id is present

**Firefox Temporary Add-on Removed**:
- This is expected behavior for temporary add-ons
- Reload via about:debugging after each Firefox restart
- For permanent installation, submit to Firefox Add-ons

## Support and Contribution

For issues or feature requests, please file an issue on the GitHub repository.

---

**Last Updated**: v1.0.0 with Firefox support
**Maintained By**: Claude Code Assistant

## Changelog

### v1.0.0 - Firefox Support Added
- Added cross-browser compatibility for Chrome and Firefox
- Implemented webextension-polyfill for unified browser API
- Created dual-build system with browser-specific manifests
- Updated all source code to use `browser.*` namespace
- Added Firefox-specific manifest configuration
- Updated CI/CD to build and release both browser versions
- Updated documentation for cross-browser development
