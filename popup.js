// Function to return role based on email
function getRoleByEmail(email) {
	const roles = {
		"anjalikashyap9608@gmail.com": "super_admin",
		"employee1@example.com": "employee",
		"employee2@example.com": "employee",
	};

	return roles[email] || "guest";
}

// On login button click, perform Google Sign-In
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

				// Show a custom message based on the role
				let message = "";
				if (role === "super_admin") {
					message = "Welcome Super Admin";
				} else if (role === "employee") {
					message = `Welcome ${email}`;
				} else {
					message = "Welcome Guest";
				}

				// Update the popup UI
				document.getElementById("login-container").style.display = "none";
				document.getElementById("user-info").style.display = "block";
				document.getElementById("user-email").innerText = message;
				document.getElementById("buttons").style.display = "block";
			})
			.catch((error) => console.error("Error fetching user info:", error));
	});
});
