// Use centralized configuration from config.js
// CONFIG is already defined in config.js, so we just reference it

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initializing...');
    console.log('iOS 12 Compatibility:', window.ios12Compatibility);
    console.log('Is iOS 12:', window.isIOS12);
    
    updateDateTime();
    setInterval(updateDateTime, 1000); // Update every second
    
    // Load data with error handling
    console.log('Loading weather data...');
    loadWeatherData();
    console.log('Loading calendar data...');
    loadCalendarData();
    console.log('Loading tasks data...');
    loadTasksData();
});

// Store Google token with refresh capability
async function storeGoogleToken(tokenResponse) {
    try {
        const tokenWithExpiry = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_in: tokenResponse.expires_in,
            token_type: tokenResponse.token_type,
            scope: tokenResponse.scope,
            expires_at: (Date.now() / 1000) + (tokenResponse.expires_in || 3600),
            stored_at: Date.now() / 1000
        };
        localStorage.setItem('google_access_token', JSON.stringify(tokenWithExpiry));
        
        // Set up automatic refresh 5 minutes before expiration
        scheduleTokenRefresh(tokenWithExpiry);
    } catch (error) {
        console.error('Error storing Google token:', error);
    }
}

// Schedule automatic token refresh
function scheduleTokenRefresh(token) {
    if (token.expires_at) {
        const refreshTime = (token.expires_at - 300) * 1000; // 5 minutes before expiration
        const now = Date.now();
        
        if (refreshTime > now) {
            const timeUntilRefresh = refreshTime - now;
            console.log('Token refresh scheduled in ' + Math.round(timeUntilRefresh / 1000) + ' seconds');
            
            setTimeout(function() {
                refreshGoogleToken();
            }, timeUntilRefresh);
        }
    }
}

// Refresh Google token automatically
async function refreshGoogleToken() {
    try {
        const storedToken = localStorage.getItem('google_access_token');
        if (!storedToken) {
            console.log('No stored token to refresh');
            return false;
        }
        
        const token = JSON.parse(storedToken);
        
        // Check if we have a refresh token
        if (!token.refresh_token) {
            console.log('No refresh token available, user needs to sign in again');
            localStorage.removeItem('google_access_token');
            updateSignOutButton(false);
            return false;
        }
        
        console.log('Refreshing Google token...');
        
        // Use the refresh token to get a new access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CONFIG.GOOGLE.CLIENT_ID,
                refresh_token: token.refresh_token,
                grant_type: 'refresh_token'
            })
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed: ' + response.status);
        }
        
        const newToken = await response.json();
        
        // Store the new token (preserving the refresh token)
        const updatedToken = {
            access_token: newToken.access_token,
            refresh_token: token.refresh_token, // Preserve the refresh token
            expires_in: newToken.expires_in,
            token_type: newToken.token_type,
            scope: newToken.scope,
            expires_at: (Date.now() / 1000) + (newToken.expires_in || 3600),
            stored_at: Date.now() / 1000
        };
        
        localStorage.setItem('google_access_token', JSON.stringify(updatedToken));
        
        // Set the new token
        if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken(newToken);
        }
        
        // Schedule the next refresh
        scheduleTokenRefresh(updatedToken);
        
        console.log('Token refreshed successfully');
        return true;
        
    } catch (error) {
        console.error('Error refreshing Google token:', error);
        // If refresh fails, remove the token and require re-authentication
        localStorage.removeItem('google_access_token');
        updateSignOutButton(false);
        return false;
    }
}

