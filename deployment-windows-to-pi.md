# Windows to Raspberry Pi Deployment Guide

This guide will help you deploy your home information dashboard from your Windows computer to your Raspberry Pi at `cody@192.168.44.63`.

## Prerequisites

- Windows computer with the dashboard files
- Raspberry Pi at `cody@192.168.44.63` with SSH access
- SSH client (Windows 10/11 has built-in SSH, or use PuTTY)

## Step 1: Prepare Your Raspberry Pi

### 1.1 Connect to your Pi via SSH
```bash
ssh cody@192.168.44.63
```

### 1.2 Update your Pi
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install nginx
```bash
sudo apt install nginx -y
```

### 1.4 Create dashboard directory
```bash
sudo mkdir -p /var/www/dashboard
sudo chown -R www-data:www-data /var/www/dashboard
```

### 1.5 Configure nginx
```bash
sudo nano /etc/nginx/sites-available/dashboard
```

Add this configuration:
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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### 1.6 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

## Step 2: Transfer Files from Windows to Pi

### Option A: Using SCP (Windows 10/11 built-in)
From your Windows command prompt or PowerShell, navigate to the directory containing your dashboard files and run:

```bash
# Transfer all dashboard files
scp *.html *.css *.js cody@192.168.44.63:/home/cody/dashboard/

# Then on the Pi, move them to the web directory
ssh cody@192.168.44.63
sudo cp /home/cody/dashboard/* /var/www/dashboard/
sudo chown -R www-data:www-data /var/www/dashboard
sudo chmod -R 755 /var/www/dashboard
```

### Option B: Using WinSCP (GUI tool)
1. Download and install [WinSCP](https://winscp.net/eng/download.php)
2. Connect to `cody@192.168.44.63`
3. Upload all your dashboard files to `/home/cody/dashboard/`
4. SSH into your Pi and move the files:
```bash
ssh cody@192.168.44.63
sudo cp /home/cody/dashboard/* /var/www/dashboard/
sudo chown -R www-data:www-data /var/www/dashboard
sudo chmod -R 755 /var/www/dashboard
```

### Option C: Using rsync (if available)
```bash
rsync -avz --progress *.html *.css *.js cody@192.168.44.63:/home/cody/dashboard/
```

## Step 3: Configure Your Dashboard

### 3.1 Edit the configuration file on your Pi
```bash
ssh cody@192.168.44.63
sudo nano /var/www/dashboard/config.js
```

### 3.2 Fill in your API keys
Replace the placeholder values with your actual API keys:

```javascript
const CONFIG = {
    WEATHER: {
        API_KEY: 'your_actual_openweather_api_key',
        CITY: 'Your City,Country', // e.g., 'London,UK'
        UNITS: 'metric'
    },
    
    GOOGLE: {
        CLIENT_ID: 'your_actual_google_client_id',
        API_KEY: 'your_actual_google_api_key',
        CALENDAR_ID: 'primary',
        TASKS_LIST_ID: 'primary',
        SHEETS: {
            SPREADSHEET_ID: 'your_actual_spreadsheet_id',
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

## Step 4: Test Your Dashboard

### 4.1 Access your dashboard
Open a web browser and go to:
```
http://192.168.44.63
```

### 4.2 Check nginx status
```bash
ssh cody@192.168.44.63
sudo systemctl status nginx
```

### 4.3 View logs if there are issues
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Step 5: Set Up API Keys

### 5.1 OpenWeatherMap API
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from "My API keys"
4. Update `config.js` with your key and city

### 5.2 Google APIs
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project
3. Enable these APIs:
   - Google Calendar API
   - Google Tasks API
   - Google Sheets API
4. Create OAuth 2.0 credentials and API key
5. Add `http://192.168.44.63` to authorized origins
6. Update `config.js` with your credentials

## Step 6: Optional Enhancements

### 6.1 Set up a static IP (recommended)
```bash
ssh cody@192.168.44.63
sudo nano /etc/dhcpcd.conf
```

Add at the bottom:
```
interface eth0
static ip_address=192.168.44.63/24
static routers=192.168.44.1
static domain_name_servers=192.168.44.1
```

### 6.2 Configure firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable
```

## Troubleshooting

### Common Issues:

1. **Can't access the dashboard**: Check if nginx is running and firewall is configured
2. **Files not updating**: Make sure you copied files to `/var/www/dashboard/` and set correct permissions
3. **API errors**: Verify your API keys are correct and APIs are enabled
4. **Google sign-in issues**: Check OAuth configuration and authorized origins

### Useful Commands:

```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Check file permissions
ls -la /var/www/dashboard/

# Fix permissions if needed
sudo chown -R www-data:www-data /var/www/dashboard
sudo chmod -R 755 /var/www/dashboard

# View nginx configuration
sudo nginx -t

# Check what's listening on port 80
sudo netstat -tlnp | grep :80
```

## File Structure on Pi

After deployment, your Pi should have this structure:
```
/var/www/dashboard/
├── index.html
├── sheets.html
├── styles.css
├── script.js
├── sheets-script.js
└── config.js
```

## Quick Update Process

When you make changes to your dashboard files on Windows:

1. Transfer updated files:
```bash
scp *.html *.css *.js cody@192.168.44.63:/home/cody/dashboard/
```

2. Update on Pi:
```bash
ssh cody@192.168.44.63
sudo cp /home/cody/dashboard/* /var/www/dashboard/
sudo chown -R www-data:www-data /var/www/dashboard
```

Your dashboard will be immediately updated!

## Security Notes

- This setup is for home network use only
- The dashboard is accessible to anyone on your network
- Consider setting up HTTPS for production use
- Keep your API keys secure and don't share them

Enjoy your new home information dashboard! 🏠

