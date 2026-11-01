// Chessr background service worker (WXT-generated entrypoint).
//
// Responsibilities:
//   - Keep a small in-memory ring buffer of recent warn/error logs for diagnostics.
//   - Attach to tabs via the Chrome DevTools Protocol ("debugger" permission) and
//     dispatch synthetic mouse presses / drags / clicks on request from content
//     scripts (used to play moves on the board).
//   - Open and track the extension's stream.html tab.
//   - Handle runtime messages (fetch bundled files, CDP input, diagnostics, etc.).
//   - Open the welcome page on install / toolbar-icon click.
//
// Callers: the "cdpMouseMove"/"cdpClick"/"fetchExtensionFile"/"open_stream"/
// "getBackgroundDiag" messages are sent via chrome.runtime.sendMessage from the
// React overlay bundle at content-scripts/content.js (the isolated-world content
// script). content.js relays low-level "chessr:cdpMouseMove"/"chessr:cdpClick"
// requests that originate in content-scripts/pageContext.js (the MAIN-world
// script that talks to the page's own board APIs) via window.postMessage — see
// the project-documentation/ folder at the repo root for the full message flow.

var background = (function () {
  // Prefer the WebExtension `browser` namespace when available, else `chrome`.
  const browserApi = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;

  // WXT helper: normalize an entrypoint definition into { main }.
  function defineBackground(definition) {
    if (definition == null || typeof definition == "function") {
      return { main: definition };
    } else {
      return definition;
    }
  }

  // ---- In-memory diagnostic log ring buffer ---------------------------------

  const MAX_LOG_ENTRIES = 100;
  const logEntries = [];

  function recordLog(level, args) {
    if (logEntries.length >= MAX_LOG_ENTRIES) {
      logEntries.shift();
    }
    const message = args
      .map((arg) => {
        if (typeof arg == "string") {
          return arg;
        }
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ")
      .slice(0, 800);
    logEntries.push({ ts: Date.now(), level, msg: message });
  }

  // Wrap console.warn / console.error so their output is also captured above.
  const originalWarn = (() => {}).bind(console);
  const originalError = (() => {}).bind(console);
  console.warn = (...args) => {
    recordLog("warn", args);
    originalWarn(...args);
  };
  console.error = (...args) => {
    recordLog("error", args);
    originalError(...args);
  };

  // Capture uncaught errors / rejections in the worker for diagnostics.
  if (typeof self !== "undefined" && typeof self.addEventListener == "function") {
    self.addEventListener("error", (event) => {
      recordLog("error", [
        "[bg.onerror]",
        event?.message || String(event),
        (event?.filename || "?") + ":" + (event?.lineno || "?"),
      ]);
    });
    self.addEventListener("unhandledrejection", (event) => {
      recordLog("error", ["[bg.unhandledrejection]", String(event?.reason)]);
    });
  }

  // ---- State ----------------------------------------------------------------

  const bootedAt = Date.now();
  const streamTabIds = new Set(); // tabs showing stream.html
  const debuggerAttachedTabIds = new Set(); // tabs we've attached the CDP debugger to

  // ---- Chrome DevTools Protocol (CDP) helpers -------------------------------

  // Attach the debugger to a tab (idempotent). Returns whether it's attached.
  async function ensureDebuggerAttached(tabId) {
    if (debuggerAttachedTabIds.has(tabId)) {
      return true;
    }
    try {
      await new Promise((resolve, reject) => {
        const debuggerApi = browserApi.debugger;
        if (!debuggerApi?.attach) {
          return reject(Error("debugger API unavailable"));
        }
        debuggerApi.attach({ tabId }, "1.3", () => {
          const lastError = browserApi.runtime.lastError;
          if (lastError) {
            return reject(Error(lastError.message));
          }
          resolve();
        });
      });
      debuggerAttachedTabIds.add(tabId);
      return true;
    } catch (error) {
      recordLog("warn", ["[cdp] attach failed", String(error)]);
      return false;
    }
  }

  // Send a single CDP command to a tab and resolve with its result.
  function sendDebuggerCommand(tabId, method, params) {
    return new Promise((resolve, reject) => {
      browserApi.debugger.sendCommand({ tabId }, method, params, (result) => {
        const lastError = browserApi.runtime.lastError;
        if (lastError) {
          return reject(Error(lastError.message));
        }
        resolve(result);
      });
    });
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  // Simulate a left-button drag from (fromX, fromY) to (toX, toY) in 10 steps,
  // with optional delays before the press (pickDelay), before moving
  // (selectDelay), and spread across the move (moveDelay, split over the steps).
  async function performCdpDrag(
    tabId,
    fromX,
    fromY,
    toX,
    toY,
    pickDelay = 0,
    selectDelay = 0,
    moveDelay = 0
  ) {
    if (!(await ensureDebuggerAttached(tabId))) {
      return false;
    }
    try {
      if (pickDelay > 0) {
        await delay(pickDelay);
      }
      await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: fromX,
        y: fromY,
        button: "left",
        clickCount: 1,
      });
      if (selectDelay > 0) {
        await delay(selectDelay);
      }
      const perStepDelay = moveDelay > 0 ? moveDelay / 10 : 0;
      for (let step = 1; step <= 10; step++) {
        await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: fromX + (toX - fromX) * (step / 10),
          y: fromY + (toY - fromY) * (step / 10),
          button: "left",
        });
        if (perStepDelay > 0) {
          await delay(perStepDelay);
        }
      }
      await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: toX,
        y: toY,
        button: "left",
        clickCount: 1,
      });
      return true;
    } catch (error) {
      recordLog("warn", ["[cdp] mouseMove failed", String(error)]);
      return false;
    }
  }

  // ---- Background entrypoint ------------------------------------------------

  const backgroundEntrypoint = defineBackground(() => {
    // Open the welcome page on fresh install.
    browserApi.runtime.onInstalled.addListener((details) => {
      if (details.reason === "install") {
        const version = browserApi.runtime.getManifest().version;
        browserApi.tabs
          .create({
            url: "https://chessr.io/welcome?v=" + version + "&utm_source=extension_install",
          })
          .catch(() => {});
      }
    });

    // Open the welcome page when the toolbar icon is clicked.
    browserApi.action.onClicked.addListener(() => {
      const version = browserApi.runtime.getManifest().version;
      browserApi.tabs
        .create({
          url: "https://chessr.io/welcome?v=" + version + "&utm_source=extension_icon",
        })
        .catch(() => {});
    });

    // Reconcile stream-tab tracking with reality at startup.
    browserApi.tabs
      .query({ url: browserApi.runtime.getURL("/stream.html") })
      .then((tabs) => {
        if (tabs.length === 0) {
          browserApi.storage.local
            .set({ chessr_stream_open: { value: false, ts: Date.now() } })
            .catch(() => {});
        } else {
          for (const tab of tabs) {
            if (tab.id !== undefined) {
              streamTabIds.add(tab.id);
            }
          }
        }
      })
      .catch(() => {});

    // Forget the debugger attachment when it detaches.
    const debuggerApi = browserApi.debugger;
    if (debuggerApi?.onDetach?.addListener) {
      debuggerApi.onDetach.addListener((source) => {
        if (source.tabId !== undefined) {
          debuggerAttachedTabIds.delete(source.tabId);
        }
      });
    }

    // Clean up tracking when a tab is closed.
    browserApi.tabs.onRemoved.addListener((tabId) => {
      debuggerAttachedTabIds.delete(tabId);
      if (streamTabIds.has(tabId)) {
        streamTabIds.delete(tabId);
        browserApi.storage.local.set({
          chessr_stream_open: { value: false, ts: Date.now() },
        });
      }
    });

    // Runtime message router.
    browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Read a file bundled with the extension and return its text.
      if (message?.type === "fetchExtensionFile" && message.path) {
        fetch(browserApi.runtime.getURL(message.path))
          .then((response) => response.text())
          .then((text) => sendResponse({ text }))
          .catch((error) => sendResponse({ error: error.message }));
        return true; // async response
      }

      // Perform a synthetic drag via CDP.
      if (message?.type === "cdpMouseMove" && sender.tab?.id !== undefined) {
        const { fromX, fromY, toX, toY, pickDelay, selectDelay, moveDelay } = message;
        performCdpDrag(
          sender.tab.id,
          fromX,
          fromY,
          toX,
          toY,
          pickDelay ?? 0,
          selectDelay ?? 0,
          moveDelay ?? 0
        )
          .then((ok) => sendResponse({ ok }))
          .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true; // async response
      }

      // Perform a synthetic click via CDP.
      if (message?.type === "cdpClick" && sender.tab?.id !== undefined) {
        const { x, y } = message;
        const tabId = sender.tab.id;
        (async () => {
          if (!(await ensureDebuggerAttached(tabId))) {
            return sendResponse({ ok: false });
          }
          try {
            await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
              type: "mousePressed",
              x,
              y,
              button: "left",
              clickCount: 1,
            });
            await sendDebuggerCommand(tabId, "Input.dispatchMouseEvent", {
              type: "mouseReleased",
              x,
              y,
              button: "left",
              clickCount: 1,
            });
            sendResponse({ ok: true });
          } catch (error) {
            sendResponse({ ok: false, error: String(error) });
          }
        })();
        return true; // async response
      }

      // Open the stream.html tab and track it.
      if (message?.type === "open_stream") {
        browserApi.tabs
          .create({ url: browserApi.runtime.getURL("/stream.html") })
          .then((tab) => {
            if (tab.id !== undefined) {
              streamTabIds.add(tab.id);
            }
          });
        return false;
      }

      // Return background diagnostics (uptime + recent logs).
      if (message?.type === "getBackgroundDiag") {
        sendResponse({
          meta: {
            bootedAt: new Date(bootedAt).toISOString(),
            uptimeSeconds: Math.round((Date.now() - bootedAt) / 1000),
            extensionVersion: browserApi.runtime.getManifest().version,
          },
          logs: logEntries.slice(-50),
        });
        return false;
      }
    });
  });

  // ---- WXT MatchPattern utility (URL match-pattern parsing/testing) ----------

  const MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [...MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null) {
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        }
        const [, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls) {
        return true;
      }
      const parsed =
        typeof url == "string"
          ? new URL(url)
          : url instanceof Location
            ? new URL(url.href)
            : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http") {
          return this.isHttpMatch(parsed);
        }
        if (protocol === "https") {
          return this.isHttpsMatch(parsed);
        }
        if (protocol === "file") {
          return this.isFileMatch(parsed);
        }
        if (protocol === "ftp") {
          return this.isFtpMatch(parsed);
        }
        if (protocol === "urn") {
          return this.isUrnMatch(parsed);
        }
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch) {
        return false;
      }
      const hostnameRegexes = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, "")),
      ];
      const pathnameRegex = this.convertPatternToRegex(this.pathnameMatch);
      return (
        !!hostnameRegexes.find((regex) => regex.test(url.hostname)) &&
        pathnameRegex.test(url.pathname)
      );
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
      return RegExp("^" + escaped + "$");
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  const MatchPatternClass = MatchPattern;
  MatchPatternClass.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];

  const InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super('Invalid match pattern "' + matchPattern + '": ' + reason);
    }
  };

  function validateProtocol(matchPattern, protocol) {
    if (!MatchPatternClass.PROTOCOLS.includes(protocol) && protocol !== "*") {
      throw new InvalidMatchPattern(
        matchPattern,
        protocol + " not a valid protocol (" + MatchPatternClass.PROTOCOLS.join(", ") + ")"
      );
    }
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":")) {
      throw new InvalidMatchPattern(matchPattern, "Hostname cannot include a port");
    }
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) {
      throw new InvalidMatchPattern(
        matchPattern,
        "If using a wildcard (*), it must go at the start of the hostname"
      );
    }
  }

  // ---- WXT-style logger ------------------------------------------------------

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

  // ---- Boot ------------------------------------------------------------------

  let result;
  try {
    result = backgroundEntrypoint.main();
    result instanceof Promise;
  } catch (error) {
    logger.error("The background crashed on startup!");
    throw error;
  }
  return result;
})();
