const toggleButton = document.getElementById('toggle-filters-button')
const panel = document.getElementById('filters-panel')

if (toggleButton && panel) {
  toggleButton.addEventListener('click', function () {
    const isOpen = panel.hasAttribute('hidden') === false
    panel.hidden = isOpen
    toggleButton.setAttribute('aria-expanded', !isOpen)
    toggleButton.innerText = isOpen ? 'Show filters' : 'Hide filters'
  })
}
