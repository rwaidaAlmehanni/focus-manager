// background.js

const SOCIAL_MEDIA_DOMAINS = [
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "reddit.com",
  "tiktok.com"
];

// State
let state = {
  isBlocking: false,
  currentEvent: null,
  nextEvent: null,
  stats: {
    blockedCount: 0,
    focusTimeMinutes: 0,
    focusTime: "0h 0m"
  },
  manualFocus: false
};

// Load stats and state from storage
chrome.storage.local.get(['stats', 'manualFocus', 'lastResetDate'], (result) => {
  const today = new Date().toDateString();
  
  // Check if we need to reset daily stats
  if (result.lastResetDate !== today) {
    // New day - reset daily stats
    state.stats = {
      blockedCount: 0,
      focusTimeMinutes: 0,
      focusTime: "0h 0m"
    };
    chrome.storage.local.set({ 
      stats: state.stats, 
      lastResetDate: today 
    });
  } else if (result.stats) {
    state.stats = result.stats;
    // Ensure focusTime is properly formatted
    if (state.stats.focusTimeMinutes) {
      const hours = Math.floor(state.stats.focusTimeMinutes / 60);
      const mins = state.stats.focusTimeMinutes % 60;
      state.stats.focusTime = `${hours}h ${mins}m`;
    }
  }
  
  if (result.manualFocus !== undefined) {
    state.manualFocus = result.manualFocus;
    // Re-check calendar status to apply manual focus if it was enabled
    checkCalendarStatus();
  }
});

// Simulation Mode (since we don't have a real Client ID for this demo)
const SIMULATION_MODE = false;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log("Focus Manager Installed");
  chrome.alarms.create("checkCalendar", { periodInMinutes: 1 });
  
  // Initialize blocking rules (disabled by default)
  updateBlockingRules(false);
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkCalendar") {
    checkCalendarStatus();
  }
});

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStatus") {
    // Calculate time remaining if blocking
    let timeRemaining = "--:--";
    if (state.isBlocking && state.currentEvent) {
      if (state.manualFocus) {
        // For manual focus, show elapsed time
        if (state.currentEvent.start) {
          const now = new Date();
          const start = new Date(state.currentEvent.start);
          const diff = now - start;
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      } else {
        // For calendar events, show time remaining
        const now = new Date();
        const end = new Date(state.currentEvent.end);
        const diff = end - now;
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
    }
    
    sendResponse({ ...state, timeRemaining });

  } else if (request.action === "incrementBlockedCount") {
    state.stats.blockedCount++;
    console.log('Distraction blocked! Count:', state.stats.blockedCount);
    // Save state to storage
    chrome.storage.local.set({ stats: state.stats });
    sendResponse({ success: true, count: state.stats.blockedCount });
    return true;
  } else if (request.action === "setManualFocus") {
    state.manualFocus = request.enabled;
    // Save manual focus state to storage
    chrome.storage.local.set({ manualFocus: state.manualFocus });
    checkCalendarStatus(); // Re-evaluate blocking status
  } else if (request.action === "getStats") {
    // Return current stats for testing purposes
    sendResponse(state.stats);
    return true;
  } else if (request.action === "resetStats") {
    // Reset daily stats and update storage
    state.stats = { blockedCount: 0, focusTimeMinutes: 0, focusTime: "0h 0m" };
    const today = new Date().toDateString();
    chrome.storage.local.set({ stats: state.stats, lastResetDate: today }, () => {
      sendResponse({ success: true, message: "Stats reset for " + today });
    });
    return true;
  } else if (request.action === "getDynamicRules") {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      console.log('Current dynamic rules:', rules);
      sendResponse({ rules: rules });
    });
    return true;
  }
});



// Blocking Logic
function updateBlockingRules(enable) {
  // Create rules for both www and non-www versions
  const rules = [];
  let ruleId = 1;
  
  SOCIAL_MEDIA_DOMAINS.forEach((domain) => {
    // Rule for www version
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
      condition: { 
        urlFilter: `*://www.${domain}/*`,
        resourceTypes: ["main_frame"] 
      }
    });
    
    // Rule for non-www version
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
      condition: { 
        urlFilter: `*://${domain}/*`,
        resourceTypes: ["main_frame"] 
      }
    });
  });

  if (enable) {
    console.log('Enabling blocking rules for:', SOCIAL_MEDIA_DOMAINS);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting blocking rules:', chrome.runtime.lastError);
      } else {
        console.log('Blocking rules enabled successfully');
      }
    });
  } else {
    console.log('Disabling blocking rules');
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id)
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error removing blocking rules:', chrome.runtime.lastError);
      } else {
        console.log('Blocking rules disabled successfully');
      }
    });
  }
}
// Calendar Logic (Simplified for Manual Focus Only)
function checkCalendarStatus() {
  // Only Manual Focus is supported now
  const shouldBlock = state.manualFocus;

  if (shouldBlock) {
    if (!state.isBlocking) {
      // Start Blocking
      state.isBlocking = true;
      state.currentEvent = { 
        summary: "Manual Focus Session", 
        start: new Date().toISOString(),
        end: null 
      };
      
      console.log('Starting focus mode blocking. Manual:', state.manualFocus);
      updateBlockingRules(true);
    }
  } else {
    if (state.isBlocking) {
      // Stop Blocking
      state.isBlocking = false;
      state.currentEvent = null;
      updateBlockingRules(false);
    }
  }

  state.nextEvent = null;
  
  // Update stats
  if (state.isBlocking) {
    // Add 1 minute to focus time (since this runs every minute)
    if (!state.stats.focusTimeMinutes) state.stats.focusTimeMinutes = 0;
    state.stats.focusTimeMinutes++;
    
    // Format for display
    const hours = Math.floor(state.stats.focusTimeMinutes / 60);
    const mins = state.stats.focusTimeMinutes % 60;
    state.stats.focusTime = `${hours}h ${mins}m`;
    
    // Save to storage
    chrome.storage.local.set({ stats: state.stats });
  }
}
