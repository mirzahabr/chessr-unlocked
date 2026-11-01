var chesscomanon = (function () {
  function _0x58cad2(_0x2f3605) {
    return _0x2f3605;
  }
  var _0x2e585b = "chessr-anon-blur";
  var _0x2ddce0 = "chessr-anon-style";
  var _0x27408d =
    '.user-username, .user-tagline-username, .cc-user-username-component, .user-username-component, .game-overview-player, .battle-player-username, .modal-game-over-user-username, a[data-user-activity-key="profile"] .sidebar-link-text';
  var _0x11fe6e = {
    matches: ["*://chess.com/*", "*://*.chess.com/*"],
    world: "MAIN",
    runAt: "document_start",
    main() {
      function _0x5eb7ec() {
        if (document.getElementById(_0x2ddce0)) {
          return;
        }
        let _0x290a0f = document.head || document.documentElement;
        if (!_0x290a0f) {
          return;
        }
        let _0x2cfdf2 = document.createElement("style");
        _0x2cfdf2.id = _0x2ddce0;
        _0x2cfdf2.textContent =
          "." +
          _0x2e585b +
          " { filter: blur(5px) !important; user-select: none !important; }";
        _0x290a0f.appendChild(_0x2cfdf2);
      }
      if (document.head) {
        _0x5eb7ec();
      } else {
        document.addEventListener("DOMContentLoaded", _0x5eb7ec, {
          once: true,
        });
      }
      let _0x461709 = false;
      try {
        _0x461709 = localStorage.getItem("chessr-anon") === "true";
      } catch {}
      function _0x1e11a9() {
        document.querySelectorAll(_0x27408d).forEach((_0x45948e) => {
          if (!_0x45948e.classList.contains(_0x2e585b)) {
            _0x45948e.classList.add(_0x2e585b);
          }
        });
      }
      function _0x189fca() {
        document
          .querySelectorAll("." + _0x2e585b)
          .forEach((_0x3bec18) => _0x3bec18.classList.remove(_0x2e585b));
      }
      if (_0x461709) {
        _0x1e11a9();
      }
      new MutationObserver((_0x237b8f) => {
        if (_0x461709) {
          for (let _0x1bcc66 of _0x237b8f) {
            for (let _0x1135c6 of _0x1bcc66.addedNodes) {
              if (_0x1135c6 instanceof HTMLElement) {
                _0x1e11a9();
              }
            }
          }
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.addEventListener("message", (_0xc4fd04) => {
        if (_0xc4fd04.data?.type === "chessr:setAnon") {
          _0x461709 = !!_0xc4fd04.data.value;
          try {
            localStorage.setItem("chessr-anon", _0x461709 ? "true" : "false");
          } catch {}
          if (_0x461709) {
            _0x1e11a9();
          } else {
            _0x189fca();
          }
        }
      });
    },
  };
  function _0x2803e4(_0x23dccd, ..._0x22585e) {
    if (typeof _0x22585e[0] == "string") {
      _0x23dccd("[wxt] " + _0x22585e.shift(), ..._0x22585e);
    } else {
      _0x23dccd("[wxt]", ..._0x22585e);
    }
  }
  var _0x560982 = {
    debug: (..._0x3bd7ca) => _0x2803e4(console.debug, ..._0x3bd7ca),
    log: (..._0xb01633) => _0x2803e4(console.log, ..._0xb01633),
    warn: (..._0x100ec8) => _0x2803e4(console.warn, ..._0x100ec8),
    error: (..._0x34831c) => _0x2803e4(console.error, ..._0x34831c),
  };
  return (async () => {
    try {
      return await _0x11fe6e.main();
    } catch (_0x5e541e) {
      _0x560982.error(
        'The content script "chesscomAnon" crashed on startup!',
        _0x5e541e,
      );
      throw _0x5e541e;
    }
  })();
})();
