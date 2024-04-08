const checkbox = document.getElementById('unknown-code')
const input = document.getElementById('offence-code')

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
