// Configuration file for Home Information Dashboard
// Copy this file and rename it to config.js, then fill in your API keys and settings

const CONFIG = {
    // Weather API Configuration
    // Get your free API key from: https://openweathermap.org/api
    WEATHER: {
        API_KEY: '5ea7febbcf72c4a026c3a4602f6e9df2',
        CITY: 'Twin Lakes,US', // e.g., 'London,UK' or 'New York,US'
        UNITS: 'imperial' // 'metric' for Celsius, 'imperial' for Fahrenheit
    },
    
    // Google APIs Configuration
    // Set up at: https://console.developers.google.com/
    GOOGLE: {
        CLIENT_ID: '849654326884-9qpjrjcrgostepshecbe2b4g7tpfj57l.apps.googleusercontent.com',
        API_KEY: 'AIzaSyCV1wtdqFe0mJIdA9C4QaVIFKFQGjUxYSU',
        
        // Calendar settings
        CALENDAR_ID: 'primary', // or your specific calendar ID
        
        // Sheets settings
        SHEETS: {
            SPREADSHEET_ID: '1EBw7W6lKfYx_VT3-hAZ5jvk3CR32dKXkAx6x-vCuESY',
            RANGE: 'Sheet1!A:Z', // Range to read from your sheet
            USE_HEADERS: true, // Whether first row contains headers
            MAX_ROWS: 100 // Maximum rows to display
        }
    },
    
    // Todoist API Configuration (Recommended)
    // Get your API token from: https://todoist.com/prefs/integrations
    TODOIST: {
        API_TOKEN: 'eef65c3c68f28efa33bbe62c755de0359a8db89a',
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
