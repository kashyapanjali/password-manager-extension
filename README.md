# Password Manager Chrome Extension

A secure Chrome extension to manage and autofill your website credentials using Google Sign-In and Firebase Firestore.

---

## Features
- **Google Sign-In**: Secure authentication using your Google account.
- **Role-based UI**: Super admin and employee roles with custom greetings.
- **Add Credentials**: Save website, email, username, and password (passwords are encrypted before storage).
- **View Credentials**: See your saved credentials with decrypted passwords in the extension popup.
- **Autofill**: Automatically fills login forms on supported websites.
- **Firebase Firestore**: All credentials are securely stored in your own Firestore database.

---

## Setup & Installation

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd password-manager-extension
   ```

2. **Configure Firebase**
   - Create a Firebase project and enable Firestore.
   - Enable Google authentication in Firebase.
   - Copy your Firebase project ID.

3. **Set up `secrets.js`**
   - Create a file named `secrets.js` in the root directory:
     ```js
     // secrets.js
     const firebaseProjectId = "your-firebase-project-id";
     if (typeof window !== "undefined") {
       window.FIREBASE_PROJECT_ID = firebaseProjectId;
     } else if (typeof self !== "undefined") {
       self.FIREBASE_PROJECT_ID = firebaseProjectId;
     }
     ```
   - **Do NOT commit this file to GitHub.**

4. **Load the Extension in Chrome**
   - Go to `chrome://extensions/`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked" and select your project folder.

5. **Add Test Users (for OAuth Testing Mode)**
   - In Google Cloud Console, add your email as a test user under APIs & Services > OAuth consent screen.

---

## Usage

- Click the extension icon to open the popup.
- Log in with Google.
- Add credentials (website, email, username, password).
- Click "View Credentials" to see your saved credentials.
- Visit a login page; the extension will autofill your credentials if saved.

---

## Going Public
- To allow anyone to use the extension, you must submit your OAuth consent screen for verification in the Google Cloud Console.
- You will need a privacy policy hosted online (e.g., GitHub Pages, Notion, or your own site).
- Add the domain of your privacy policy as an authorized domain in the consent screen settings.

---

## Security Notes
- Passwords are encrypted in the browser before being sent to Firestore.
- The extension never stores plain text passwords in the database.
- Do not store your Firebase private keys or secrets in the extension.

---

## Development Notes
- All code is compatible with Chrome Manifest V3.
- No remote scripts are loaded; all dependencies are bundled or loaded locally.
- For any issues, check the browser console and extension background page for errors.
