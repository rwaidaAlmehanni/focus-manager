// Notify background script to increment counter
console.log('Blocked page loaded - incrementing counter');
chrome.runtime.sendMessage({ action: 'incrementBlockedCount' }, (response) => {
  if (response) {
    console.log('Counter incremented successfully:', response.count);
  }
});