// Restore Google token from localStorage
async function restoreGoogleToken() {
    try {
        console.log('Attempting to restore Google token...');
        const storedToken = localStorage.getItem('google_access_token');
        console.log('Stored token found:', !!storedToken);
        
        if (storedToken) {
            const token = JSON.parse(storedToken);
            console.log('Token data:', {
                hasAccessToken: !!token.access_token,
                hasRefreshToken: !!token.refresh_token,
                expiresAt: token.expires_at,
                currentTime: Date.now() / 1000
            });
            
            // Check if token is still valid (not expired)
            if (token.expires_in && token.expires_at) {
                const now = Date.now() / 1000;
                if (now < token.expires_at) {
                    console.log('Token is still valid, setting it');
                    // Token is still valid, set it
                    if (window.gapi && window.gapi.client) {
                        window.gapi.client.setToken(token);
                    }
                    updateSignOutButton(true);
                    
                    // Schedule automatic refresh
                    scheduleTokenRefresh(token);
                    return;
                } else {
                    // Token is expired, try to refresh it
                    console.log('Token expired, attempting refresh...');
                    const refreshed = await refreshGoogleToken();
                    if (refreshed) {
                        updateSignOutButton(true);
                        return;
                    }
                }
            }
            
            // Token is expired and couldn't be refreshed, remove it
            console.log('Removing expired token');
            localStorage.removeItem('google_access_token');
        }
        console.log('No valid token found, showing sign-in prompt');
        updateSignOutButton(false);
    } catch (error) {
        console.error('Error restoring Google token:', error);
        localStorage.removeItem('google_access_token');
        updateSignOutButton(false);
    }
}

// Update sign-out button visibility
function updateSignOutButton(isSignedIn) {
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.style.display = isSignedIn ? 'inline-flex' : 'none';
    }
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles' // Pacific Time
    };
    
    const dateTimeString = now.toLocaleString('en-US', options);
    document.getElementById('datetime').textContent = dateTimeString;
}

