importScripts('crypto-utils.js', 'secrets.js');

chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension installed");
});

// background.js

const SECRET_KEY = "anjali-2025";
const FIREBASE_PROJECT_ID = self.FIREBASE_PROJECT_ID;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REQUEST_CREDENTIAL") {
    const domain = message.hostname;
    // Also try base domain (strip www.)
    const baseDomain = domain.startsWith("www.") ? domain.slice(4) : domain;
    console.log("[PasswordManager] Credential request for domain:", domain, "base:", baseDomain);

    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError || !token) {
        console.error("[PasswordManager] Auth error:", chrome.runtime.lastError);
        sendResponse({ credential: null });
        return;
      }
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/credentials`;
      fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.documents) {
            console.log("[PasswordManager] No credentials found in Firestore");
            sendResponse({ credential: null });
            return;
          }
          // Find the first credential matching the domain or base domain
          const doc = data.documents.find(doc => {
            const site = doc.fields.site.stringValue;
            return site === domain || site === baseDomain;
          });
          if (doc) {
            const username = doc.fields.username ? doc.fields.username.stringValue : '';
            const email = doc.fields.email ? doc.fields.email.stringValue : '';
            const encryptedPassword = doc.fields.password.stringValue;
            const decryptedPassword = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY).toString(CryptoJS.enc.Utf8);
            console.log("[PasswordManager] Found credential for:", doc.fields.site.stringValue, "username:", username, "email:", email);
            sendResponse({
              credential: {
                username,
                email,
                password: decryptedPassword
              }
            });
          } else {
            console.log("[PasswordManager] No matching credential for domain:", domain, "or base:", baseDomain);
            sendResponse({ credential: null });
          }
        })
        .catch(err => {
          console.error("[PasswordManager] Error fetching creds:", err);
          sendResponse({ credential: null });
        });
    });
    // Important: keep listener alive
    return true;
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleFloatingPanel" });
});
