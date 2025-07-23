// Hardcoded users for demo
const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'employee1', password: 'emp123', role: 'employee' },
  { username: 'employee2', password: 'emp456', role: 'employee' }
];

// Check if already logged in
chrome.storage.local.get(['session'], (result) => {
  if (result.session) {
    if (result.session.role === 'admin') {
      window.location.href = 'admin.html';
    } else if (result.session.role === 'employee') {
      window.location.href = 'employee.html';
    }
  }
});

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    // Save session
    chrome.storage.local.set({ session: { username: user.username, role: user.role } }, () => {
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'employee.html';
      }
    });
  } else {
    loginError.textContent = 'Invalid username or password.';
  }
}); 