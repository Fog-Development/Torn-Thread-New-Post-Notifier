# Manual Testing Plan - Torn Thread Notifier

## Initial Setup

- [ ] Extension loads without errors in Chrome
- [ ] Default settings are properly initialized
- [ ] Icons display correctly (placeholders)
- [ ] Popup opens when clicking extension icon
- [ ] Settings modal opens automatically (no API key set)

## Settings Tests

### API Key Validation

- [ ] Enter invalid API key (wrong length) → Red X with error message
- [ ] Enter invalid API key (wrong format) → Red X with error message
- [ ] Enter valid but incorrect API key → Red X with API error message
- [ ] Enter valid working API key → Green checkmark appears
- [ ] API key validation has 500ms debounce (doesn't spam API while typing)
- [ ] Settings modal can be closed with X button
- [ ] Settings modal can be closed by clicking overlay
- [ ] API key persists after closing and reopening popup

### Slider Controls

- [ ] Check frequency slider: 1-120 minutes range works
- [ ] Check frequency slider: Display updates with value
- [ ] Check frequency slider: Auto-saves on change
- [ ] Delay slider: 0.1-3.0 seconds range works
- [ ] Delay slider: Increments by 0.1 properly
- [ ] Delay slider: Display updates with value (e.g., "0.5 seconds")
- [ ] Delay slider: Auto-saves on change
- [ ] Settings persist after browser restart

### Restart Behavior Toggle

- [ ] Default is "Continue" selected
- [ ] Clicking "Fresh Start" switches active state
- [ ] Clicking "Continue" switches back
- [ ] Setting persists after popup close
- [ ] Tooltip shows explanation on hover (ⓘ icon)

### API Usage Stats

- [ ] Shows "0 requests/min" with no threads
- [ ] Updates when threads are added
- [ ] Updates when check frequency changes
- [ ] Updates when delay changes
- [ ] Yellow warning appears at 25+ req/min
- [ ] Red warning appears at 50+ req/min
- [ ] Auto-adjust warning appears at 80+ req/min
- [ ] Warning messages are clear and helpful

## Thread Management Tests

### Import Subscribed Threads

- [ ] Button disabled without valid API key
- [ ] Button prompts for API key if not set
- [ ] Import button shows "Importing..." during operation
- [ ] Successfully imports subscribed threads
- [ ] Shows count of imported threads
- [ ] Skips threads already being monitored
- [ ] Shows appropriate message if no subscribed threads
- [ ] Handles API errors gracefully
- [ ] Thread list updates after import

### Manual Thread Addition

- [ ] "Add Thread" button shows input form
- [ ] "Cancel" button hides form and clears input
- [ ] Enter key submits form
- [ ] Invalid URL shows error message
- [ ] URL without `t=` parameter shows error
- [ ] URL with invalid thread ID shows error
- [ ] Valid thread URL successfully adds thread
- [ ] Duplicate thread shows appropriate error
- [ ] Button shows "Adding..." during operation
- [ ] Form resets after successful addition
- [ ] Various URL formats work:
  - [ ] Query string: `?t=123`
  - [ ] Hash fragment: `#/p=threads&f=46&t=123`
  - [ ] Mixed parameters in different orders

### Thread List Display

- [ ] Empty state shows when no threads
- [ ] Empty state has helpful hint message
- [ ] Threads display with truncated titles
- [ ] Full title shows on hover
- [ ] Post count displays correctly
- [ ] Last checked time shows (or "Never checked")
- [ ] Relative time formatting works ("2 hours ago")
- [ ] Delete button appears on hover
- [ ] Delete button disappears when not hovering
- [ ] Delete requires confirmation
- [ ] Delete successfully removes thread
- [ ] Thread list updates after deletion
- [ ] API usage stats update after deletion

## Background Monitoring Tests

### Alarm Creation

- [ ] Alarm created on extension install
- [ ] Alarm updates when check frequency changes
- [ ] Alarm triggers at correct interval
- [ ] Can verify alarm in chrome://extensions (service worker console)

### Thread Checking

- [ ] Threads are checked at scheduled intervals
- [ ] Delay between thread checks is respected
- [ ] Post counts update after successful check
- [ ] Last checked time updates
- [ ] Checks continue even when popup is closed
- [ ] Checks continue after browser restart (if browser not fully quit)

### Notifications

- [ ] Notification appears when new posts detected
- [ ] Notification title format: "{X} new post{s} on Thread '{title}'"
- [ ] Singular form: "1 new post"
- [ ] Plural form: "2+ new posts"
- [ ] Clicking notification opens thread in new tab
- [ ] Thread URL is correct with forum_id and thread_id
- [ ] No duplicate notifications for same thread
- [ ] Notification cleared after clicking

### Error Handling

- [ ] Network errors don't crash extension
- [ ] Invalid API key errors handled
- [ ] Rate limit errors handled
- [ ] Thread not found (deleted) handled gracefully
- [ ] Error notification appears after >50% failure rate
- [ ] Error notification doesn't spam (max once per 30 min)
- [ ] Error tracking works across 3 check cycles

### Restart Behavior

**Continue Mode**:
- [ ] Post counts maintained across browser restart
- [ ] No notifications for old posts on restart
- [ ] Monitoring resumes from last known state

**Fresh Start Mode**:
- [ ] If <1 hour since last check: Post counts maintained
- [ ] If >1 hour since last check: Post counts reset to current
- [ ] No notification flood on restart
- [ ] Fresh start logged in console

### Auto-Adjustment

- [ ] Cooldown increases if >80 req/min detected
- [ ] User receives notification about auto-adjustment
- [ ] New cooldown value is saved to settings
- [ ] Settings UI reflects new cooldown value
- [ ] Auto-adjustment only happens at check time

## Build and Deployment Tests

### Development Build

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts dev server
- [ ] Extension loads in Chrome from dist/
- [ ] Hot reload works during development
- [ ] TypeScript errors show in console
- [ ] Source maps work for debugging

### Production Build

- [ ] `npm run build` completes without errors
- [ ] TypeScript compilation succeeds
- [ ] No TypeScript errors
- [ ] Vite build completes
- [ ] dist/ directory contains all necessary files:
  - [ ] manifest.json
  - [ ] background/service-worker.js
  - [ ] popup/popup.html
  - [ ] popup/popup.css
  - [ ] assets/ directory
  - [ ] icons/ directory

### Package Creation

- [ ] `npm run package` creates .zip file
- [ ] Zip file contains all dist/ contents
- [ ] Zip file size is reasonable
- [ ] Zip can be uploaded to Chrome Web Store

### GitHub Actions

- [ ] Workflow triggers on push to master
- [ ] Workflow triggers on push to other branches
- [ ] Build completes successfully
- [ ] Package is created
- [ ] Release is created on GitHub
- [ ] Master branch creates regular release
- [ ] Other branches create pre-release
- [ ] Zip file is attached to release
- [ ] Release has correct version number
- [ ] Release notes are generated

## Edge Cases and Error Conditions

### Storage

- [ ] Handles quota exceeded gracefully
- [ ] Shows appropriate error message
- [ ] Doesn't lose existing data
- [ ] Can recover from quota errors

### API Limits

- [ ] Handles 100 req/min API limit
- [ ] Respects rate limiting
- [ ] Shows warnings before hitting limit
- [ ] Auto-adjusts to prevent limit

### Network

- [ ] Works offline (no crashes)
- [ ] Handles intermittent connectivity
- [ ] Retries failed requests
- [ ] Max 3 retries with exponential backoff

### Thread Scenarios

- [ ] Handles deleted threads
- [ ] Handles locked threads
- [ ] Handles threads with polls
- [ ] Handles threads with special characters in title
- [ ] Handles very long thread titles (truncation)

### Browser Scenarios

- [ ] Works after Chrome update
- [ ] Works after extension update
- [ ] Data migrates on extension update
- [ ] Settings persist across updates
- [ ] Works with browser in background
- [ ] Alarms survive browser sleep/wake

## Performance Tests

- [ ] Popup opens quickly (<500ms)
- [ ] Thread list renders quickly with 50+ threads
- [ ] Settings changes save immediately
- [ ] No memory leaks in service worker
- [ ] Efficient API calls (no unnecessary requests)
- [ ] Smooth UI animations
- [ ] No blocking operations

## Accessibility Tests

- [ ] All buttons have aria-labels
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] High contrast mode supported
- [ ] Screen reader compatible (basic)

## Browser Compatibility

- [ ] Works on Chrome (latest)
- [ ] Works on Chrome (previous version)
- [ ] Works on Edge (Chromium-based)
- [ ] Works on Brave
- [ ] Manifest v3 features all supported

## User Experience

- [ ] UI is intuitive and easy to understand
- [ ] Error messages are clear and helpful
- [ ] Loading states are visible
- [ ] No jarring transitions
- [ ] Icons and colors convey meaning
- [ ] Settings are easy to find and change
- [ ] Thread management is straightforward
- [ ] Notifications are not annoying

---

## Testing Notes

**Tester**: _________________
**Date**: _________________
**Extension Version**: _________________
**Chrome Version**: _________________
**OS**: _________________

**Issues Found**:
1.
2.
3.

**Suggestions**:
1.
2.
3.