// Weather API integration
async function loadWeatherData() {
    console.log('loadWeatherData called');
    const weatherElement = document.getElementById('weather-info');
    
    try {
        console.log('Weather API Key:', CONFIG.WEATHER.API_KEY);
        console.log('Weather City:', CONFIG.WEATHER.CITY);
        console.log('Weather Units:', CONFIG.WEATHER.UNITS);
        
        if (CONFIG.WEATHER.API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
            weatherElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Please configure your OpenWeatherMap API key in config.js</p>
                    <p><a href="https://openweathermap.org/api" target="_blank">Get your free API key here</a></p>
                </div>
            `;
            return;
        }
        
        const weatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + CONFIG.WEATHER.CITY + '&appid=' + CONFIG.WEATHER.API_KEY + '&units=' + CONFIG.WEATHER.UNITS;
        console.log('Weather URL:', weatherUrl);
        
        console.log('Making weather API request...');
        const response = await fetch(weatherUrl);
        console.log('Weather API response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Weather API error: ' + response.status + ' ' + response.statusText);
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        displayWeather(data);
        
    } catch (error) {
        console.error('Weather loading error:', error);
        weatherElement.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load weather data</p>
                <p>Error: ${error.message}</p>
                <p>Check console for details</p>
            </div>
        `;
    }
}

function displayWeather(data) {
    const weatherElement = document.getElementById('weather-info');
    
    const weatherIcon = getWeatherIcon(data.weather[0].icon);
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    
    // Convert wind speed based on units
    let windSpeed, windUnit;
    if (CONFIG.WEATHER.UNITS === 'imperial') {
        windSpeed = Math.round(data.wind.speed * 2.237); // Convert m/s to mph
        windUnit = 'mph';
    } else {
        windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
        windUnit = 'km/h';
    }
    
    const windDirection = data.wind.deg; // Wind direction in degrees
    const windDirectionText = getWindDirection(windDirection);
    
    // Get the correct temperature unit based on config
    const tempUnit = CONFIG.WEATHER.UNITS === 'imperial' ? '°F' : '°C';
    
    weatherElement.innerHTML = `
        <div class="weather-main">
            <div class="weather-icon">${weatherIcon}</div>
            <div class="weather-temp">${temp}${tempUnit}</div>
        </div>
        <div class="weather-desc">${data.weather[0].description}</div>
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">Feels like</div>
                <div class="weather-detail-value">${feelsLike}${tempUnit}</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Humidity</div>
                <div class="weather-detail-value">${humidity}%</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Wind</div>
                <div class="weather-detail-value">${windSpeed} ${windUnit} ${windDirectionText}</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Location</div>
                <div class="weather-detail-value">${data.name}</div>
            </div>
        </div>
    `;
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
}

function getWindDirection(degrees) {
    if (degrees === undefined || degrees === null) {
        return '';
    }
    
    const directions = [
        'N', 'NNE', 'NE', 'ENE',
        'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW',
        'W', 'WNW', 'NW', 'NNW'
    ];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Google Calendar integration
async function loadCalendarData() {
    console.log('loadCalendarData called');
    const calendarElement = document.getElementById('calendar-info');
    
    try {
        console.log('Google Client ID:', CONFIG.GOOGLE.CLIENT_ID);
        
        if (CONFIG.GOOGLE.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            calendarElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Please configure your Google API credentials in config.js</p>
                    <p><a href="https://console.developers.google.com/" target="_blank">Set up Google APIs here</a></p>
                </div>
            `;
            return;
        }
        
        console.log('Checking Google API availability...');
        // Check if user is authenticated
        if (!window.gapi || !window.gapi.client) {
            console.log('Google API not loaded, loading now...');
            await loadGoogleAPI();
        }
        
        console.log('Checking authentication status...');
        // Check if user is signed in
        if (!window.gapi.client.getToken()) {
            console.log('No authentication token found');
            calendarElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-sign-in-alt"></i>
                    <p>Please sign in to Google to view your calendar</p>
                    <button onclick="signInToGoogle()" class="nav-button" style="margin-top: 10px;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </div>
            `;
            return;
        }
        
        console.log('Authentication token found, loading calendar events...');
        const events = await getCalendarEvents();
        console.log('Calendar events loaded:', events.length);
        displayCalendarEvents(events);
        
    } catch (error) {
        console.error('Calendar loading error:', error);
        calendarElement.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load calendar data</p>
                <p>Error: ${error.message}</p>
                <p>Check console for details</p>
            </div>
        `;
    }
}

async function loadGoogleAPI() {
    return new Promise(function(resolve, reject) {
        if (window.gapi && window.gapi.client) {
            // API already loaded, restore token if available
            restoreGoogleToken();
            resolve();
            return;
        }
        
        // Load Google API
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = function() {
            window.gapi.load('client', function() {
                window.gapi.client.init({
                    apiKey: CONFIG.GOOGLE.API_KEY,
                    discoveryDocs: [
                        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
                        'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'
                    ]
                }).then(function() {
                    // Restore token after API is initialized
                    restoreGoogleToken();
                    resolve();
                }).catch(reject);
            });
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function signInToGoogle() {
    try {
        console.log('Sign-in initiated');
        console.log('iOS 12 detected:', window.isIOS12);
        
        // iOS 12 has issues with popup-based OAuth, so we'll use a different approach
        if (window.isIOS12) {
            console.log('Using iOS 12 OAuth redirect flow');
            
            // For iOS 12, redirect to Google OAuth instead of using popup
            const authUrl = 'https://accounts.google.com/oauth/authorize?' + 
                'client_id=' + encodeURIComponent(CONFIG.GOOGLE.CLIENT_ID) +
                '&redirect_uri=' + encodeURIComponent('http://homeinfopage.codycardbadger.com/oauth-callback.html') +
                '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly') +
                '&response_type=token' +
                '&access_type=offline' +
                '&prompt=consent';
            
            console.log('OAuth URL:', authUrl);
            
            // Store the current page URL to return to after OAuth
            localStorage.setItem('oauth_return_url', window.location.href);
            
            // Redirect to Google OAuth
            window.location.href = authUrl;
            return;
        }
        
        // Use Google Identity Services for authentication with offline access (modern browsers)
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.GOOGLE.CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly',
            prompt: 'consent', // Force consent to get refresh token
            callback: async function(response) {
                if (response.error) {
                    console.error('Sign-in error:', response.error);
                    return;
                }
                
                // Store the initial token
                await storeGoogleToken(response);
                
                // Set the access token
                window.gapi.client.setToken(response);
                
                // Show sign-out button
                updateSignOutButton(true);
                
                // Reload data
                loadCalendarData();
                loadTasksData();
            }
        });
        
        tokenClient.requestAccessToken();
    } catch (error) {
        console.error('Sign-in error:', error);
    }
}

// Function to list all available calendars (for debugging)
async function listAvailableCalendars() {
    try {
        const response = await window.gapi.client.calendar.calendarList.list();
        const calendars = response.result.items || [];
        console.log('Available calendars:');
        calendars.forEach(function(calendar) {
            console.log('- "' + calendar.summary + '" (ID: ' + calendar.id + ')');
        });
        return calendars;
    } catch (error) {
        console.error('Failed to list calendars:', error);
        return [];
    }
}

async function getCalendarEvents() {
    const now = new Date();
    // Set start time to beginning of today (midnight) to avoid past events
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Set end time to 30 days from now
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // First, let's see what calendars are actually available
    const availableCalendars = await listAvailableCalendars();
    
    // List of all your calendars - using the actual calendar IDs from your account
    const calendarIds = [
        'cody.badger@gmail.com', // Cody calendar (your primary account)
        'codycardbadger@gmail.com', // CCB calendar (your secondary account)
        'lavelle.m@gmail.com', // Megan's Calendar (your wife)
        '3pa8lu86n100l5k4gqhc2jduts@group.calendar.google.com', // Catfish Daily Schedule (your daughter)
        'c6ke915e450f29hrc8lt5tp04c@group.calendar.google.com', // Trips
        'en.usa#holiday@group.v.calendar.google.com' // Holidays in United States
    ];
    
    // Fetch events from all calendars
    const allEvents = [];
    
    // Use iOS 12 compatible async iteration
    if (window.isIOS12 && window.asyncForEach) {
        await window.asyncForEach(calendarIds, async function(calendarId) {
            try {
                const response = await window.gapi.client.calendar.events.list({
                    calendarId: calendarId,
                    timeMin: startOfToday.toISOString(),
                    timeMax: thirtyDaysFromNow.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime'
                });
                
                const events = response.result.items || [];
                console.log('Successfully loaded ' + events.length + ' events from calendar: ' + calendarId);
                
                // Add calendar name and color to each event for identification
                // Filter out birthday events
                const filteredEvents = events.filter(function(event) {
                    const title = (event.summary || '').toLowerCase();
                    const isBirthday = title.includes('birthday') || 
                                      title.includes('anniversary') ||
                                      title.includes('bday') ||
                                      title.includes('birth') ||
                                      title.includes('turns') ||
                                      title.includes('years old');
                    
                    if (isBirthday) {
                        console.log('Filtered out birthday event: "' + event.summary + '" from calendar: ' + calendarId);
                    }
                    
                    return !isBirthday;
                });
                
                filteredEvents.forEach(function(event) {
                    event.calendarName = getCalendarDisplayName(calendarId);
                    event.calendarColor = getCalendarColor(calendarId);
                });
                
                allEvents.push.apply(allEvents, filteredEvents);
            } catch (error) {
                console.error(`Failed to load events from calendar ${calendarId}:`, error);
                // Try to get more specific error information
                if (error.status === 404) {
                    console.error(`Calendar "${calendarId}" not found. Check the calendar ID.`);
                } else if (error.status === 403) {
                    console.error(`Access denied to calendar "${calendarId}". Check permissions.`);
                }
            }
        });
    } else {
        // Modern browsers can use for...of
        for (const calendarId of calendarIds) {
            try {
                const response = await window.gapi.client.calendar.events.list({
                    calendarId: calendarId,
                    timeMin: startOfToday.toISOString(),
                    timeMax: thirtyDaysFromNow.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime'
                });
                
                const events = response.result.items || [];
                console.log('Successfully loaded ' + events.length + ' events from calendar: ' + calendarId);
                
                // Add calendar name and color to each event for identification
                // Filter out birthday events
                const filteredEvents = events.filter(function(event) {
                    const title = (event.summary || '').toLowerCase();
                    const isBirthday = title.includes('birthday') || 
                                      title.includes('anniversary') ||
                                      title.includes('bday') ||
                                      title.includes('birth') ||
                                      title.includes('turns') ||
                                      title.includes('years old');
                    
                    if (isBirthday) {
                        console.log('Filtered out birthday event: "' + event.summary + '" from calendar: ' + calendarId);
                    }
                    
                    return !isBirthday;
                });
                
                filteredEvents.forEach(function(event) {
                    event.calendarName = getCalendarDisplayName(calendarId);
                    event.calendarColor = getCalendarColor(calendarId);
                });
                
                allEvents.push.apply(allEvents, filteredEvents);
            } catch (error) {
                console.error(`Failed to load events from calendar ${calendarId}:`, error);
                // Try to get more specific error information
                if (error.status === 404) {
                    console.error(`Calendar "${calendarId}" not found. Check the calendar ID.`);
                } else if (error.status === 403) {
                    console.error(`Access denied to calendar "${calendarId}". Check permissions.`);
                }
            }
        }
    }
    
    // Sort all events by start time
    allEvents.sort(function(a, b) {
        // Handle both dateTime (with time) and date (all-day) events consistently
        let timeA, timeB;
        
        if (a.start.dateTime) {
            timeA = new Date(a.start.dateTime);
        } else {
            // For all-day events, add time to ensure consistent timezone interpretation
            timeA = new Date(a.start.date + 'T00:00:00');
        }
        
        if (b.start.dateTime) {
            timeB = new Date(b.start.dateTime);
        } else {
            // For all-day events, add time to ensure consistent timezone interpretation
            timeB = new Date(b.start.date + 'T00:00:00');
        }
        
        return timeA - timeB;
    });
    
    return allEvents;
}

function getCalendarDisplayName(calendarId) {
    const displayNames = {
        'cody.badger@gmail.com': 'Cody',
        'codycardbadger@gmail.com': 'CCB',
        'lavelle.m@gmail.com': 'Megan',
        '3pa8lu86n100l5k4gqhc2jduts@group.calendar.google.com': 'Catfish',
        'c6ke915e450f29hrc8lt5tp04c@group.calendar.google.com': 'Trips',
        'en.usa#holiday@group.v.calendar.google.com': 'Holidays'
    };
    return displayNames[calendarId] || calendarId;
}

function getCalendarColor(calendarId) {
    const colors = {
        'cody.badger@gmail.com': '#27ae60', // Cody - Green
        'codycardbadger@gmail.com': '#3498db', // CCB - Blue
        'lavelle.m@gmail.com': '#d4ac0d', // Megan - Darker Yellow
        '3pa8lu86n100l5k4gqhc2jduts@group.calendar.google.com': '#e91e63', // Catfish - Pink
        'c6ke915e450f29hrc8lt5tp04c@group.calendar.google.com': '#e74c3c', // Trips - Red
        'en.usa#holiday@group.v.calendar.google.com': '#9b59b6' // Holidays - Purple
    };
    return colors[calendarId] || '#3498db'; // Default blue
}

function displayCalendarEvents(events) {
    const calendarElement = document.getElementById('calendar-info');
    
    if (events.length === 0) {
        calendarElement.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-check"></i>
                <p>No events scheduled for the next 30 days</p>
            </div>
        `;
        return;
    }
    
    // Expand multi-day events into separate entries for each day
    const expandedEvents = [];
    
    events.forEach(function(event) {
        let startDate, endDate;
        
        if (event.start.dateTime) {
            // Timed event
            startDate = new Date(event.start.dateTime);
            endDate = event.end.dateTime ? new Date(event.end.dateTime) : startDate;
        } else {
            // All-day event
            startDate = new Date(event.start.date + 'T00:00:00');
            endDate = event.end.date ? new Date(event.end.date + 'T00:00:00') : startDate;
        }
        
        // Calculate the number of days this event spans
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Create an entry for each day of the event, but only for current and future days
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        for (let i = 0; i < daysDiff; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            currentDate.setHours(0, 0, 0, 0); // Start of this day
            
            // Only include this day if it's today or in the future
            if (currentDate >= today) {
                // Create a copy of the event for this day
                const dayEvent = {
                    id: event.id,
                    summary: event.summary,
                    description: event.description,
                    start: {
                        dateTime: event.start.dateTime ? new Date(currentDate.getTime() + (startDate.getHours() * 60 + startDate.getMinutes()) * 60000).toISOString() : undefined,
                        date: event.start.dateTime ? undefined : currentDate.toISOString().split('T')[0]
                    },
                    end: event.end,
                    calendarName: event.calendarName,
                    calendarColor: event.calendarColor
                };
                
                expandedEvents.push(dayEvent);
            }
        }
    });
    
    // Sort the expanded events by date/time
    expandedEvents.sort(function(a, b) {
        let timeA, timeB;
        
        if (a.start.dateTime) {
            timeA = new Date(a.start.dateTime);
        } else {
            timeA = new Date(a.start.date + 'T00:00:00');
        }
        
        if (b.start.dateTime) {
            timeB = new Date(b.start.dateTime);
        } else {
            timeB = new Date(b.start.date + 'T00:00:00');
        }
        
        return timeA - timeB;
    });
    
    // Filter out duplicate events with priority: Cody > CCB > Megan
    const deduplicatedEvents = [];
    const seenEvents = new Map(); // key: "date+time+title", value: calendar priority
    
    // Define calendar priority (lower number = higher priority)
    const calendarPriority = {
        'cody.badger@gmail.com': 1, // Cody - highest priority
        'codycardbadger@gmail.com': 2, // CCB - second priority
        'lavelle.m@gmail.com': 3, // Megan - third priority
        '3pa8lu86n100l5k4gqhc2jduts@group.calendar.google.com': 4, // Catfish
        'c6ke915e450f29hrc8lt5tp04c@group.calendar.google.com': 5, // Trips
        'en.usa#holiday@group.v.calendar.google.com': 6 // Holidays
    };
    
    expandedEvents.forEach(function(event) {
        // Create a unique key for this event based on date, time, and title
        let eventKey;
        if (event.start.dateTime) {
            const eventDate = new Date(event.start.dateTime);
            eventKey = eventDate.toDateString() + '_' + eventDate.toTimeString() + '_' + event.summary;
        } else {
            const eventDate = new Date(event.start.date + 'T00:00:00');
            eventKey = eventDate.toDateString() + '_allday_' + event.summary;
        }
        
        const currentPriority = calendarPriority[event.calendarId] || 999;
        const existingPriority = seenEvents.get(eventKey);
        
        if (!existingPriority || currentPriority < existingPriority) {
            // This is a new event or has higher priority than existing
            seenEvents.set(eventKey, currentPriority);
            
            // Remove any existing event with this key from deduplicatedEvents
            const existingIndex = deduplicatedEvents.findIndex(function(e) {
                let existingKey;
                if (e.start.dateTime) {
                    const existingDate = new Date(e.start.dateTime);
                    existingKey = existingDate.toDateString() + '_' + existingDate.toTimeString() + '_' + e.summary;
                } else {
                    const existingDate = new Date(e.start.date + 'T00:00:00');
                    existingKey = existingDate.toDateString() + '_allday_' + e.summary;
                }
                return existingKey === eventKey;
            });
            
            if (existingIndex !== -1) {
                deduplicatedEvents.splice(existingIndex, 1);
            }
            
            deduplicatedEvents.push(event);
        }
    });
    
    const eventsHtml = deduplicatedEvents.map(function(event) {
        // Handle both dateTime (with time) and date (all-day) events
        let start, timeString, dayOfWeek, dateString;
        
        if (event.start.dateTime) {
            // Event with specific time
            start = new Date(event.start.dateTime);
            timeString = start.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'America/Los_Angeles' // Pacific Time
            });
        } else {
            // All-day event
            start = new Date(event.start.date + 'T00:00:00'); // Add time to avoid timezone issues
            timeString = 'All day';
        }
        
        // Get day of the week and date in Pacific Time
        dayOfWeek = start.toLocaleDateString('en-US', { 
            weekday: 'short',
            timeZone: 'America/Los_Angeles'
        });
        dateString = start.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            timeZone: 'America/Los_Angeles'
        });
        
        return `
            <div class="calendar-event">
                <div class="event-details">
                    <span class="event-date-time">${dayOfWeek} ${dateString} • ${timeString}</span> • 
                    <span class="event-calendar" style="color: ${event.calendarColor}; font-weight: 600;">${event.calendarName}</span> • 
                    <span class="event-title">${event.summary || 'No title'}</span>
                </div>
            </div>
        `;
    }).join('');
    
    calendarElement.innerHTML = eventsHtml;
}

