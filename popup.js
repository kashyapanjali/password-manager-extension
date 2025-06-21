// Function to return role based on email
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

  function encrypt(text) {
	return CryptoJS.AES.encrypt(text, "your-secret-key").toString();
  }
  
  
  // Handle login button click
  document.getElementById("login-btn").addEventListener("click", function () {
	chrome.identity.getAuthToken({ interactive: true }, function (token) {
	  if (chrome.runtime.lastError) {
		console.error("Auth Error:", chrome.runtime.lastError.message);
		return;
	  }
  
	  fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
		headers: {
		  Authorization: "Bearer " + token,
		},
	  })
		.then((response) => response.json())
		.then((userInfo) => {
		  const email = userInfo.email;
		  const role = getRoleByEmail(email);
  
		  let message = "";
		  if (role === "super_admin") {
			message = "Welcome Super Admin";
		  } else if (role === "employee") {
			message = `Welcome ${email}`;
		  } else {
			message = "Welcome Guest";
		  }
  
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
  
  // Attach logout button
  document.getElementById("logout-btn").addEventListener("click", logoutAndClearToken);
  
  document.getElementById("save-credential-btn").addEventListener("click", () => {
	const site = document.getElementById("site").value;
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
  
	const encryptedPassword = encrypt(password);
  
	const credential = { site, username, password: encryptedPassword };
  
	chrome.storage.local.get({ credentials: [] }, (result) => {
	  const updated = [...result.credentials, credential];
	  chrome.storage.local.set({ credentials: updated }, () => {
		alert("Credential saved!");
		// Clear inputs
		document.getElementById("site").value = "";
		document.getElementById("username").value = "";
		document.getElementById("password").value = "";
	  });
	});
  });

  document.getElementById("add-credential-btn").addEventListener("click", () => {
	document.getElementById("add-credential-form").style.display = "block";
  });