const FIREBASE_PROJECT_ID = window.FIREBASE_PROJECT_ID;

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
function saveToFirebaseWithToken(site, email, username, password) {
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
				password: { stringValue: encryptedPassword },
				createdAt: { timestampValue: new Date().toISOString() },
			}
		};
		if (email) body.fields.email = { stringValue: email };
		if (username) body.fields.username = { stringValue: username };

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
				document.getElementById("email").value = "";
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

				if (role === "super_admin") {
					showAdminPanel();
				}
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
	const email = document.getElementById("email").value;
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

	if (!site || !password) {
		alert("Please fill at least Website and Password fields.");
		return;
	}

	saveToFirebaseWithToken(site, email, username, password);
});

function showMessage(msg, type = 'info') {
    let msgDiv = document.getElementById('popup-message');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'popup-message';
        document.body.prepend(msgDiv);
    }
    msgDiv.textContent = msg;
    msgDiv.className = 'popup-message ' + type;
    msgDiv.style.display = 'block';
    setTimeout(() => { msgDiv.style.display = 'none'; }, 2500);
}

function showLoading(show = true) {
    let loadingDiv = document.getElementById('popup-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'popup-loading';
        loadingDiv.innerHTML = '<span class="loader"></span> Loading...';
        document.body.prepend(loadingDiv);
    }
    loadingDiv.style.display = show ? 'block' : 'none';
}

// Wrap fetches with loading
function fetchCredentialsAndShow() {
    showLoading(true);
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
            showLoading(false);
            showMessage("Auth Error: " + chrome.runtime.lastError.message, 'error');
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
                showLoading(false);
                if (!data.documents) {
                    showMessage('No credentials found.', 'info');
                    return;
                }
                // Map Firestore documents to credential objects for display
                // Robustly handle missing or malformed 'createdAt' fields
                const credentials = data.documents.map(doc => {
                    const fields = doc.fields;
                    return {
                        site: fields.site.stringValue, // Website name or domain
                        email: fields.email ? fields.email.stringValue : '', // Optional email
                        username: fields.username ? fields.username.stringValue : '', // Optional username
                        password: decrypt(fields.password.stringValue), // Decrypt the stored password
                        // Use createdAt timestamp if available and valid, otherwise fallback to document ID
                        createdAt: (fields && fields.createdAt && fields.createdAt.timestampValue)
                            ? fields.createdAt.timestampValue
                            : doc.name.split('/').pop()
                    };
                });
                showCredentials(credentials);
            })
            .catch((err) => {
                showLoading(false);
                console.error("Fetch credentials error:", err);
                showMessage("Failed to fetch credentials", 'error');
            });
    });
}

