
export const getAuthToken = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');

  if (tokenFromUrl) {
    localStorage.setItem('jwt_token', tokenFromUrl);
    // Remove token from URL to clean it up
    window.history.replaceState({}, document.title, window.location.pathname);
    return tokenFromUrl;
  }

  return localStorage.getItem('jwt_token');
};
