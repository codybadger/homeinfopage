# Home Information Dashboard

A beautiful, responsive web dashboard for your Raspberry Pi that displays:

- 📅 **Date & Time** - Current date and time with automatic updates
- 🌤️ **Weather** - Current weather conditions using OpenWeatherMap API
- 📆 **Google Calendar** - Your upcoming week's events
- ✅ **Google Tasks** - Your to-do list items
- 📊 **Google Sheets** - Custom data from your spreadsheets

## Features

- **Modern Design**: Clean, responsive interface that works on desktop and mobile
- **Real-time Updates**: Auto-refreshes data every 5 minutes
- **Easy Navigation**: Simple navigation between main dashboard and sheets page
- **Home Network Ready**: Designed for internal network use on your Raspberry Pi
- **Secure**: Uses HTTPS for all API communications

## Quick Start

### 1. Get API Keys

- **OpenWeatherMap**: [Get free API key](https://openweathermap.org/api)
- **Google APIs**: [Set up Google Cloud Console](https://console.developers.google.com/)

### 2. Configure Your Dashboard

Edit `config.js` with your API keys:

```javascript
const CONFIG = {
    WEATHER: {
        API_KEY: 'your_openweather_api_key',
        CITY: 'Your City,Country',
        UNITS: 'metric'
    },
    GOOGLE: {
        CLIENT_ID: 'your_google_client_id',
        API_KEY: 'your_google_api_key',
        // ... other settings
    }
};
```

### 3. Deploy to Your Raspberry Pi

**Option A: Using the deployment script (Windows)**
```bash
# Run the PowerShell script
.\deploy-to-pi.ps1

# Or run the batch file
deploy-to-pi.bat
```

**Option B: Manual deployment**
```bash
# Copy files to your Pi
scp *.html *.css *.js cody@192.168.44.63:/home/cody/dashboard/

# SSH into your Pi and move files
ssh cody@192.168.44.63
sudo cp /home/cody/dashboard/* /var/www/dashboard/
sudo chown -R www-data:www-data /var/www/dashboard
```

### 4. Access Your Dashboard

Open your browser and go to: `http://192.168.44.63`

## File Structure

```
homeinfopage/
├── index.html              # Main dashboard page
├── sheets.html             # Google Sheets data page
├── styles.css              # Styling and responsive design
├── script.js               # Main dashboard functionality
├── sheets-script.js        # Google Sheets integration
├── config.js               # Configuration file (API keys)
├── deploy-to-pi.ps1        # PowerShell deployment script
├── deploy-to-pi.bat        # Batch deployment script
├── deployment-windows-to-pi.md  # Detailed deployment guide
└── setup-guide.md          # Complete setup instructions
```

## Configuration

### Weather API
- Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)
- Set your city in the format: `"City,Country"` (e.g., `"London,UK"`)

### Google APIs
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project
3. Enable these APIs:
   - Google Calendar API
   - Google Tasks API
   - Google Sheets API
4. Create OAuth 2.0 credentials and API key
5. Add your Pi's IP address to authorized origins

### Google Sheets
1. Create a Google Sheet with your data
2. Share it with your Google account
3. Copy the spreadsheet ID from the URL
4. Configure the range to read (e.g., `"Sheet1!A:Z"`)

## Deployment Options

### Windows to Raspberry Pi
- Use `deploy-to-pi.ps1` (PowerShell) or `deploy-to-pi.bat` (Command Prompt)
- See `deployment-windows-to-pi.md` for detailed instructions

### Direct on Raspberry Pi
- Use `deploy.sh` script (make executable with `chmod +x deploy.sh`)
- See `setup-guide.md` for complete setup instructions

## Local Development Server

### Starting a Local Server (Windows)

To test your dashboard locally before deploying to the Pi:

1. **Create the server script** (already included as `webserver.ps1`):
   ```powershell
   Add-Type -AssemblyName System.Web
   $listener = New-Object System.Net.HttpListener
   $listener.Prefixes.Add('http://localhost:8080/')
   $listener.Start()
   Write-Host "Server running at http://localhost:8080"
   # ... (full script in webserver.ps1)
   ```

2. **Start the server**:
   ```bash
   powershell -ExecutionPolicy Bypass -File webserver.ps1
   ```

3. **Access your dashboard**: Open `http://localhost:8080` in your browser

4. **Stop the server**: Press `Ctrl+C` in the terminal

**Note**: This PowerShell HTTP server works when Python, Node.js, and other common web servers are not available on Windows.

## Troubleshooting

### Common Issues

1. **Dashboard not loading**: Check nginx status and firewall settings
2. **Weather not showing**: Verify OpenWeatherMap API key and city name
3. **Google services not working**: Check OAuth configuration and authorized origins
4. **Sheets data not displaying**: Verify spreadsheet ID and sharing permissions

### Useful Commands

```bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# Check file permissions
ls -la /var/www/dashboard/

# Fix permissions
sudo chown -R www-data:www-data /var/www/dashboard
sudo chmod -R 755 /var/www/dashboard
```

## Security Notes

- This dashboard is designed for home network use only
- API keys are stored in client-side JavaScript
- Consider server-side implementation for production use
- Keep your API keys secure and don't share them

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
Used to serve info from a tablet mounted on my wall
