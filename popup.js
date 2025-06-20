document.getElementById("login-btn").addEventListener("click", function () {
	chrome.identity.getAuthToken({ interactive: true }, function (token) {
		fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
			headers: {
				Authorization: "Bearer " + token,
			},
		})
			.then((response) => response.json())
			.then((userInfo) => {
				document.getElementById("login-container").style.display = "none";
				document.getElementById("user-info").style.display = "block";
				document.getElementById("user-email").innerText =
					`Logged in as: ${userInfo.email}`;
			})
			.catch((error) => console.error("Error fetching user info", error));
	});
});
