document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = statusBadge.querySelector('.text');
  const focusCircle = document.getElementById('focus-circle');
  const timerDisplay = document.getElementById('timer');
  const currentEventEl = document.getElementById('current-event');
  const nextEventEl = document.getElementById('next-event');
  const connectBtn = document.getElementById('connect-btn');
  const blockedCountEl = document.getElementById('blocked-count');
  const focusTimeEl = document.getElementById('focus-time');

  const manualToggle = document.getElementById('manual-toggle');

  // Request initial status
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response) {
      updateUI(response);
    }
  });

  // Poll for updates every second (or use long-lived connection)
  setInterval(() => {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (response) {
        updateUI(response);
      }
    });
  }, 1000);

  manualToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.runtime.sendMessage({ action: 'setManualFocus', enabled: isEnabled });
  });

  connectBtn.addEventListener('click', () => {
    connectBtn.textContent = 'Syncing...';
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
      if (response && response.success) {
        connectBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Synced
        `;
        connectBtn.style.background = 'rgba(16, 185, 129, 0.2)';
        connectBtn.style.color = '#10b981';
        connectBtn.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      } else {
        connectBtn.textContent = 'Sync Failed';
        setTimeout(() => {
          connectBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Sync Calendar
          `;
        }, 2000);
      }
    });
  });

  function updateUI(data) {
    const { isBlocking, currentEvent, nextEvent, timeRemaining, stats, manualFocus, isAuthenticated } = data;

    // Update Toggle State
    manualToggle.checked = manualFocus;

    // Disable/Enable Sync Button based on Manual Focus
    if (manualFocus) {
        connectBtn.disabled = true;
        connectBtn.style.opacity = '0.5';
        connectBtn.style.cursor = 'not-allowed';
    } else {
        connectBtn.disabled = false;
        connectBtn.style.opacity = '1';
        connectBtn.style.cursor = 'pointer';
    }

    // Update Connect Button State
    if (isAuthenticated) {
        connectBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Synced
        `;
        connectBtn.style.background = 'rgba(16, 185, 129, 0.2)';
        connectBtn.style.color = '#10b981';
        connectBtn.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else {
        connectBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Sync Calendar
        `;
        connectBtn.style.background = '';
        connectBtn.style.color = '';
        connectBtn.style.border = '';
    }

    if (isBlocking) {
      statusBadge.classList.add('active');
      statusText.textContent = 'Focus Mode';
      focusCircle.parentElement.classList.add('active');
      
      if (manualFocus) {
        currentEventEl.textContent = 'Manual Focus Session';
      } else {
        currentEventEl.textContent = (currentEvent && currentEvent.summary) ? currentEvent.summary : 'Focus Session';
      }
      currentEventEl.style.color = '#fff';
    } else {
      statusBadge.classList.remove('active');
      statusText.textContent = 'Idle';
      focusCircle.parentElement.classList.remove('active');
      
      currentEventEl.textContent = 'Ready to focus';
      currentEventEl.style.color = 'var(--text-main)';
    }

    // Update next event text
    if (nextEvent) {
      nextEventEl.textContent = `Next: ${nextEvent.summary} at ${nextEvent.time}`;
    } else {
      nextEventEl.textContent = manualFocus ? 'Toggle off to end session' : 'Enable manual focus to start';
    }

    // Update timer and label
    const timerLabel = document.querySelector('.label');
    if (timeRemaining) {
      timerDisplay.textContent = timeRemaining;
      if (manualFocus) {
        timerLabel.textContent = 'FOCUS TIME';
      } else {
        timerLabel.textContent = 'UNTIL FREE';
      }
    } else {
      timerDisplay.textContent = '--:--';
      timerLabel.textContent = manualFocus ? 'FOCUS TIME' : 'UNTIL FREE';
    }

    if (stats) {
      blockedCountEl.textContent = stats.blockedCount || 0;
      focusTimeEl.textContent = stats.focusTime || '0h 0m';
    }
  }
});
