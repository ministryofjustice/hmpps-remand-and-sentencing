const checkbox = document.getElementById('noCaseReference')
const input = document.getElementById('referenceNumber')

checkbox.addEventListener('change', () => {
  if (input.value) {
    input.value = ''
  }
})

input.addEventListener('input', () => {
  if (checkbox.checked) {
    checkbox.checked = false
  }
})
