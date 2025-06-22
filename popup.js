import { db, collection, addDoc } from "./firebase-config.js";

// Custom encryption key
const SECRET_KEY = "anjali-2025";

// Get role based on email
function getRoleByEmail(email) {
	const roles = {
		"anjalikashyap9608@gmail.com": "super_admin",
		"employee1@example.com": "employee",
		"employee2@example.com": "employee",
	};
	return roles[email] || "guest";
}

// Logout and clear token
function logoutAndClearToken() {
	chrome.identity.getAuthToken({ interactive: false }, function (token) {
		if (token) {
			chrome.identity.removeCachedAuthToken({ token }, function () {
				console.log("Token cleared.");
				window.location.reload();
			});
		}
	});
}

// Encryption helpers
function encrypt(text) {
	return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(ciphertext) {
	const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
}

// Save to Firebase
async function saveToFirebase(site, username, encryptedPassword) {
	try {
		await addDoc(collection(db, "credentials"), {
			site,
			username,
			password: encryptedPassword,
			createdAt: new Date(),
		});
		alert("Credential saved to Firebase!");
		// Clear inputs after saving
		document.getElementById("site").value = "";
		document.getElementById("username").value = "";
		document.getElementById("password").value = "";
	} catch (e) {
		console.error("Error adding document: ", e);
	}
}

// Handle login
document.getElementById("login-btn").addEventListener("click", function () {
	chrome.identity.getAuthToken({ interactive: true }, function (token) {
		if (chrome.runtime.lastError) {
			console.error("Auth Error:", chrome.runtime.lastError.message);
			return;
		}

		fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
			headers: { Authorization: "Bearer " + token },
		})
			.then((response) => response.json())
			.then((userInfo) => {
				const email = userInfo.email;
				const role = getRoleByEmail(email);

				const message =
					role === "super_admin" ? "Welcome Super Admin"
					: role === "employee" ? `Welcome ${email}`
					: "Welcome Guest";

				// Update UI
				document.getElementById("login-container").style.display = "none";
				document.getElementById("user-info").style.display = "flex";
				document.getElementById("user-email").innerText = message;
				document.getElementById("buttons").style.display = "flex";
				document.getElementById("logout-container").style.display = "block";
			})
			.catch((error) => console.error("Error fetching user info:", error));
	});
});

// Logout
document
	.getElementById("logout-btn")
	.addEventListener("click", logoutAndClearToken);

// Save credentials to Firebase only
document.getElementById("save-credential-btn").addEventListener("click", () => {
	const site = document.getElementById("site").value;
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

	if (!site || !username || !password) {
		alert("Please fill all fields.");
		return;
	}

	const encryptedPassword = encrypt(password);
	saveToFirebase(site, username, encryptedPassword);
});

// Show add credential form
document.getElementById("add-credential-btn").addEventListener("click", () => {
	document.getElementById("add-credential-form").style.display = "block";
});
