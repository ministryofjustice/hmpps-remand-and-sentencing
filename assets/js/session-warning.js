;(function () {
  if (window.location.pathname.endsWith('/timeout')) return

  const INACTIVITY_LIMIT = window.__INACTIVITY_LIMIT__ // default 20s
  const POPUP_COUNTDOWN = window.__POPUP_COUNTDOWN__ // default 10s

  let inactivityTimer = null
  let countdownInterval = null
  let nomsId = null

  const warningPopup = document.getElementById('session-warning-popup')
  const countdownTimerElement = document.getElementById('countdown-timer')
  const continueButton = document.getElementById('continue-button')

  // ---------------------------
  // Functions
  // ---------------------------
  function resetInactivityTimer(force = false) {
    if (!force && warningPopup?.classList.contains('active')) return

    clearTimeout(inactivityTimer)

    // Only show popup if all tabs inactive
    inactivityTimer = setTimeout(() => {
      const lastActivity = parseInt(localStorage.getItem('ras-last-activity'), 10) || Date.now()
      const elapsed = Date.now() - lastActivity

      if (elapsed >= INACTIVITY_LIMIT) {
        showPopupAndStartCountdown()
        localStorage.setItem('ras-warning-triggered', Date.now())
      }
    }, INACTIVITY_LIMIT)
  }

  function startCountdown() {
    let timeLeft = POPUP_COUNTDOWN
    updateCountdownText(timeLeft)

    clearInterval(countdownInterval)
    countdownInterval = setInterval(() => {
      timeLeft -= 1
      updateCountdownText(timeLeft)

      if (timeLeft <= 0) {
        clearInterval(countdownInterval)
        countdownInterval = null
        window.location.href = `/person/${nomsId}/timeout`
      }
    }, 1000)
  }

  function updateCountdownText(seconds) {
    if (countdownTimerElement) countdownTimerElement.textContent = `${seconds} seconds`
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

  async function resetSession() {
    hidePopup()
    try {
      const res = await fetch('/session/session-status', { credentials: 'same-origin' })
      const data = await res.json()

      if (data.isLoggedIn) {
        const now = Date.now()
        localStorage.setItem('ras-last-activity', now)
        localStorage.setItem('ras-session-continued', now) // broadcast to other tabs
        resetInactivityTimer(true)
      }
    } catch (err) {
      console.error('Error extending session:', err)
    }
  }

  async function fetchNomsId() {
    try {
      const res = await fetch('/session/session-status', { credentials: 'same-origin' })
      const data = await res.json()
      nomsId = data.nomsId
    } catch (err) {
      console.error('Failed to fetch nomsId', err)
    }
  }

  // ---------------------------
  // Cross-tab storage listener
  // ---------------------------
  window.addEventListener('storage', e => {
    if (e.key === 'ras-session-continued') {
      hidePopup()
      resetInactivityTimer(true)
    } else if (e.key === 'ras-warning-triggered') {
      const lastActivity = parseInt(localStorage.getItem('ras-last-activity'), 10) || Date.now()
      if (Date.now() - lastActivity >= INACTIVITY_LIMIT && warningPopup && !warningPopup.classList.contains('active')) {
        showPopupAndStartCountdown()
      }
    }
  })

  // ---------------------------
  // DOMContentLoaded
  // ---------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    await fetchNomsId()

    if (continueButton) {
      continueButton.addEventListener('click', resetSession)
    }

    // Hide popup if session continued in another tab
    if (localStorage.getItem('ras-session-continued')) {
      hidePopup()
      resetInactivityTimer(true)
    }

    // Track user activity
    ;['mousemove', 'keydown', 'click'].forEach(evt => {
      document.addEventListener(evt, () => {
        localStorage.setItem('ras-last-activity', Date.now())
        resetInactivityTimer()
      })
    })

    resetInactivityTimer()
  })
})()
