document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = statusBadge.querySelector('.text');
  const focusCircle = document.getElementById('focus-circle');
  const timerDisplay = document.getElementById('timer');
  const currentEventEl = document.getElementById('current-event');
  const nextEventEl = document.getElementById('next-event');

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



  function updateUI(data) {
    const { isBlocking, currentEvent, nextEvent, timeRemaining, stats, manualFocus, isAuthenticated } = data;

    // Update Toggle State
    manualToggle.checked = manualFocus;



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
