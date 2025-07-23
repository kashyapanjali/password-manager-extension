// Check if logged in as admin
chrome.storage.local.get(['session'], (result) => {
  if (!result.session || result.session.role !== 'admin') {
    window.location.href = 'login.html';
  } else {
    loadCredentials();
  }
});

const credentialsList = document.getElementById('credentialsList');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', () => {
  chrome.storage.local.remove('session', () => {
    window.location.href = 'login.html';
  });
});

function loadCredentials() {
  chrome.storage.local.get(['credentials'], (result) => {
    const credentials = result.credentials || [];
    credentialsList.innerHTML = '';
    if (credentials.length === 0) {
      credentialsList.textContent = 'No credentials found.';
      return;
    }
    credentials.forEach((cred, idx) => {
      const div = document.createElement('div');
      div.className = 'credential';
      div.innerHTML = `
        <strong>Site:</strong> ${cred.site} <br>
        <strong>Username:</strong> ${cred.username} <br>
        <strong>Password:</strong> ${cred.password} <br>
        <strong>Owner:</strong> ${cred.owner} <br>
        <button class="editBtn" data-idx="${idx}">Edit</button>
        <button class="deleteBtn" data-idx="${idx}">Delete</button>
        <hr>
      `;
      credentialsList.appendChild(div);
    });
    addAdminActions();
  });
}

function addAdminActions() {
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      chrome.storage.local.get(['credentials'], (result) => {
        const credentials = result.credentials || [];
        credentials.splice(idx, 1);
        chrome.storage.local.set({ credentials }, loadCredentials);
      });
    });
  });
  // Edit functionality can be expanded as needed
} 