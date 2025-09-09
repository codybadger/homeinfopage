// iOS 12.5.7 Compatibility Layer
// This file provides polyfills and compatibility fixes for older iOS versions

(function() {
    'use strict';
    
    // Detect iOS version
    function getIOSVersion() {
        const userAgent = navigator.userAgent;
        const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            return {
                major: parseInt(match[1], 10),
                minor: parseInt(match[2], 10),
                patch: parseInt(match[3] || 0, 10)
            };
        }
        return null;
    }
    
    const iosVersion = getIOSVersion();
    const isIOS12 = iosVersion && iosVersion.major === 12;
    
    if (isIOS12) {
        console.log('iOS 12 detected, loading compatibility layer...');
        
        // 1. Fetch API Polyfill
        if (!window.fetch) {
            console.log('Loading fetch polyfill...');
            // Simple fetch polyfill using XMLHttpRequest
            window.fetch = function(url, options = {}) {
                return new Promise(function(resolve, reject) {
                    const xhr = new XMLHttpRequest();
                    
                    xhr.open(options.method || 'GET', url);
                    
                    // Set headers
                    if (options.headers) {
                        Object.keys(options.headers).forEach(function(key) {
                            xhr.setRequestHeader(key, options.headers[key]);
                        });
                    }
                    
                    xhr.onload = function() {
                        const response = {
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: new Headers(),
                            text: function() { return Promise.resolve(xhr.responseText); },
                            json: function() { return Promise.resolve(JSON.parse(xhr.responseText)); }
                        };
                        resolve(response);
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error('Network error'));
                    };
                    
                    xhr.send(options.body || null);
                });
            };
        }
        
        // 2. URLSearchParams Polyfill
        if (!window.URLSearchParams) {
            console.log('Loading URLSearchParams polyfill...');
            window.URLSearchParams = function(search) {
                this.params = {};
                if (search) {
                    search.split('&').forEach(function(pair) {
                        const parts = pair.split('=');
                        if (parts.length === 2) {
                            this.params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
                        }
                    }.bind(this));
                }
            };
            
            window.URLSearchParams.prototype.append = function(name, value) {
                this.params[name] = value;
            };
            
            window.URLSearchParams.prototype.toString = function() {
                const pairs = [];
                Object.keys(this.params).forEach(function(key) {
                    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key]));
                }.bind(this));
                return pairs.join('&');
            };
        }
        
        // 3. Promise.finally Polyfill
        if (!Promise.prototype.finally) {
            console.log('Loading Promise.finally polyfill...');
            Promise.prototype.finally = function(callback) {
                return this.then(
                    function(value) { return Promise.resolve(callback()).then(function() { return value; }); },
                    function(reason) { return Promise.resolve(callback()).then(function() { throw reason; }); }
                );
            };
        }
        
        // 4. Array.flat() Polyfill
        if (!Array.prototype.flat) {
            console.log('Loading Array.flat polyfill...');
            Array.prototype.flat = function(depth) {
                depth = depth === undefined ? 1 : depth;
                return this.reduce(function(acc, val) {
                    return acc.concat(Array.isArray(val) && depth > 0 ? val.flat(depth - 1) : val);
                }, []);
            };
        }
        
        // 5. Object.fromEntries Polyfill
        if (!Object.fromEntries) {
            console.log('Loading Object.fromEntries polyfill...');
            Object.fromEntries = function(entries) {
                const obj = {};
                for (let i = 0; i < entries.length; i++) {
                    obj[entries[i][0]] = entries[i][1];
                }
                return obj;
            };
        }
        
        // 6. Fix for...of loops with async/await issues
        // We'll provide a helper function to replace problematic async for...of loops
        window.asyncForEach = function(array, callback) {
            return new Promise(function(resolve, reject) {
                let index = 0;
                
                function next() {
                    if (index >= array.length) {
                        resolve();
                        return;
                    }
                    
                    try {
                        const result = callback(array[index], index, array);
                        if (result && typeof result.then === 'function') {
                            result.then(function() {
                                index++;
                                next();
                            }).catch(reject);
                        } else {
                            index++;
                            next();
                        }
                    } catch (error) {
                        reject(error);
                    }
                }
                
                next();
            });
        };
        
        // 7. Fix localStorage issues on iOS 12
        // Sometimes localStorage can be unreliable on iOS 12
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        const originalRemoveItem = localStorage.removeItem;
        
        localStorage.setItem = function(key, value) {
            try {
                originalSetItem.call(this, key, value);
            } catch (e) {
                console.warn('localStorage.setItem failed:', e);
                // Fallback to sessionStorage
                sessionStorage.setItem(key, value);
            }
        };
        
        localStorage.getItem = function(key) {
            try {
                return originalGetItem.call(this, key);
            } catch (e) {
                console.warn('localStorage.getItem failed:', e);
                return sessionStorage.getItem(key);
            }
        };
        
        localStorage.removeItem = function(key) {
            try {
                originalRemoveItem.call(this, key);
            } catch (e) {
                console.warn('localStorage.removeItem failed:', e);
                sessionStorage.removeItem(key);
            }
        };
        
        // 8. Fix Google OAuth issues on iOS 12
        // iOS 12 has issues with popup-based OAuth flows
        window.isIOS12 = true;
        
        console.log('iOS 12 compatibility layer loaded successfully');
    }
    
    // Export for use in other scripts
    window.ios12Compatibility = {
        isIOS12: isIOS12,
        version: iosVersion
    };
    
})();
