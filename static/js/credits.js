function _navigate() {
  window.location.href = '/credits';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tool-credits-btn')?.addEventListener('click', _navigate);
});

window.creditsModule = { open: _navigate };
export default { open: _navigate };