// Display credentials in the popup
function showCredentials(credentials) {
    let html = "<h3>Your Saved Credentials</h3>";
    html += "<ul style='padding-left: 0;'>";
    credentials.forEach(cred => {
        html += `<li style="list-style: none; margin-bottom: 10px; border:1px solid #eee; border-radius:6px; padding:8px;" id="emp-cred-${cred.createdAt}">
            <div class="cred-view">
                <strong>Site:</strong> ${cred.site}<br>
                ${cred.email ? `<strong>Email:</strong> ${cred.email}<br>` : ''}
                ${cred.username ? `<strong>Username:</strong> ${cred.username}<br>` : ''}
                <strong>Password:</strong> <span style="font-family:monospace;">${cred.password}</span><br>
                <small>Saved: ${new Date(cred.createdAt).toLocaleString()}</small><br>
                <button class="edit-emp-cred-btn" data-createdat="${cred.createdAt}">Edit</button>
                <button class="delete-emp-cred-btn" data-createdat="${cred.createdAt}">Delete</button>
            </div>
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
    addEmployeePanelHandlers(credentials);
}

function addEmployeePanelHandlers(credentials) {
    document.querySelectorAll('.delete-emp-cred-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const createdAt = this.getAttribute('data-createdat');
            if (confirm('Are you sure you want to delete this credential?')) {
                deleteEmployeeCredentialByCreatedAt(createdAt);
            }
        });
    });
    document.querySelectorAll('.edit-emp-cred-btn').forEach((btn, idx) => {
        btn.addEventListener('click', function() {
            const createdAt = this.getAttribute('data-createdat');
            const cred = credentials.find(c => c.createdAt === createdAt);
            if (!cred) return;
            const li = document.getElementById(`emp-cred-${createdAt}`);
            li.innerHTML = `<div class="cred-edit">
                <label>Site: <input type="text" id="edit-emp-site-${createdAt}" value="${cred.site}" /></label><br>
                <label>Email: <input type="text" id="edit-emp-email-${createdAt}" value="${cred.email}" /></label><br>
                <label>Username: <input type="text" id="edit-emp-username-${createdAt}" value="${cred.username}" /></label><br>
                <label>Password: <input type="text" id="edit-emp-password-${createdAt}" value="${cred.password}" /></label><br>
                <button class="save-emp-cred-btn" data-createdat="${createdAt}">Save</button>
                <button class="cancel-emp-cred-btn" data-createdat="${createdAt}">Cancel</button>
            </div>`;
            document.querySelector(`#emp-cred-${createdAt} .save-emp-cred-btn`).addEventListener('click', function() {
                const updated = {
                    site: document.getElementById(`edit-emp-site-${createdAt}`).value,
                    email: document.getElementById(`edit-emp-email-${createdAt}`).value,
                    username: document.getElementById(`edit-emp-username-${createdAt}`).value,
                    password: document.getElementById(`edit-emp-password-${createdAt}`).value
                };
                updateEmployeeCredentialByCreatedAt(createdAt, updated);
            });
            document.querySelector(`#emp-cred-${createdAt} .cancel-emp-cred-btn`).addEventListener('click', function() {
                fetchCredentialsAndShow();
            });
        });
    });
}

function deleteEmployeeCredentialByCreatedAt(createdAt) {
    // Find the credential's Firestore ID by createdAt
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
                if (!data.documents) return;
                const doc = data.documents.find(doc => doc.fields.createdAt.timestampValue === createdAt);
                if (!doc) return;
                const credId = doc.name.split('/').pop();
                // Now delete
                const delUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/credentials/${credId}`;
                fetch(delUrl, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then(() => {
                        fetchCredentialsAndShow();
                    })
                    .catch((err) => {
                        console.error("Delete credential error:", err);
                        alert("Failed to delete credential");
                    });
            });
    });
}

function updateEmployeeCredentialByCreatedAt(createdAt, updated) {
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
                if (!data.documents) return;
                const doc = data.documents.find(doc => doc.fields.createdAt.timestampValue === createdAt);
                if (!doc) return;
                const credId = doc.name.split('/').pop();
                // Now update
                const patchUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/credentials/${credId}`;
                const body = {
                    fields: {
                        site: { stringValue: updated.site },
                        email: { stringValue: updated.email },
                        username: { stringValue: updated.username },
                        password: { stringValue: encrypt(updated.password) },
                        createdAt: { timestampValue: createdAt }
                    }
                };
                fetch(patchUrl, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                })
                    .then(() => {
                        fetchCredentialsAndShow();
                    })
                    .catch((err) => {
                        console.error("Update credential error:", err);
                        alert("Failed to update credential");
                    });
            });
    });
}

document.getElementById("view-credential-btn").addEventListener("click", fetchCredentialsAndShow);

function showAdminPanel() {
    document.getElementById("admin-panel").style.display = "block";
    fetchAllCredentialsForAdmin();
}

function fetchAllCredentialsForAdmin() {
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
                    document.getElementById("all-credentials-list").innerHTML = '<li>No credentials found.</li>';
                    return;
                }
                const credentials = data.documents.map((doc, idx) => {
                    const fields = doc.fields;
                    return {
                        id: doc.name.split('/').pop(),
                        site: fields.site.stringValue,
                        email: fields.email ? fields.email.stringValue : '',
                        username: fields.username ? fields.username.stringValue : '',
                        password: decrypt(fields.password.stringValue),
                        owner: fields.email ? fields.email.stringValue : '',
                        createdAt: (fields.createdAt && fields.createdAt.timestampValue) || doc.name.split('/').pop()
                    };
                });
                showAllCredentialsForAdmin(credentials);
            })
            .catch((err) => {
                console.error("Fetch credentials error:", err);
                alert("Failed to fetch credentials");
            });
    });
}