// Tasks integration (Todoist or Google Tasks)
async function loadTasksData() {
    console.log('loadTasksData called');
    const tasksElement = document.getElementById('tasks-info');
    
    try {
        console.log('Todoist API Token:', CONFIG.TODOIST.API_TOKEN ? 'Configured' : 'Not configured');
        console.log('Google Tasks Enabled:', CONFIG.GOOGLE_TASKS.ENABLED);
        
        // Check if Todoist is configured
        if (CONFIG.TODOIST.API_TOKEN !== 'YOUR_TODOIST_API_TOKEN') {
            console.log('Using Todoist API...');
            const tasks = await getTodoistTasks();
            console.log('Todoist tasks loaded:', tasks.length);
            displayTasks(tasks);
            return;
        }
        
        // Fallback to Google Tasks if enabled
        if (CONFIG.GOOGLE_TASKS.ENABLED) {
            console.log('Using Google Tasks API...');
            // Check if user is authenticated
            if (!window.gapi || !window.gapi.client) {
                console.log('Google API not loaded for tasks, loading now...');
                await loadGoogleAPI();
            }
            
            // Check if user is signed in
            if (!window.gapi.client.getToken()) {
                console.log('No authentication token for tasks');
                tasksElement.innerHTML = `
                    <div class="error">
                        <i class="fas fa-sign-in-alt"></i>
                        <p>Please sign in to Google to view your tasks</p>
                    </div>
                `;
                return;
            }
            
            console.log('Loading Google tasks...');
            const tasks = await getGoogleTasks();
            console.log('Google tasks loaded:', tasks.length);
            displayTasks(tasks);
            return;
        }
        
        // No tasks service configured
        console.log('No tasks service configured');
        tasksElement.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Please configure a tasks service in config.js</p>
                <p><a href="https://todoist.com/prefs/integrations" target="_blank">Get Todoist API token</a></p>
            </div>
        `;
        
    } catch (error) {
        console.error('Tasks loading error:', error);
        tasksElement.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load tasks data</p>
                <p>Error: ${error.message}</p>
                <p>Check console for details</p>
            </div>
        `;
    }
}

