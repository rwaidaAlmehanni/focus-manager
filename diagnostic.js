// Diagnostic Script for Focus Manager
// Run this in the Service Worker console (chrome://extensions -> Service Worker)

console.log("=== Focus Manager Diagnostics ===");

// 1. Check if we have a client ID in manifest
chrome.runtime.getManifest().oauth2 && console.log("✓ OAuth2 config found in manifest");

// 2. Try to get auth token
chrome.identity.getAuthToken({interactive: false}, (token) => {
  if (chrome.runtime.lastError) {
    console.error("❌ Auth Error:", chrome.runtime.lastError.message);
  } else if (token) {
    console.log("✓ Token exists:", token.substring(0, 20) + "...");
  } else {
    console.log("⚠️  No token found - need to authenticate");
  }
});

// 3. Check extension ID
console.log("Extension ID:", chrome.runtime.id);
console.log("\n📋 Copy this Extension ID and add it to your Google Cloud OAuth Client!");
