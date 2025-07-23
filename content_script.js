// Floating panel logic for password manager extension
// This script is injected into every page via manifest.json

// Only create the panel once
let floatingPanel = null;

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleFloatingPanel") {
        if (floatingPanel && document.body.contains(floatingPanel)) {
            // If panel exists, remove it (toggle off)
            floatingPanel.remove();
            floatingPanel = null;
        } else {
            // Otherwise, create and show the panel
            showFloatingPanel();
        }
    }
});

function showFloatingPanel() {
    // Create the panel container
    floatingPanel = document.createElement('div');
    floatingPanel.id = 'pm-floating-panel';
    floatingPanel.style.position = 'fixed';
    floatingPanel.style.top = '80px';
    floatingPanel.style.right = '40px';
    floatingPanel.style.zIndex = '999999';
    floatingPanel.style.background = '#fff';
    floatingPanel.style.border = '2px solid #007bff';
    floatingPanel.style.borderRadius = '10px';
    floatingPanel.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
    floatingPanel.style.padding = '20px 24px 16px 24px';
    floatingPanel.style.minWidth = '320px';
    floatingPanel.style.fontFamily = 'sans-serif';

    // Add favicon/icon
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icon.png');
    icon.alt = 'Extension Icon';
    icon.style.width = '32px';
    icon.style.height = '32px';
    icon.style.display = 'block';
    icon.style.margin = '0 auto 12px auto';
    floatingPanel.appendChild(icon);

    // Add title
    const title = document.createElement('h3');
    title.innerText = 'Password Manager';
    title.style.textAlign = 'center';
    title.style.margin = '0 0 12px 0';
    floatingPanel.appendChild(title);

    // Add form
    const form = document.createElement('form');
    form.id = 'pm-form';
    form.innerHTML = `
        <label>Website*<br><input type="text" id="pm-site" required style="width: 100%; margin-bottom: 8px;"></label><br>
        <label>Username<br><input type="text" id="pm-username" style="width: 100%; margin-bottom: 8px;"></label><br>
        <label>Password*<br><input type="password" id="pm-password" required style="width: 100%; margin-bottom: 8px;"></label><br>
        <button type="submit" style="width: 100%; background: #007bff; color: #fff; border: none; border-radius: 4px; padding: 8px 0; font-size: 16px;">Save</button>
    `;
    floatingPanel.appendChild(form);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '×';
    closeBtn.title = 'Close';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '12px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '22px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        floatingPanel.remove();
        floatingPanel = null;
    };
    floatingPanel.appendChild(closeBtn);

    // Prevent click events from propagating to the page
    floatingPanel.addEventListener('mousedown', e => e.stopPropagation());
    floatingPanel.addEventListener('mouseup', e => e.stopPropagation());
    floatingPanel.addEventListener('click', e => e.stopPropagation());

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const site = document.getElementById('pm-site').value.trim();
        const username = document.getElementById('pm-username').value.trim();
        const password = document.getElementById('pm-password').value.trim();
        if (!site || !password) {
            alert('Please fill all required fields (Website and Password).');
            return;
        }
        // TODO: Save the credential (send to background or popup, or use chrome.storage)
        alert('Credential saved! (Demo only)');
        // Optionally, close the panel after saving
        floatingPanel.remove();
        floatingPanel = null;
    });

    document.body.appendChild(floatingPanel);
}
