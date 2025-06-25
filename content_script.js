(function () {
  function autofill() {
    const hostname = window.location.hostname;
    const loginForm = document.querySelector("form");
    const emailInput = document.querySelector(
      "input[type='email'], input[name*='email'], input[name*='username'], input[name='login'], input[id='id_login']"
    );
    const passwordInput = document.querySelector(
      "input[type='password'], input[name='password'], input[id='id_password']"
    );

    if (loginForm && (emailInput || passwordInput)) {
      chrome.runtime.sendMessage(
        {
          type: "REQUEST_CREDENTIAL",
          hostname,
        },
        function (response) {
          if (response && response.credential) {
            const { email, username, password } = response.credential;
            if (emailInput) {
              // Prefer email, then username
              emailInput.value = email || username || "";
              emailInput.dispatchEvent(new Event('input', { bubbles: true }));
              emailInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (passwordInput) {
              passwordInput.value = password;
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      );
    }
  }

  // Run on load
  autofill();

  // Also run if DOM changes (for dynamic forms)
  const observer = new MutationObserver(autofill);
  observer.observe(document.body, { childList: true, subtree: true });
})();