function showAllCredentialsForAdmin(credentials) {
    let html = "";
    credentials.forEach((cred, idx) => {
        html += `<li style="list-style: none; margin-bottom: 10px; border:1px solid #eee; border-radius:6px; padding:8px;" id="admin-cred-${cred.id}">
            <div class="cred-view">
                <strong>Site:</strong> ${cred.site}<br>
                ${cred.email ? `<strong>Email:</strong> ${cred.email}<br>` : ''}
                ${cred.username ? `<strong>Username:</strong> ${cred.username}<br>` : ''}
                <strong>Password:</strong> <span style="font-family:monospace;">${cred.password}</span><br>
                <strong>Owner:</strong> ${cred.owner}<br>
                <small>Saved: ${new Date(cred.createdAt).toLocaleString()}</small><br>
                <button class="edit-admin-cred-btn" data-id="${cred.id}">Edit</button>
                <button class="delete-admin-cred-btn" data-id="${cred.id}">Delete</button>
            </div>
        </li>`;
    });
    document.getElementById("all-credentials-list").innerHTML = html;
    addAdminPanelHandlers(credentials);
}

function addAdminPanelHandlers(credentials) {
    document.querySelectorAll('.delete-admin-cred-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const credId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this credential?')) {
                deleteCredentialById(credId);
            }
        });
    });
    document.querySelectorAll('.edit-admin-cred-btn').forEach((btn, idx) => {
        btn.addEventListener('click', function() {
            const credId = this.getAttribute('data-id');
            const cred = credentials.find(c => c.id === credId);
            if (!cred) return;
            const li = document.getElementById(`admin-cred-${credId}`);
            li.innerHTML = `<div class="cred-edit">
                <label>Site: <input type="text" id="edit-site-${credId}" value="${cred.site}" /></label><br>
                <label>Email: <input type="text" id="edit-email-${credId}" value="${cred.email}" /></label><br>
                <label>Username: <input type="text" id="edit-username-${credId}" value="${cred.username}" /></label><br>
                <label>Password: <input type="text" id="edit-password-${credId}" value="${cred.password}" /></label><br>
                <button class="save-admin-cred-btn" data-id="${credId}">Save</button>
                <button class="cancel-admin-cred-btn" data-id="${credId}">Cancel</button>
            </div>`;
            document.querySelector(`#admin-cred-${credId} .save-admin-cred-btn`).addEventListener('click', function() {
                const updated = {
                    site: document.getElementById(`edit-site-${credId}`).value,
                    email: document.getElementById(`edit-email-${credId}`).value,
                    username: document.getElementById(`edit-username-${credId}`).value,
                    password: document.getElementById(`edit-password-${credId}`).value
                };
                updateCredentialById(credId, updated);
            });
            document.querySelector(`#admin-cred-${credId} .cancel-admin-cred-btn`).addEventListener('click', function() {
                fetchAllCredentialsForAdmin();
            });
        });
    });
}

function updateCredentialById(credId, updated) {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
            alert("Auth Error: " + chrome.runtime.lastError.message);
            return;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/credentials/${credId}`;
        const body = {
            fields: {
                site: { stringValue: updated.site },
                email: { stringValue: updated.email },
                username: { stringValue: updated.username },
                password: { stringValue: encrypt(updated.password) }
            }
        };
        fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
            .then(() => {
                fetchAllCredentialsForAdmin();
            })
            .catch((err) => {
                console.error("Update credential error:", err);
                alert("Failed to update credential");
            });
    });
}

function deleteCredentialById(credId) {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
            alert("Auth Error: " + chrome.runtime.lastError.message);
            return;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/credentials/${credId}`;
        fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(() => {
                fetchAllCredentialsForAdmin();
            })
            .catch((err) => {
                console.error("Delete credential error:", err);
                alert("Failed to delete credential");
            });
    });
}

