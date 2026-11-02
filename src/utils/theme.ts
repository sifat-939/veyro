export function setDarkMode(darkMode: boolean): void {
  try {
    localStorage.setItem('nivo_dark_mode', darkMode ? 'true' : 'false');
  } catch (e) {}
  if (darkMode) {
    document.documentElement.classList.add(
      'dark',
      'custom-scroll',
      'custom-scroll-thumb1'
    );
    document.documentElement.style.backgroundColor = '#111827';
    return;
  }
  document.documentElement.classList.remove('dark');
  document.documentElement.style.backgroundColor = '';
}
