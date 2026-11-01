var chesscomanon = (function () {
  function _0x54a1c5(_0x48a470) {
    return _0x48a470;
  }
  var _0x22bbd9 = "x9110e26d-anon-blur";
  var _0x488fc1 = "x9110e26d-anon-style";
  var _0x3054c3 =
    '.user-username, .user-tagline-username, .cc-user-username-component, .user-username-component, .game-overview-player, .battle-player-username, .modal-game-over-user-username, a[data-user-activity-key="profile"] .sidebar-link-text';
  var _0x2e9a55 = {
    matches: ["*://chess.com/*", "*://*.chess.com/*"],
    world: "MAIN",
    runAt: "document_start",
    main() {
      function _0x127877() {
        if (document.getElementById(_0x488fc1)) {
          return;
        }
        let _0x301f7a = document.head || document.documentElement;
        if (!_0x301f7a) {
          return;
        }
        let _0xae56cc = document.createElement("style");
        _0xae56cc.id = _0x488fc1;
        _0xae56cc.textContent =
          "." +
          _0x22bbd9 +
          " { filter: blur(5px) !important; user-select: none !important; }";
        _0x301f7a.appendChild(_0xae56cc);
      }
      if (document.head) {
        _0x127877();
      } else {
        document.addEventListener("DOMContentLoaded", _0x127877, {
          once: true,
        });
      }
      let _0x33d311 = false;
      try {
        _0x33d311 = localStorage.getItem("x9110e26d-anon") === "true";
      } catch {}
      function _0x5c1073() {
        document.querySelectorAll(_0x3054c3).forEach((_0x11ae4e) => {
          if (!_0x11ae4e.classList.contains(_0x22bbd9)) {
            _0x11ae4e.classList.add(_0x22bbd9);
          }
        });
      }
      function _0x29b22a() {
        document
          .querySelectorAll("." + _0x22bbd9)
          .forEach((_0x326326) => _0x326326.classList.remove(_0x22bbd9));
      }
      if (_0x33d311) {
        _0x5c1073();
      }
      new MutationObserver((_0xa09985) => {
        if (_0x33d311) {
          for (let _0x2580a1 of _0xa09985) {
            for (let _0x1b3498 of _0x2580a1.addedNodes) {
              if (_0x1b3498 instanceof HTMLElement) {
                _0x5c1073();
              }
            }
          }
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.addEventListener("message", (_0x352380) => {
        if (_0x352380.data?.type === "x9110e26d:setAnon") {
          _0x33d311 = !!_0x352380.data.value;
          try {
            localStorage.setItem(
              "x9110e26d-anon",
              _0x33d311 ? "true" : "false",
            );
          } catch {}
          if (_0x33d311) {
            _0x5c1073();
          } else {
            _0x29b22a();
          }
        }
      });
    },
  };
  var _0x2904e8 = {
    debug: (..._0x383777) => {
      [..._0x383777];
      return undefined;
    },
    log: (..._0x10fd63) => {
      [..._0x10fd63];
      return undefined;
    },
    warn: (..._0x5a24cf) => {
      [..._0x5a24cf];
      return undefined;
    },
    error: (..._0x2fa1cf) => {
      [..._0x2fa1cf];
      return undefined;
    },
  };
  return (async () => {
    try {
      return await _0x2e9a55.main();
    } catch (_0x68acd8) {
      _0x2904e8.error(
        'The content script "chesscomAnon" crashed on startup!',
        _0x68acd8,
      );
      throw _0x68acd8;
    }
  })();
})();
