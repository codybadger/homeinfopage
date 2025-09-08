// Configuration file for Home Information Dashboard
// Copy this file and rename it to config.js, then fill in your API keys and settings

const CONFIG = {
    // Weather API Configuration
    // Get your free API key from: https://openweathermap.org/api
    WEATHER: {
        API_KEY: 'YOUR_WEATHER_API_KEY',
        CITY: 'Twin Lakes,US', // e.g., 'London,UK' or 'New York,US'
        UNITS: 'imperial' // 'metric' for Celsius, 'imperial' for Fahrenheit
    },
    
    // Google APIs Configuration
    // Set up at: https://console.developers.google.com/
    GOOGLE: {
        CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
        API_KEY: 'YOUR_GOOGLE_API_KEY',
        
        // Calendar settings
        CALENDAR_ID: 'primary', // or your specific calendar ID
        
        // Sheets settings
        SHEETS: {
            SPREADSHEET_ID: 'YOUR_GOOGLE_SHEETS_ID',
            RANGE: 'Sheet1!A:Z', // Range to read from your sheet
            USE_HEADERS: true, // Whether first row contains headers
            MAX_ROWS: 100 // Maximum rows to display
        }
    },
    
    // Todoist API Configuration (Recommended)
    // Get your API token from: https://todoist.com/prefs/integrations
    TODOIST: {
        API_TOKEN: 'YOUR_TODOIST_API_TOKEN',
        API_URL: 'https://api.todoist.com/rest/v2/',
        PROJECT_ID: null // Leave null to get all tasks, or specify a project ID
    },
    
    // Google Tasks Configuration (Alternative)
    GOOGLE_TASKS: {
        ENABLED: false, // Set to true if you prefer Google Tasks
        LIST_ID: 'primary'
    },
    
    // Display settings
    DISPLAY: {
        REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
        SHEETS_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes in milliseconds
        TIMEZONE: 'auto' // 'auto' to use browser timezone, or specify like 'America/New_York'
    }
};

// Make config available globally
window.CONFIG = CONFIG;
