# Home Information Dashboard Setup Guide

This guide will help you set up your home information dashboard on your Raspberry Pi 3 B+.

## Prerequisites

- Raspberry Pi 3 B+ with Raspberry Pi OS
- 128GB SD card (as you have)
- Internet connection
- Google account
- OpenWeatherMap account (free)

## Step 1: Set Up Your Raspberry Pi

### 1.1 Update your system
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install a web server
```bash
sudo apt install nginx -y
```

### 1.3 Start and enable nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.4 Configure nginx for your dashboard
```bash
sudo nano /etc/nginx/sites-available/dashboard
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name _;
    root /var/www/dashboard;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Enable CORS for API calls
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
}
```

### 1.5 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 1.6 Create the dashboard directory
```bash
sudo mkdir -p /var/www/dashboard
sudo chown -R www-data:www-data /var/www/dashboard
```

## Step 2: Get API Keys

### 2.1 OpenWeatherMap API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to "My API keys" in your account
4. Copy your API key

### 2.2 Google APIs Setup
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Tasks API
   - Google Sheets API
4. Go to "Credentials" and create:
   - OAuth 2.0 Client ID (for web application)
   - API Key
5. For OAuth 2.0, add your Raspberry Pi's IP address to authorized origins:
   - `http://YOUR_PI_IP_ADDRESS`
   - `http://localhost`

## Step 3: Configure Your Dashboard

### 3.1 Copy files to your Pi
Copy all the HTML, CSS, and JavaScript files to `/var/www/dashboard/` on your Raspberry Pi.

### 3.2 Create your configuration
```bash
sudo nano /var/www/dashboard/config.js
```

Copy the contents from the provided `config.js` file and fill in your API keys:

```javascript
const CONFIG = {
    WEATHER: {
        API_KEY: 'your_openweather_api_key_here',
        CITY: 'Your City,Country', // e.g., 'London,UK'
        UNITS: 'metric'
    },
    
    GOOGLE: {
        CLIENT_ID: 'your_google_client_id_here',
        API_KEY: 'your_google_api_key_here',
        CALENDAR_ID: 'primary',
        TASKS_LIST_ID: 'primary',
        SHEETS: {
            SPREADSHEET_ID: 'your_spreadsheet_id_here',
            RANGE: 'Sheet1!A:Z',
            USE_HEADERS: true,
            MAX_ROWS: 100
        }
    },
    
    DISPLAY: {
        REFRESH_INTERVAL: 5 * 60 * 1000,
        SHEETS_REFRESH_INTERVAL: 10 * 60 * 1000,
        TIMEZONE: 'auto'
    }
};

window.CONFIG = CONFIG;
```

### 3.3 Update script.js to use the config
Modify the `script.js` file to use the centralized config:

```javascript
// Replace the CONFIG object at the top with:
// const CONFIG = window.CONFIG || { ... };
```

## Step 4: Set Up Your Google Services

### 4.1 Google Calendar
- Make sure your calendar events are visible
- The dashboard will show events for the next 7 days

### 4.2 Google Tasks
- Create tasks in Google Tasks
- The dashboard will show incomplete tasks

### 4.3 Google Sheets
1. Create a Google Sheet with your data
2. Share it with your Google account (make it viewable)
3. Copy the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part

## Step 5: Access Your Dashboard

### 5.1 Find your Pi's IP address
```bash
hostname -I
```

### 5.2 Access from any device on your network
Open a web browser and go to:
```
http://YOUR_PI_IP_ADDRESS
```

### 5.3 First-time Google sign-in
- Click "Sign In" when prompted
- Authorize the dashboard to access your Google services
- Your data should now appear on the dashboard

## Step 6: Optional Enhancements

### 6.1 Set up a static IP (recommended)
```bash
sudo nano /etc/dhcpcd.conf
```

Add at the bottom:
```
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1
```

Replace with your network settings.

### 6.2 Set up SSL (optional)
You can set up Let's Encrypt SSL for secure access:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 6.3 Auto-start on boot
The nginx service should already start automatically, but you can verify:
```bash
sudo systemctl is-enabled nginx
```

## Troubleshooting

### Common Issues:

1. **Weather not loading**: Check your OpenWeatherMap API key and city name
2. **Google services not working**: Verify your Google API credentials and OAuth setup
3. **Sheets data not showing**: Check your spreadsheet ID and sharing permissions
4. **Page not loading**: Check nginx status with `sudo systemctl status nginx`

### Logs:
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Firewall (if needed):
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## Security Notes

- This dashboard is designed for home network use only
- API keys are stored in client-side JavaScript (consider server-side implementation for production)
- The dashboard uses HTTPS for Google API calls
- Consider setting up a reverse proxy for additional security

## Maintenance

- The dashboard auto-refreshes data every 5 minutes
- Google Sheets data refreshes every 10 minutes
- Monitor your API usage to stay within free tier limits
- Keep your Raspberry Pi updated regularly

Enjoy your new home information dashboard!

