# Torn Thread Notifier

A cross-browser extension for **Chrome** and **Firefox** that monitors Torn forum threads and sends browser notifications when new posts are detected.

## Features

- **Cross-Browser Support**: Works on both Chrome and Firefox
- **Thread Monitoring**: Track specific Torn forum threads for new posts
- **Smart Notifications**: Get notified instantly when new posts appear
- **Import Subscribed Threads**: Automatically import threads you're subscribed to in Torn
- **Manual Thread Addition**: Add any thread by pasting its URL
- **Configurable Intervals**: Set how often to check for updates (1-120 minutes)
- **API Rate Management**: Built-in warnings and auto-adjustments to stay within API limits
- **Background Monitoring**: Continues checking even when browser is minimized
- **Modern UI**: Sleek, dark-themed interface with smooth animations

## Installation

### Chrome

#### From Chrome Web Store (Coming Soon)
_Extension pending review_

#### Manual Installation
1. Download the latest `torn-thread-notifier-chrome-X.X.X.zip` from the [Releases](https://github.com/YOUR_USERNAME/Torn-Thread-New-Post-Notifier/releases) page
2. Unzip the file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" and select the unzipped folder

### Firefox

#### From Firefox Add-ons (Coming Soon)
_Extension pending review_

#### Manual Installation
1. Download the latest `torn-thread-notifier-firefox-X.X.X.zip` from the [Releases](https://github.com/YOUR_USERNAME/Torn-Thread-New-Post-Notifier/releases) page
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the downloaded `.zip` file or the `manifest.json` from the unzipped folder

**Note:** Temporary add-ons in Firefox are removed when the browser restarts. For permanent installation, install from Firefox Add-ons once available.

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Torn-Thread-New-Post-Notifier.git
   cd Torn-Thread-New-Post-Notifier
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   # Build both browsers
   npm run build

   # Or build specific browser
   npm run build:chrome
   npm run build:firefox
   ```

4. Load the extension:

   **Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist-chrome/` folder

   **Firefox:**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist-firefox/` folder

## Setup

1. Click the extension icon in your browser toolbar
2. Click the settings gear icon ⚙️
3. Enter your Torn API key (requires minimal access level)
4. Configure your preferences:
   - **Check Frequency**: How often to check for new posts (default: 5 minutes)
   - **Delay Between Checks**: Cooldown between checking each thread (default: 0.5 seconds)
   - **Restart Behavior**: Choose how to handle browser restarts

## Usage

### Adding Threads to Monitor

**Option 1: Import Subscribed Threads**
- Click "Import Subscribed" to automatically add all threads you're subscribed to in Torn

**Option 2: Manual Addition**
1. Click "Add Thread"
2. Paste the thread URL (must contain the `t=` parameter)
3. Click "Add"

Example thread URLs:
- `https://www.torn.com/forums.php#/p=threads&f=46&t=15907925`
- `https://www.torn.com/forums.php?p=threads&t=12345`

### Managing Threads

- **View**: See all monitored threads in the popup
- **Delete**: Hover over a thread and click the X button
- **Check Status**: See when each thread was last checked and total post count

### Understanding API Usage

The extension shows your estimated API usage based on:
- Number of monitored threads
- Check frequency
- Delay between checks

**Warning Levels:**
- **Yellow** (25-49 req/min): Approaching higher usage
- **Red** (50-79 req/min): High usage detected
- **Auto-adjust** (80+ req/min): Cooldown will be automatically increased

## Configuration Options

### Check Frequency (1-120 minutes)
How often the extension checks all monitored threads. Lower values mean more frequent checks but higher API usage.

### Delay Between Checks (0.1-3.0 seconds)
Time to wait between checking each thread in a cycle. Higher values reduce API usage.

### Restart Behavior

**Continue** (default):
- Resumes monitoring from last known post counts
- No notifications for posts added while browser was closed

**Fresh Start**:
- Resets to current post counts if >1 hour has passed since last check
- Prevents notification spam after long periods offline

## API Requirements

- **Torn API Key**: Required (get from [Torn Preferences](https://www.torn.com/preferences.php#tab=api))
- **Access Level**: Minimal or higher
- **Rate Limit**: 100 requests per minute (extension helps you stay within limits)

## Development

### Prerequisites

- Node.js 20+
- npm

### Development Mode

```bash
npm install      # Install dependencies
npm run dev      # Start development server with hot reload (Chrome by default)
```

**Chrome:**
- Load the extension from the `dist-chrome/` folder via `chrome://extensions/`

**Firefox:**
- Build Firefox version first: `npm run build:firefox`
- Load from `dist-firefox/` via `about:debugging#/runtime/this-firefox`

### Build for Production

```bash
# Build both browsers
npm run build

# Build specific browser
npm run build:chrome
npm run build:firefox

# Package for distribution
npm run package           # Creates both Chrome and Firefox .zip files
npm run package:chrome    # Chrome only
npm run package:firefox   # Firefox only
```

### Project Structure

See [CLAUDE.md](CLAUDE.md) for comprehensive technical documentation.

## Technologies

- **TypeScript**: Type-safe development
- **Vite**: Fast build system with browser-specific builds
- **Manifest v3**: Latest extension standard (Chrome & Firefox)
- **webextension-polyfill**: Cross-browser API compatibility layer
- **Torn API v2**: Official Torn API
- **Vanilla HTML/CSS/JS**: No framework dependencies

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues, questions, or feature requests, please file an issue on the [GitHub repository](https://github.com/YOUR_USERNAME/Torn-Thread-New-Post-Notifier/issues).

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to Torn City or its developers. It is a third-party tool created for personal use by Torn players.

## Troubleshooting

**Extension won't load**:
- Ensure you've built the extension for the correct browser (`npm run build:chrome` or `npm run build:firefox`)
- Check browser's developer console for errors
- Verify manifest.json is present in `dist-chrome/` or `dist-firefox/`

**Firefox temporary add-on removed after restart**:
- This is expected behavior for temporary add-ons in Firefox
- For permanent installation, wait for Firefox Add-ons approval
- Alternatively, rebuild and reload after each Firefox restart

**API key not validating**:
- Key must be exactly 16 alphanumeric characters
- Key must have at least "Minimal" access level
- Check your internet connection

**Notifications not appearing**:
- Enable notifications in your system settings (for Chrome or Firefox)
- Check notification permissions for the extension
- Ensure threads have new posts to notify about
- **Firefox**: Check that the background script is running in `about:debugging`

**High API usage warnings**:
- Reduce number of monitored threads
- Increase check frequency (check less often)
- Increase delay between checks

## Roadmap

- [ ] Thread categorization by forum
- [ ] Custom notification sounds
- [ ] Statistics dashboard
- [ ] Export/import thread lists
- [ ] Multi-account support
- [ ] Dark/light theme toggle

## Acknowledgments

Built with assistance from Claude Code (Anthropic).
