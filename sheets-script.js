// Use centralized configuration
const SHEETS_CONFIG = window.CONFIG?.GOOGLE?.SHEETS || {
    SPREADSHEET_ID: '1EBw7W6lKfYx_VT3-hAZ5jvk3CR32dKXkAx6x-vCuESY',
    RANGE: 'Sheet1!A:Z',
    USE_HEADERS: true,
    MAX_ROWS: 100
};

// Initialize the sheets page
document.addEventListener('DOMContentLoaded', function() {
    loadSheetsData();
});

// Restore Google token from localStorage
async function restoreGoogleToken() {
    try {
        const storedToken = localStorage.getItem('google_access_token');
        if (storedToken) {
            const token = JSON.parse(storedToken);
            
            // Check if token is still valid (not expired)
            if (token.expires_in && token.expires_at) {
                const now = Date.now() / 1000;
                if (now < token.expires_at) {
                    // Token is still valid, set it
                    if (window.gapi && window.gapi.client) {
                        window.gapi.client.setToken(token);
                    }
                    return;
                }
            }
            
            // Token is expired, remove it
            localStorage.removeItem('google_access_token');
        }
    } catch (error) {
        console.error('Error restoring Google token:', error);
        localStorage.removeItem('google_access_token');
    }
}

// Load Google Sheets data
async function loadSheetsData() {
    const contentElement = document.getElementById('sheets-data-content');
    
    try {
        if (SHEETS_CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
            contentElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Please configure your credit card benefits spreadsheet ID</p>
                    <p>Find your spreadsheet ID in the URL: <code>https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit</code></p>
                </div>
            `;
            return;
        }
        
        // Check if Google API is loaded
        if (!window.gapi || !window.gapi.client) {
            await loadGoogleAPI();
        }
        
        // Check if user is signed in
        if (!window.gapi.client.getToken()) {
            contentElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-sign-in-alt"></i>
                    <p>Please sign in to Google to view your credit card benefits</p>
                    <button onclick="signInToGoogle()" class="nav-button" style="margin-top: 10px;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </div>
            `;
            return;
        }
        
        const data = await getSheetsData();
        displaySheetsData(data);
        
    } catch (error) {
        console.error('Sheets loading error:', error);
        contentElement.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load credit card benefits data</p>
                <p>${error.message}</p>
                <p>Make sure your spreadsheet is shared with your Google account and the API is enabled.</p>
            </div>
        `;
    }
}

async function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        if (window.gapi && window.gapi.client) {
            // API already loaded, restore token if available
            restoreGoogleToken();
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('client', () => {
                window.gapi.client.init({
                    apiKey: window.CONFIG?.GOOGLE?.API_KEY,
                    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
                }).then(() => {
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
        // Use Google Identity Services for authentication
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: window.CONFIG?.GOOGLE?.CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
            callback: (response) => {
                if (response.error) {
                    console.error('Sign-in error:', response.error);
                    return;
                }
                
                // Calculate expiration time and store the token in localStorage for persistence
                const tokenWithExpiry = {
                    ...response,
                    expires_at: (Date.now() / 1000) + (response.expires_in || 3600)
                };
                localStorage.setItem('google_access_token', JSON.stringify(tokenWithExpiry));
                
                // Set the access token
                window.gapi.client.setToken(response);
                
                // Reload sheets data
                loadSheetsData();
            }
        });
        
        tokenClient.requestAccessToken();
    } catch (error) {
        console.error('Sign-in error:', error);
    }
}

async function getSheetsData() {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.SPREADSHEET_ID,
        range: SHEETS_CONFIG.RANGE
    });
    
    return response.result.values || [];
}

function displaySheetsData(data) {
    const contentElement = document.getElementById('sheets-data-content');
    
    if (!data || data.length === 0) {
        contentElement.innerHTML = `
            <div class="no-data">
                <i class="fas fa-table"></i>
                <p>No data found in the specified range</p>
                <p>Check your spreadsheet ID and range configuration</p>
            </div>
        `;
        return;
    }
    
    // Limit the number of rows
    const displayData = data.slice(0, SHEETS_CONFIG.MAX_ROWS);
    
    if (SHEETS_CONFIG.USE_HEADERS && displayData.length > 0) {
        const headers = displayData[0];
        const rows = displayData.slice(1);
        
        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header || 'Column'}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${headers.map((_, index) => `<td>${row[index] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        contentElement.innerHTML = tableHtml;
    } else {
        // Display as simple table without headers
        const tableHtml = `
            <table class="data-table">
                <tbody>
                    ${displayData.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        contentElement.innerHTML = tableHtml;
    }
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'nav-button';
    refreshButton.style.marginTop = '20px';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
    refreshButton.onclick = loadSheetsData;
    
    contentElement.appendChild(refreshButton);
}

// Auto-refresh data every 10 minutes
setInterval(loadSheetsData, 10 * 60 * 1000);
