// Chessr content script: "chesscomAnon"
// Runs in the MAIN world on chess.com at document_start.
// Blurs opponent/player usernames on the page when "anonymous mode" is enabled,
// so screenshots/streams don't leak identities. Toggled via a window message
// ("chessr:setAnon") and persisted in localStorage under "chessr-anon".

var chesscomAnon = (function () {
  const BLUR_CLASS = "chessr-anon-blur";
  const STYLE_ELEMENT_ID = "chessr-anon-style";

  // Selectors for every place chess.com renders a username we want to hide.
  const USERNAME_SELECTOR =
    '.user-username, .user-tagline-username, .cc-user-username-component, ' +
    '.user-username-component, .game-overview-player, .battle-player-username, ' +
    '.modal-game-over-user-username, a[data-user-activity-key="profile"] .sidebar-link-text';

  const contentScript = {
    matches: ["*://chess.com/*", "*://*.chess.com/*"],
    world: "MAIN",
    runAt: "document_start",

    main() {
      // Inject the stylesheet that defines how blurred usernames look.
      function injectBlurStyle() {
        if (document.getElementById(STYLE_ELEMENT_ID)) {
          return;
        }
        const styleParent = document.head || document.documentElement;
        if (!styleParent) {
          return;
        }
        const styleElement = document.createElement("style");
        styleElement.id = STYLE_ELEMENT_ID;
        styleElement.textContent =
          "." + BLUR_CLASS + " { filter: blur(5px) !important; user-select: none !important; }";
        styleParent.appendChild(styleElement);
      }

      if (document.head) {
        injectBlurStyle();
      } else {
        document.addEventListener("DOMContentLoaded", injectBlurStyle, { once: true });
      }

      // Load the persisted anonymous-mode preference.
      let anonEnabled = false;
      try {
        anonEnabled = localStorage.getItem("chessr-anon") === "true";
      } catch {}

      // Add the blur class to every current username element.
      function blurUsernames() {
        document.querySelectorAll(USERNAME_SELECTOR).forEach((element) => {
          if (!element.classList.contains(BLUR_CLASS)) {
            element.classList.add(BLUR_CLASS);
          }
        });
      }

      // Remove the blur class from every element that currently has it.
      function unblurUsernames() {
        document
          .querySelectorAll("." + BLUR_CLASS)
          .forEach((element) => element.classList.remove(BLUR_CLASS));
      }

      if (anonEnabled) {
        blurUsernames();
      }

      // Re-apply blurring whenever chess.com inserts new username elements
      // (navigation, live game updates, modals, etc.).
      new MutationObserver((mutations) => {
        if (anonEnabled) {
          for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
              if (addedNode instanceof HTMLElement) {
                blurUsernames();
              }
            }
          }
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      // Allow the rest of the extension to toggle anonymous mode at runtime.
      window.addEventListener("message", (event) => {
        if (event.data?.type === "chessr:setAnon") {
          anonEnabled = !!event.data.value;
          try {
            localStorage.setItem("chessr-anon", anonEnabled ? "true" : "false");
          } catch {}
          if (anonEnabled) {
            blurUsernames();
          } else {
            unblurUsernames();
          }
        }
      });
    },
  };

  // WXT-style logger that prefixes all output with "[wxt]".
  function logWithPrefix(consoleMethod, ...args) {
    if (typeof args[0] == "string") {
      consoleMethod("[wxt] " + args.shift(), ...args);
    } else {
      consoleMethod("[wxt]", ...args);
    }
  }

  const logger = {
    debug: (...args) => logWithPrefix(console.debug, ...args),
    log: (...args) => logWithPrefix(console.log, ...args),
    warn: (...args) => logWithPrefix(console.warn, ...args),
    error: (...args) => logWithPrefix(console.error, ...args),
  };

  // Run the content script, logging any startup failure.
  return (async () => {
    try {
      return await contentScript.main();
    } catch (error) {
      logger.error('The content script "chesscomAnon" crashed on startup!', error);
      throw error;
    }
  })();
})();
