# Focus Manager Extension

A calendar-aware distraction blocker that helps you stay focused during meetings and deep work sessions.

## Features

- **Calendar Integration**: Automatically syncs with Google Calendar.
- **Manual Focus Mode**: Toggle focus mode on/off manually for self-control.
- **Smart Blocking**: Blocks social media sites (Facebook, Twitter, etc.) during scheduled meetings.
- **Insights**: Tracks how many distractions were blocked and your total focus time.
- **Premium UI**: A beautiful, dark-mode interface with glassmorphism effects.

## Installation

1. Clone this repository or download the source code.
2. Copy `manifest.example.json` to `manifest.json`:
   ```bash
   cp manifest.example.json manifest.json
   ```
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked**.
6. Select the `focus-manager` directory.

## Configuration

### Google Calendar API Setup

To enable real Google Calendar integration:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Enable the **Google Calendar API**.
4. Configure the **OAuth Consent Screen**:
   - Add your email as a test user.
   - Add the scope: `https://www.googleapis.com/auth/calendar.readonly`
5. Create **OAuth 2.0 Client ID** credentials:
   - Application type: **Chrome Extension**
   - You'll need the extension's Item ID (found in `chrome://extensions` after loading the extension).
6. Copy your Client ID.
7. Open `manifest.json` and replace `"YOUR_CLIENT_ID_HERE"` with your actual Client ID:
   ```json
   "oauth2": {
     "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/calendar.readonly"
     ]
   }
   ```
8. Open `background.js` and set `const SIMULATION_MODE = false;` (line 29).
9. Reload the extension in `chrome://extensions`.

### Simulation Mode (Default)

By default, the extension runs in **Simulation Mode**, which:
- Generates mock meetings to demonstrate functionality immediately.
- Doesn't require Google Calendar API setup.
- Perfect for testing and development.

## Usage

1. Click the extension icon in your Chrome toolbar.
2. **Manual Focus**: Toggle the switch to enable/disable focus mode manually.
3. **Calendar Sync**: Click "Sync Calendar" to authenticate and sync with Google Calendar.
4. When a meeting is active (simulated or real), "Focus Mode" will activate and social media sites will be blocked.
5. View your stats: "Distractions Blocked" and "Focus Time Today".

## Privacy

- This extension only accesses your Google Calendar to read meeting times.
- No data is sent to external servers.
- All data is stored locally in your browser.

## Development

### File Structure

```
focus-manager/
├── manifest.json          # Extension configuration (not tracked in git)
├── manifest.example.json  # Template for manifest.json
├── background.js          # Core logic (calendar polling, blocking)
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── blocked.html          # Page shown when sites are blocked
├── images/               # Extension icons
└── README.md             # This file
```

### Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test thoroughly.
5. Submit a pull request.

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or questions, please open an issue on GitHub.