async function getTodoistTasks() {
    try {
        const url = CONFIG.TODOIST.PROJECT_ID 
            ? CONFIG.TODOIST.API_URL + 'tasks?project_id=' + CONFIG.TODOIST.PROJECT_ID
            : CONFIG.TODOIST.API_URL + 'tasks';
            
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + CONFIG.TODOIST.API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Todoist API error: ' + response.status);
        }
        
        const data = await response.json();
        
        // Filter out completed tasks and return only active ones
        return data.filter(function(task) { return !task.completed; });
    } catch (error) {
        console.error('Error getting tasks from Todoist:', error);
        throw error;
    }
}

async function getGoogleTasks() {
    try {
        // First, try to get the default task list
        let tasklistId = CONFIG.GOOGLE_TASKS.LIST_ID;
        
        // If using 'primary', try to get the actual task list ID
        if (tasklistId === 'primary') {
            const listsResponse = await window.gapi.client.tasks.tasklists.list();
            const taskLists = listsResponse.result.items || [];
            
            if (taskLists.length > 0) {
                // Use the first available task list
                tasklistId = taskLists[0].id;
            } else {
                throw new Error('No task lists found');
            }
        }
        
        const response = await window.gapi.client.tasks.tasks.list({
            tasklist: tasklistId,
            showCompleted: false,
            showHidden: false
        });
        
        return response.result.items || [];
    } catch (error) {
        console.error('Error getting Google tasks:', error);
        throw error;
    }
}

