import browser from 'webextension-polyfill';
import { initializeAlarm, handleAlarmTrigger } from './alarm-manager.js';
import { checkAllThreads } from './thread-checker.js';
import { handleCheckResults, handleNotificationClick } from './notification-manager.js';
import { getSettings, updateLastCheckTimestamp } from '../lib/storage/settings-store.js';

// Initialize alarm on startup (important for Firefox Event Pages)
browser.runtime.onStartup.addListener(() => {
  console.log('Extension startup - reinitializing alarm');
  initializeAlarm().catch(error => {
    console.error('Error initializing alarm on startup:', error);
  });
});

// Initialize on extension install or update
browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);

  // Handle async initialization but don't await in listener
  (async () => {
    // Initialize alarm
    await initializeAlarm();

    if (details.reason === 'install') {
      console.log('First time installation - welcome!');

      // Initialize lastCheckTimestamp on first install as a defensive measure
      const settings = await getSettings();
      if (settings.lastCheckTimestamp === undefined) {
        await updateLastCheckTimestamp(Date.now());
        console.log('Initialized lastCheckTimestamp on first install');
      }
    } else if (details.reason === 'update') {
      console.log('Extension updated to version:', browser.runtime.getManifest().version);
    }
  })().catch(error => {
    console.error('Error during initialization:', error);
  });
});

// Handle alarm triggers
browser.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);

  // Handle async work but don't await in listener
  (async () => {
    // Handle the alarm trigger (restart behavior logic)
    const shouldProceed = await handleAlarmTrigger();

    if (shouldProceed) {
      // Check all threads
      const results = await checkAllThreads();

      // Handle results (send notifications, track errors)
      await handleCheckResults(results);
    }
  })().catch(error => {
    console.error('Error handling alarm:', error);
  });
});

// Handle notification clicks
browser.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);

  // Handle async work but don't await in listener
  handleNotificationClick(notificationId).catch(error => {
    console.error('Error handling notification click:', error);
  });
});

// Handle messages from popup
browser.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  console.log('Message received:', message);

  (async () => {
    try {
      if (message.type === 'check-now') {
        // Manual check triggered from popup
        const results = await checkAllThreads();
        await handleCheckResults(results);
        sendResponse({ success: true, results });
      } else if (message.type === 'update-alarm') {
        // Alarm frequency changed
        await initializeAlarm();
        sendResponse({ success: true });
      } else if (message.type === 'get-status') {
        // Get current status
        const settings = await getSettings();
        sendResponse({
          success: true,
          status: {
            apiKeyValid: settings.apiKeyValid,
            checkFrequency: settings.checkFrequencyMinutes
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();

  // Return true to indicate async response
  return true;
});

console.log('Service worker initialized');
