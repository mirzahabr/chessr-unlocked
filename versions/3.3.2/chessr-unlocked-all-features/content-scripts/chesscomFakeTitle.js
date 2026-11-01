// Chessr content script: "chesscomFakeTitle"
// Runs in the MAIN world on chess.com at document_start.
// When enabled, it decorates the logged-in user's own name across the chess.com
// UI (taglines, profile card, profile badges, sidebar link) with a fake titled-
// player badge (GM, IM, etc.). Purely cosmetic / local — nothing is sent anywhere.
// Toggled via a window message ("chessr:setTitle") and persisted in localStorage.

var chesscomFakeTitle = (function () {
  // Marker class placed on every element this script injects, so they can be
  // found again for removal and de-duplication.
  const INJECTED_CLASS = "chessr-mock-title";

  // Human-readable title names, keyed by the short code stored in localStorage.
  const TITLE_LABELS = {
    GM: "Grandmaster",
    IM: "International Master",
    FM: "FIDE Master",
    NM: "National Master",
    CM: "FIDE Candidate Master",
    WGM: "Woman Grandmaster",
    WIM: "Woman International Master",
    WFM: "Woman FIDE Master",
    WCM: "FIDE Woman Candidate Master",
    WNM: "Woman National Master",
  };

  const contentScript = {
    matches: ["*://chess.com/*", "*://*.chess.com/*"],
    world: "MAIN",
    runAt: "document_start",

    main() {
      // Persisted state: whether the fake title is enabled, and which title code.
      let titleEnabled = false;
      let titleCode = "GM";
      try {
        titleEnabled = localStorage.getItem("chessr-title") === "true";
        titleCode = localStorage.getItem("chessr-title-type") || "GM";
      } catch {}

      // Pending debounce timer for reapplying badges after DOM mutations.
      let applyTimer = null;

      // Read an element's text content, ignoring any badges we've injected.
      function readOwnText(element) {
        if (!element) {
          return null;
        }
        const clone = element.cloneNode(true);
        clone.querySelectorAll("." + INJECTED_CLASS).forEach((node) => node.remove());
        return clone.textContent?.trim() || null;
      }

      // Determine the currently logged-in user's username, trying the profile
      // link href first and then various header/sidebar text elements.
      function getLoggedInUsername() {
        const profileLink = document.querySelector('a[data-user-activity-key="profile"]');
        if (profileLink?.href) {
          const segments = profileLink.href.split("/").filter(Boolean);
          const lastSegment = segments[segments.length - 1];
          if (lastSegment) {
            return lastSegment;
          }
        }
        return (
          readOwnText(document.querySelector('[data-user-activity-key="profile"] .sidebar-link-text')) ||
          readOwnText(document.querySelector(".nav-link-name")) ||
          readOwnText(document.querySelector(".nav-user-header-username")) ||
          (document.documentElement.classList.contains("user-logged-in"), null)
        );
      }

      // Remove every badge this script has injected.
      function removeInjectedBadges() {
        document.querySelectorAll("." + INJECTED_CLASS).forEach((node) => node.remove());
      }

      // Add a title chip next to the username inside player taglines / user blocks.
      function decorateTaglines(username) {
        document
          .querySelectorAll(".player-tagline, .cc-user-block-component, .user-block-component")
          .forEach((block) => {
            const usernameEl = block.querySelector('[data-test-element="user-tagline-username"]');
            if (
              !usernameEl ||
              usernameEl.textContent?.trim().toLowerCase() !== username ||
              block.querySelector("." + INJECTED_CLASS)
            ) {
              return;
            }
            const titleLink = document.createElement("a");
            titleLink.className = "cc-user-title-component cc-text-x-small-bold " + INJECTED_CLASS;
            titleLink.href = "/members/titled-players";
            titleLink.target = "_blank";
            titleLink.textContent = titleCode;
            usernameEl.parentNode?.insertBefore(titleLink, usernameEl);
          });
      }

      // On the user's own profile page, add the title next to the profile-card name.
      function decorateProfileCard(username) {
        const pathSegments = new URL(location.href).pathname.split("/").filter(Boolean);
        const memberIndex = pathSegments.indexOf("member");
        if (memberIndex === -1) {
          return;
        }
        const profileUsername = pathSegments[memberIndex + 1]?.toLowerCase();
        if (!profileUsername || profileUsername !== username) {
          return;
        }
        const usernameEl = document.querySelector(".profile-card-username");
        if (!usernameEl || usernameEl.parentElement?.querySelector("." + INJECTED_CLASS)) {
          return;
        }
        const titleLink = document.createElement("a");
        titleLink.href = "/members/titled-players";
        titleLink.className = "profile-card-chesstitle " + INJECTED_CLASS;
        titleLink.setAttribute("v-tooltip", TITLE_LABELS[titleCode] || titleCode);
        titleLink.textContent = titleCode;
        usernameEl.parentElement?.insertBefore(titleLink, usernameEl);
      }

      // On the user's own profile page, add a "Titled Player" badge to the badges row.
      function decorateProfileBadges(username) {
        const badgesRow = document.querySelector(".profile-badges");
        if (!badgesRow || badgesRow.querySelector("." + INJECTED_CLASS)) {
          return;
        }
        const pathSegments = new URL(location.href).pathname.split("/").filter(Boolean);
        const memberIndex = pathSegments.indexOf("member");
        if (memberIndex === -1) {
          return;
        }
        const profileUsername = pathSegments[memberIndex + 1]?.toLowerCase();
        if (!profileUsername || profileUsername !== username) {
          return;
        }

        const badge = document.createElement("a");
        badge.className = "profile-badge " + INJECTED_CLASS;
        badge.href = "/members/titled-players";
        badge.target = "_blank";

        const icon = document.createElement("div");
        icon.className = "badges-icon-square badges-titled";
        icon.innerHTML =
          '<span class="cc-icon-glyph cc-icon-size-24 badges-icon"><svg aria-hidden="true" data-glyph="game-crown-2" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg" style="fill:currentColor"><path d="M19 20V22H5.00002V20H19ZM1.27002 6.57001C2.30002 5.54001 3.47002 5.54001 4.17002 6.24001C4.74002 6.81001 4.84002 7.64001 4.17002 8.64001L7.24002 10.91C7.31002 10.98 7.47002 10.94 7.54002 10.84L10.37 6.84001H9.87002C8.77002 6.84001 8.30002 6.07001 8.30002 5.34001C8.30002 4.54001 9.00002 3.84001 9.87002 3.84001H10.5V3.11001C10.5 2.21001 11.2 1.51001 12 1.51001C12.83 1.51001 13.5 2.21001 13.5 3.11001V3.84001H14.13C15 3.84001 15.7 4.54001 15.7 5.34001C15.7 6.07001 15.23 6.84001 14.13 6.84001H13.63L16.5 10.84C16.57 10.94 16.67 10.97 16.77 10.91L19.8 8.68001C19.13 7.68001 19.23 6.81001 19.83 6.25001C20.53 5.52001 21.7 5.55001 22.73 6.58001L19 18.01H5.00002L1.27002 6.57001Z"></path></svg></span>';

        const about = document.createElement("div");
        about.className = "badges-about";
        about.innerHTML =
          '<span class="cc-heading-xx-small badges-name">Titled Player</span> ' +
          '<span class="cc-text-small badges-extra">' +
          (TITLE_LABELS[titleCode] || titleCode) +
          "</span>";

        badge.appendChild(icon);
        badge.appendChild(about);

        // Place the badge right after the streak badge if present, else at the front.
        const streakBadge = badgesRow.querySelector(".profile-badge:has(.streak-badge-about)");
        if (streakBadge) {
          streakBadge.insertAdjacentElement("afterend", badge);
        } else {
          badgesRow.insertBefore(badge, badgesRow.firstChild);
        }
      }

      // Add the title chip inside the left-sidebar profile link.
      function decorateSidebarLink() {
        const profileLink = document.querySelector('a[data-user-activity-key="profile"]');
        if (!profileLink || profileLink.querySelector("." + INJECTED_CLASS)) {
          return;
        }
        const linkText = profileLink.querySelector(".sidebar-link-text");
        if (!linkText) {
          return;
        }
        const titleChip = document.createElement("span");
        titleChip.className = "cc-user-title-component cc-text-x-small-bold " + INJECTED_CLASS;
        titleChip.textContent = titleCode;
        titleChip.style.marginRight = "4px";
        linkText.insertBefore(titleChip, linkText.firstChild);
      }

      // Apply every decoration for the current user (only on chess.com).
      function applyTitleEverywhere() {
        if (!titleEnabled || !/(^|\.)chess\.com$/.test(location.hostname)) {
          return;
        }
        const username = getLoggedInUsername();
        if (!username) {
          return;
        }
        const usernameLower = username.toLowerCase();
        decorateTaglines(usernameLower);
        decorateProfileCard(usernameLower);
        decorateProfileBadges(usernameLower);
        decorateSidebarLink();
      }

      // Debounced re-apply, used on DOM mutations.
      function scheduleApply() {
        if (titleEnabled) {
          if (applyTimer) {
            clearTimeout(applyTimer);
          }
          applyTimer = setTimeout(applyTitleEverywhere, 100);
        }
      }

      if (titleEnabled) {
        scheduleApply();
      }

      // chess.com re-renders constantly (SPA); reapply as the DOM changes.
      new MutationObserver(() => {
        if (titleEnabled) {
          scheduleApply();
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      // Allow the rest of the extension to toggle the fake title / change the code.
      window.addEventListener("message", (event) => {
        if (event.data?.type !== "chessr:setTitle") {
          return;
        }
        const enabled = !!event.data.enabled;
        const newCode =
          typeof event.data.type_ == "string" && event.data.type_ ? event.data.type_ : titleCode;
        const codeChanged = newCode !== titleCode;
        titleCode = newCode;
        try {
          localStorage.setItem("chessr-title-type", titleCode);
          localStorage.setItem("chessr-title", enabled ? "true" : "false");
        } catch {}
        if (enabled) {
          titleEnabled = true;
          if (codeChanged) {
            removeInjectedBadges();
          }
          applyTitleEverywhere();
        } else {
          titleEnabled = false;
          applyTimer &&= (clearTimeout(applyTimer), null);
          removeInjectedBadges();
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
      logger.error('The content script "chesscomFakeTitle" crashed on startup!', error);
      throw error;
    }
  })();
})();
