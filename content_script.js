(function () {
  const hostname = window.location.hostname;
  const loginForm = document.querySelector("form");
  const emailInput = document.querySelector("input[type='email'], input[name*='email'], input[name*='username']");
  const passwordInput = document.querySelector("input[type='password']");

  if (loginForm && emailInput && passwordInput) {
    chrome.runtime.sendMessage({
      type: "REQUEST_CREDENTIAL",
      hostname,
    }, function (response) {
      if (response && response.credential) {
        const { username, password } = response.credential;
        emailInput.value = username;
        passwordInput.value = password;
      }
    });
  }
})();
