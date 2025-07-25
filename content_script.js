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

// Floating trigger icon logic
function showFloatingTriggerIcon() {
    if (document.getElementById('pm-trigger-icon')) return;
    const icon = document.createElement('div');
    icon.id = 'pm-trigger-icon';
    icon.innerHTML = '🔑';
    icon.title = 'Open Password Manager';
    icon.style.position = 'fixed';
    icon.style.top = '120px';
    icon.style.right = '18px';
    icon.style.zIndex = 9999999;
    icon.style.background = '#fff';
    icon.style.border = '2px solid #007bff';
    icon.style.borderRadius = '50%';
    icon.style.width = '48px';
    icon.style.height = '48px';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.fontSize = '28px';
    icon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    icon.style.cursor = 'pointer';
    icon.onclick = () => {
        showFloatingPanel();
    };
    document.body.appendChild(icon);
}

// Enhanced: Find all possible username/email fields
function findAllUsernameFields() {
    const selectors = [
        'input[type="email"]',
        'input[type="text"][name*="user"]',
        'input[type="text"][name*="email"]',
        'input[type="text"][id*="user"]',
        'input[type="text"][id*="email"]',
        'input[type="text"][autocomplete*="user"]',
        'input[type="text"][autocomplete*="email"]',
        'input[type="text"]',
        'input[name="login"]',
        'input[name="identifier"]',
    ];
    // Remove duplicates
    const fields = Array.from(new Set(
        selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)))
    ));
    // Exclude password fields
    return fields.filter(f => f.type !== 'password');
}

// Enhanced autofill logic
function requestAndAutofill() {
    const hostname = window.location.hostname;
    console.log('[PasswordManager] Autofill triggered for:', hostname);
    chrome.runtime.sendMessage({ type: "REQUEST_CREDENTIAL", hostname }, (response) => {
        console.log('[PasswordManager] Credential response:', response);
        if (!response || !response.credential) {
            showAutofillMessage('No credential found for this site.');
            console.log('[PasswordManager] No credential to autofill.');
            return;
        }
        const { username, password, email } = response.credential;
        const passwordField = document.querySelector('input[type="password"]');
        let filled = false;
        if (passwordField) {
            passwordField.value = password;
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('[PasswordManager] Autofilled password field.');
            filled = true;
        }
        // Fill all possible username/email fields
        const usernameFields = findAllUsernameFields();
        usernameFields.forEach(field => {
            const attr = (field.getAttribute('name') || '' ) + ' ' + (field.getAttribute('id') || '') + ' ' + (field.getAttribute('placeholder') || '').toLowerCase();
            let valueToFill = '';
            if (attr.includes('email')) {
                valueToFill = email || username;
            } else if (attr.includes('user')) {
                valueToFill = username || email;
            } else {
                valueToFill = username || email;
            }
            if (valueToFill) {
                field.value = valueToFill;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('[PasswordManager] Autofilled username/email field with:', valueToFill);
                filled = true;
            }
        });
        if (!filled) {
            showAutofillMessage('Could not find login fields to autofill.');
        } else {
            showAutofillMessage('Autofilled credentials!');
        }
    });
}

// Detect login form and show trigger icon if found
function detectLoginFormAndShowIcon() {
    const passwordField = document.querySelector('input[type="password"]');
    if (passwordField) {
        showFloatingTriggerIcon();
    }
}

// MutationObserver to detect dynamically added login forms
function observeForLoginForm() {
    const observer = new MutationObserver(() => {
        const passwordField = document.querySelector('input[type="password"]');
        if (passwordField) {
            showFloatingTriggerIcon();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// Add a manual autofill button for debugging
function addManualAutofillButton() {
    if (document.getElementById('pm-manual-autofill-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'pm-manual-autofill-btn';
    btn.textContent = '🔑 Autofill';
    btn.style.position = 'fixed';
    btn.style.bottom = '60px';
    btn.style.right = '10px';
    btn.style.zIndex = 9999999;
    btn.style.background = '#007bff';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.padding = '8px 16px';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.onclick = requestAndAutofill;
    document.body.appendChild(btn);
}

// Show a visible message for debugging
function showAutofillMessage(msg) {
    let div = document.getElementById('pm-autofill-debug');
    if (!div) {
        div = document.createElement('div');
        div.id = 'pm-autofill-debug';
        div.style.position = 'fixed';
        div.style.bottom = '10px';
        div.style.right = '10px';
        div.style.background = '#fffae6';
        div.style.color = '#333';
        div.style.border = '1px solid #f0ad4e';
        div.style.padding = '8px 16px';
        div.style.zIndex = 9999999;
        div.style.fontSize = '14px';
        div.style.borderRadius = '6px';
        document.body.appendChild(div);
    }
    div.textContent = msg;
    setTimeout(() => { div.remove(); }, 5000);
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        requestAndAutofill();
        addManualAutofillButton();
        detectLoginFormAndShowIcon();
        observeForLoginForm();
    });
} else {
    requestAndAutofill();
    addManualAutofillButton();
    detectLoginFormAndShowIcon();
    observeForLoginForm();
}
