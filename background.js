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

    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError || !token) {
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
            sendResponse({ credential: null });
            return;
          }
          // Find the first credential matching the domain
          const doc = data.documents.find(doc => {
            const site = doc.fields.site.stringValue;
            return site === domain;
          });
          if (doc) {
            const username = doc.fields.username.stringValue;
            const encryptedPassword = doc.fields.password.stringValue;
            const decryptedPassword = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY).toString(CryptoJS.enc.Utf8);
            sendResponse({
              credential: {
                username,
                password: decryptedPassword
              }
            });
          } else {
            sendResponse({ credential: null });
          }
        })
        .catch(err => {
          console.error("Error fetching creds:", err);
          sendResponse({ credential: null });
        });
    });
    // Important: keep listener alive
    return true;
  }
});
