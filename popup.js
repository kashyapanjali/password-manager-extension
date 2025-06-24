import { FIREBASE_PROJECT_ID } from "./secrets.js";

const SECRET_KEY = "anjali-2025";

// Encrypt text using CryptoJS
function encrypt(text) {
	return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}


//for decrypt show password 
function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function getRoleByEmail(email) {
	const roles = {
		"anjalikashyap9608@gmail.com": "super_admin",
		"employee1@example.com": "employee",
		"employee2@example.com": "employee",
	};
	return roles[email] || "guest";
}

// Save to Firebase Firestore using REST API
function saveToFirebaseWithToken(site, username, password) {
	const encryptedPassword = encrypt(password);

	chrome.identity.getAuthToken({ interactive: true }, function (token) {
		if (chrome.runtime.lastError || !token) {
			alert("Auth Error: " + chrome.runtime.lastError.message);
			return;
		}

		const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/credentials`;

		const body = {
			fields: {
				site: { stringValue: site },
				username: { stringValue: username },
				password: { stringValue: encryptedPassword },
				createdAt: { timestampValue: new Date().toISOString() },
			},
		};

		fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		})
			.then((res) => res.json())
			.then((data) => {
				alert("Credential saved to Firebase!");
				document.getElementById("site").value = "";
				document.getElementById("username").value = "";
				document.getElementById("password").value = "";
			})
			.catch((err) => {
				console.error("Firebase save error:", err);
				alert("Failed to save to Firebase");
			});
	});
}

// On login click
document.getElementById("login-btn").addEventListener("click", function () {
	chrome.identity.getAuthToken({ interactive: true }, function (token) {
		if (chrome.runtime.lastError || !token) {
			alert("Login failed: " + chrome.runtime.lastError.message);
			return;
		}

		fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => res.json())
			.then((userInfo) => {
				const email = userInfo.email;
				const role = getRoleByEmail(email);

				const message =
					role === "super_admin"
						? "Welcome Super Admin"
						: role === "employee"
						? `Welcome ${email}`
						: "Welcome Guest";

				document.getElementById("login-container").style.display = "none";
				document.getElementById("user-info").style.display = "flex";
				document.getElementById("user-email").innerText = message;
				document.getElementById("buttons").style.display = "flex";
				document.getElementById("logout-container").style.display = "block";
			});
	});
});

document.getElementById("logout-btn").addEventListener("click", () => {
	chrome.identity.getAuthToken({ interactive: false }, (token) => {
		if (token) {
			chrome.identity.removeCachedAuthToken({ token }, () => {
				location.reload();
			});
		}
	});
});

document.getElementById("add-credential-btn").addEventListener("click", () => {
	document.getElementById("add-credential-form").style.display = "block";
});

document.getElementById("save-credential-btn").addEventListener("click", () => {
	const site = document.getElementById("site").value;
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

	if (!site || !username || !password) {
		alert("Please fill all fields.");
		return;
	}

	saveToFirebaseWithToken(site, username, password);
});

// Fetch credentials from Firestore and display them
function fetchCredentialsAndShow() {
	chrome.identity.getAuthToken({ interactive: true }, function (token) {
		if (chrome.runtime.lastError || !token) {
			alert("Auth Error: " + chrome.runtime.lastError.message);
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
					alert("No credentials found.");
					return;
				}
				const credentials = data.documents.map(doc => {
					const fields = doc.fields;
					return {
						site: fields.site.stringValue,
						username: fields.username.stringValue,
						password: decrypt(fields.password.stringValue),
						createdAt: fields.createdAt.timestampValue
					};
				});
				showCredentials(credentials);
			})
			.catch((err) => {
				console.error("Fetch credentials error:", err);
				alert("Failed to fetch credentials");
			});
	});
}

// Display credentials in the popup
function showCredentials(credentials) {
	let html = "<h3>Saved Credentials</h3>";
	html += "<ul style='padding-left: 0;'>";
	credentials.forEach(cred => {
		html += `<li style="list-style: none; margin-bottom: 10px;">
			<strong>Site:</strong> ${cred.site}<br>
			<strong>Username:</strong> ${cred.username}<br>
			<strong>Password:</strong> <span style="font-family:monospace;">${cred.password}</span><br>
			<small>Saved: ${new Date(cred.createdAt).toLocaleString()}</small>
		</li>`;
	});
	html += "</ul>";
	const form = document.getElementById("add-credential-form");
	form.style.display = "none";
	const container = document.getElementById("credentials-list");
	if (container) {
		container.innerHTML = html;
		container.style.display = "block";
	}
}

document.getElementById("view-credential-btn").addEventListener("click", fetchCredentialsAndShow);