function displayTasks(tasks) {
    const tasksElement = document.getElementById('tasks-info');
    
    if (tasks.length === 0) {
        tasksElement.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-check-circle"></i>
                <p>No pending tasks</p>
            </div>
        `;
        return;
    }
    
    const tasksHtml = tasks.map(function(task) {
        // Handle different task formats (Todoist vs Google Tasks)
        const title = task.content || task.title || task.name;
        const dueDate = (task.due && task.due.date) || task.dueDate || task.due;
        const isCompleted = task.completed || task.status === 'completed';
        const priority = task.priority || 0;
        
        // Format due date
        let dueDateFormatted = '';
        if (dueDate) {
            try {
                dueDateFormatted = new Date(dueDate).toLocaleDateString();
            } catch (e) {
                dueDateFormatted = dueDate;
            }
        }
        
        // Add priority indicator (Todoist uses 1-4, Google uses 0-1)
        let priorityIcon = '';
        if (priority > 2) {
            priorityIcon = '<i class="fas fa-exclamation-circle" style="color: #ff6b6b;"></i> ';
        } else if (priority === 2) {
            priorityIcon = '<i class="fas fa-exclamation-triangle" style="color: #ffa500;"></i> ';
        }
        
        return `
            <div class="task-item">
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} disabled>
                <span class="task-text ${isCompleted ? 'task-completed' : ''}">${priorityIcon}${title}</span>
                ${dueDateFormatted ? `<span class="task-due">Due: ${dueDateFormatted}</span>` : ''}
            </div>
        `;
    }).join('');
    
    tasksElement.innerHTML = tasksHtml;
}

// Utility function to refresh all data
function refreshAllData() {
    loadWeatherData();
    loadCalendarData();
    loadTasksData();
}

// Sign out function to clear stored token
function signOutFromGoogle() {
    localStorage.removeItem('google_access_token');
    if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null);
    }
    
    // Revoke the refresh token if available
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
        try {
            const token = JSON.parse(storedToken);
            if (token.refresh_token) {
                // Revoke the refresh token
                fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        token: token.refresh_token
                    })
                }).catch(function(error) {
                    console.error('Error revoking refresh token:', error);
                });
            }
        } catch (error) {
            console.error('Error parsing token for revocation:', error);
        }
    }
    
    // Reload the page to show sign-in prompts
    window.location.reload();
}

// Auto-refresh data every 5 minutes
setInterval(refreshAllData, 5 * 60 * 1000);
