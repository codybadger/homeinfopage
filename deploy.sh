#!/bin/bash

# Home Information Dashboard Deployment Script for Raspberry Pi
# Run this script on your Raspberry Pi to set up the dashboard

echo "🏠 Home Information Dashboard Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Run as a regular user."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install nginx
echo "🌐 Installing nginx web server..."
sudo apt install nginx -y

# Create dashboard directory
echo "📁 Creating dashboard directory..."
sudo mkdir -p /var/www/dashboard
sudo chown -R www-data:www-data /var/www/dashboard

# Copy files to dashboard directory
echo "📋 Copying dashboard files..."
sudo cp *.html *.css *.js /var/www/dashboard/ 2>/dev/null || {
    echo "⚠️  Please make sure you're in the directory containing the dashboard files"
    echo "   and run this script from there."
    exit 1
}

# Set proper permissions
sudo chown -R www-data:www-data /var/www/dashboard
sudo chmod -R 755 /var/www/dashboard

# Create nginx configuration
echo "⚙️  Configuring nginx..."
sudo tee /etc/nginx/sites-available/dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    root /var/www/dashboard;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
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
EOF

# Enable the site
echo "🔗 Enabling dashboard site..."
sudo ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    # Enable nginx to start on boot
    sudo systemctl enable nginx
    
    # Get IP address
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "🎉 Dashboard setup complete!"
    echo "=========================="
    echo "Your dashboard is now available at:"
    echo "  http://$IP_ADDRESS"
    echo ""
    echo "Next steps:"
    echo "1. Open http://$IP_ADDRESS in your browser"
    echo "2. Configure your API keys in /var/www/dashboard/config.js"
    echo "3. Follow the setup guide for API configuration"
    echo ""
    echo "Configuration file location:"
    echo "  /var/www/dashboard/config.js"
    echo ""
    echo "To edit the configuration:"
    echo "  sudo nano /var/www/dashboard/config.js"
    echo ""
    
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration and try again"
    exit 1
fi

# Optional: Set up firewall
read -p "🔒 Would you like to configure the firewall? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛡️  Configuring firewall..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    sudo ufw --force enable
    echo "✅ Firewall configured"
fi

echo ""
echo "📚 For detailed setup instructions, see setup-guide.md"
echo "🐛 For troubleshooting, check nginx logs: sudo tail -f /var/log/nginx/error.log"

