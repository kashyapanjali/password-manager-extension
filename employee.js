// Check if logged in as employee
let currentUser = null;
chrome.storage.local.get(['session'], (result) => {
  if (!result.session || result.session.role !== 'employee') {
    window.location.href = 'login.html';
  } else {
    currentUser = result.session.username;
    loadCredentials();
  }
});

const credentialsList = document.getElementById('credentialsList');
const logoutBtn = document.getElementById('logoutBtn');
const addCredentialBtn = document.getElementById('addCredentialBtn');
const addCredentialForm = document.getElementById('addCredentialForm');
const saveCredentialBtn = document.getElementById('saveCredentialBtn');

logoutBtn.addEventListener('click', () => {
  chrome.storage.local.remove('session', () => {
    window.location.href = 'login.html';
  });
});

addCredentialBtn.addEventListener('click', () => {
  addCredentialForm.style.display = 'block';
});

saveCredentialBtn.addEventListener('click', () => {
  const site = document.getElementById('site').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!site || !username || !password) return;
  chrome.storage.local.get(['credentials'], (result) => {
    const credentials = result.credentials || [];
    credentials.push({ site, username, password, owner: currentUser });
    chrome.storage.local.set({ credentials }, () => {
      addCredentialForm.style.display = 'none';
      document.getElementById('site').value = '';
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      loadCredentials();
    });
  });
});

function loadCredentials() {
  chrome.storage.local.get(['credentials'], (result) => {
    const credentials = (result.credentials || []).filter(cred => cred.owner === currentUser);
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
        <button class="editBtn" data-idx="${idx}">Edit</button>
        <button class="deleteBtn" data-idx="${idx}">Delete</button>
        <hr>
      `;
      credentialsList.appendChild(div);
    });
    addEmployeeActions(credentials);
  });
}

function addEmployeeActions(credentials) {
  document.querySelectorAll('.deleteBtn').forEach((btn, i) => {
    btn.addEventListener('click', function() {
      chrome.storage.local.get(['credentials'], (result) => {
        let allCreds = result.credentials || [];
        // Find the i-th credential for this user in allCreds
        let userCredsIdx = 0;
        for (let j = 0; j < allCreds.length; j++) {
          if (allCreds[j].owner === currentUser) {
            if (userCredsIdx === i) {
              allCreds.splice(j, 1);
              break;
            }
            userCredsIdx++;
          }
        }
        chrome.storage.local.set({ credentials: allCreds }, loadCredentials);
      });
    });
  });
  // Edit functionality can be expanded as needed
} 