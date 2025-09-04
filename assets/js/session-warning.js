;(function () {
  if (window.location.pathname.endsWith('/timeout')) return

  const INACTIVITY_LIMIT = window.__INACTIVITY_LIMIT__
  const POPUP_COUNTDOWN = window.__POPUP_COUNTDOWN__

  let inactivityTimer = null
  let countdownInterval = null
  let nomsId = null

  const warningPopup = document.getElementById('session-warning-popup')
  const countdownTimerElement = document.getElementById('countdown-timer')
  const continueButton = document.getElementById('continue-button')

  // ---------------------------
  // Cross-tab storage listener
  // ---------------------------
  window.addEventListener('storage', e => {
    if (e.key === 'ras-session-continued') {
      if (warningPopup) {
        warningPopup.classList.remove('active')
        clearInterval(countdownInterval) // stop the timer immediately
      }
      resetInactivityTimer(true)
    } else if (e.key === 'ras-warning-triggered') {
      if (warningPopup && !warningPopup.classList.contains('active')) {
        showPopupAndStartCountdown()
      }
    }
  })

  // ---------------------------
  // Fetch session info (nomsId)
  // ---------------------------
  async function fetchNomsId() {
    try {
      const res = await fetch('/session/session-status', { credentials: 'same-origin' })
      const data = await res.json()
      nomsId = data.nomsId
      console.log('Session data:', data)
    } catch (err) {
      console.error('Failed to fetch nomsId', err)
    }
  }

  // ---------------------------
  // DOMContentLoaded
  // ---------------------------
  document.addEventListener('DOMContentLoaded', async function () {
    await fetchNomsId()

    // Attach continue button
    if (continueButton) {
      continueButton.addEventListener('click', resetSession)
    }

    // Hide popup if session already continued in another tab
    if (localStorage.getItem('ras-session-continued') && warningPopup) {
      warningPopup.classList.remove('active')
      resetInactivityTimer(true)
    }

    // Track user activity
    resetInactivityTimer()
    ;['mousemove', 'keydown', 'click'].forEach(evt => {
      document.addEventListener(evt, () => {
        const now = Date.now()
        localStorage.setItem('ras-last-activity', now)
        resetInactivityTimer()
      })
    })
  })

  // ---------------------------
  // Reset inactivity timer
  // ---------------------------
  function resetInactivityTimer(force = false) {
    if (!force && warningPopup.classList.contains('active')) return

    clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      showPopupAndStartCountdown()
      localStorage.setItem('ras-warning-triggered', Date.now())
    }, INACTIVITY_LIMIT)
  }

  // ---------------------------
  // Countdown for warning popup
  // ---------------------------
  function startCountdown() {
    let timeLeft = POPUP_COUNTDOWN
    updateCountdownText(timeLeft)

    clearInterval(countdownInterval)
    countdownInterval = setInterval(() => {
      timeLeft -= 1
      updateCountdownText(timeLeft)

      if (timeLeft <= 0) {
        clearInterval(countdownInterval)
        window.location.href = `/person/${nomsId}/timeout`
      }
    }, 1000)
  }

  function updateCountdownText(seconds) {
    if (countdownTimerElement) {
      countdownTimerElement.textContent = `${seconds} seconds`
    }
  }

  function showPopupAndStartCountdown() {
    if (warningPopup && !warningPopup.classList.contains('active')) {
      warningPopup.classList.add('active')
      startCountdown()
    }
  }

  function hidePopup() {
    if (warningPopup) warningPopup.classList.remove('active')
    clearInterval(countdownInterval)
    countdownInterval = null
  }

  // ---------------------------
  // Extend session on continue
  // ---------------------------
  function resetSession() {
    hidePopup()

    fetch('/session/session-status', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          const now = Date.now()
          localStorage.setItem('ras-last-activity', now)
          localStorage.setItem('ras-session-continued', now) // broadcast to other tabs
          resetInactivityTimer(true)
        }
      })
      .catch(err => console.error('Error extending session:', err))
  }
})()
