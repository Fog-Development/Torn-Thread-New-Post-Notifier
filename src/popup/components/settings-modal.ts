import { getSettings, updateApiKey, updateCheckFrequency, updateDelay, updateRestartBehavior } from '../../lib/storage/settings-store.js';
import { validateApiKey } from '../../lib/api/endpoints.js';
import { isValidApiKey } from '../../lib/utils/validators.js';
import { updateApiUsageStats } from './stats-display.js';

let debounceTimer: number | null = null;
const API_KEY_DEBOUNCE_MS = 500;

export async function initializeSettingsModal(): Promise<void> {
  const settings = await getSettings();

  // Populate form fields
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  const checkFrequencySlider = document.getElementById('checkFrequencySlider') as HTMLInputElement;
  const delaySlider = document.getElementById('delaySlider') as HTMLInputElement;
  const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
  const freshBtn = document.getElementById('freshBtn') as HTMLButtonElement;

  if (apiKeyInput) apiKeyInput.value = settings.apiKey;
  if (checkFrequencySlider) checkFrequencySlider.value = settings.checkFrequencyMinutes.toString();
  if (delaySlider) delaySlider.value = settings.delayBetweenChecksSeconds.toString();

  // Set restart behavior toggle
  if (settings.restartBehavior === 'fresh') {
    continueBtn?.classList.remove('active');
    freshBtn?.classList.add('active');
  }

  // Update display values
  updateSliderValues();
  await updateApiUsageStats();

  // Setup event listeners
  setupEventListeners();

  // Show API key validation status if already validated
  if (settings.apiKey) {
    updateApiKeyValidation(settings.apiKeyValid, settings.apiKeyError);
  }
}

function setupEventListeners(): void {
  // API Key Input (with debounce)
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  apiKeyInput?.addEventListener('input', handleApiKeyInput);

  // Check Frequency Slider
  const checkFrequencySlider = document.getElementById('checkFrequencySlider') as HTMLInputElement;
  checkFrequencySlider?.addEventListener('input', handleCheckFrequencyChange);

  // Delay Slider
  const delaySlider = document.getElementById('delaySlider') as HTMLInputElement;
  delaySlider?.addEventListener('input', handleDelayChange);

  // Restart Behavior Toggle
  const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
  const freshBtn = document.getElementById('freshBtn') as HTMLButtonElement;
  continueBtn?.addEventListener('click', () => handleRestartBehaviorChange('continue'));
  freshBtn?.addEventListener('click', () => handleRestartBehaviorChange('fresh'));

  // Modal Open/Close
  const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
  const closeModalBtn = document.getElementById('closeModalBtn') as HTMLButtonElement;
  const settingsModal = document.getElementById('settingsModal') as HTMLDivElement;

  settingsBtn?.addEventListener('click', () => {
    settingsModal?.classList.remove('hidden');
  });

  closeModalBtn?.addEventListener('click', () => {
    settingsModal?.classList.add('hidden');
  });

  // Close modal on overlay click
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });
}

function handleApiKeyInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  const apiKey = input.value.trim();

  // Clear previous debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Reset validation UI
  updateApiKeyValidation(false);

  // Debounce validation
  if (apiKey.length === 16) {
    debounceTimer = window.setTimeout(async () => {
      await validateAndSaveApiKey(apiKey);
    }, API_KEY_DEBOUNCE_MS);
  }
}

async function validateAndSaveApiKey(apiKey: string): Promise<void> {
  // Basic format validation first
  if (!isValidApiKey(apiKey)) {
    updateApiKeyValidation(false, 'API key must be 16 alphanumeric characters');
    return;
  }

  // API validation
  const result = await validateApiKey(apiKey);

  if (result.valid) {
    await updateApiKey(apiKey, true);
    updateApiKeyValidation(true);

    // Notify background to update alarm
    chrome.runtime.sendMessage({ type: 'update-alarm' });
  } else {
    await updateApiKey(apiKey, false, result.error);
    updateApiKeyValidation(false, result.error);
  }
}

function updateApiKeyValidation(isValid: boolean, error?: string): void {
  const input = document.getElementById('apiKeyInput') as HTMLInputElement;
  const icon = document.getElementById('apiKeyIcon') as HTMLSpanElement;
  const errorDiv = document.getElementById('apiKeyError') as HTMLDivElement;

  if (!input || !icon || !errorDiv) return;

  // Reset classes
  input.classList.remove('valid', 'invalid');
  icon.classList.remove('valid', 'invalid', 'hidden');

  if (isValid) {
    input.classList.add('valid');
    icon.classList.add('valid');
    icon.textContent = '✓';
    errorDiv.classList.add('hidden');
  } else if (error) {
    input.classList.add('invalid');
    icon.classList.add('invalid');
    icon.textContent = '✗';
    errorDiv.textContent = error;
    errorDiv.classList.remove('hidden');
  } else {
    icon.classList.add('hidden');
    errorDiv.classList.add('hidden');
  }
}

async function handleCheckFrequencyChange(e: Event): Promise<void> {
  const slider = e.target as HTMLInputElement;
  const value = parseInt(slider.value);

  await updateCheckFrequency(value);
  updateSliderValues();
  await updateApiUsageStats();

  // Notify background to update alarm
  chrome.runtime.sendMessage({ type: 'update-alarm' });
}

async function handleDelayChange(e: Event): Promise<void> {
  const slider = e.target as HTMLInputElement;
  const value = parseFloat(slider.value);

  await updateDelay(value);
  updateSliderValues();
  await updateApiUsageStats();
}

async function handleRestartBehaviorChange(behavior: 'continue' | 'fresh'): Promise<void> {
  await updateRestartBehavior(behavior);

  const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
  const freshBtn = document.getElementById('freshBtn') as HTMLButtonElement;

  if (behavior === 'continue') {
    continueBtn?.classList.add('active');
    freshBtn?.classList.remove('active');
  } else {
    continueBtn?.classList.remove('active');
    freshBtn?.classList.add('active');
  }
}

function updateSliderValues(): void {
  const checkFrequencySlider = document.getElementById('checkFrequencySlider') as HTMLInputElement;
  const delaySlider = document.getElementById('delaySlider') as HTMLInputElement;
  const checkFrequencyValue = document.getElementById('checkFrequencyValue') as HTMLSpanElement;
  const delayValue = document.getElementById('delayValue') as HTMLSpanElement;

  if (checkFrequencySlider && checkFrequencyValue) {
    const minutes = parseInt(checkFrequencySlider.value);
    checkFrequencyValue.textContent = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  if (delaySlider && delayValue) {
    const seconds = parseFloat(delaySlider.value);
    delayValue.textContent = `${seconds.toFixed(1)} second${seconds !== 1 ? 's' : ''}`;
  }
}

export async function showSettingsIfNeeded(): Promise<boolean> {
  const settings = await getSettings();

  if (!settings.apiKey || !settings.apiKeyValid) {
    const modal = document.getElementById('settingsModal') as HTMLDivElement;
    modal?.classList.remove('hidden');
    return true;
  }

  return false;
}
