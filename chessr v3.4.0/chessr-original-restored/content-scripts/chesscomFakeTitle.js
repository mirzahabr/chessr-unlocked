var chesscomfaketitle = (function () {
  function _0x56e88b(_0x9ec1c3) {
    return _0x9ec1c3;
  }
  var _0x15f4b3 = "chessr-mock-title";
  var _0x3b81bd = {
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
  var _0x5481f6 = {
    matches: ["*://chess.com/*", "*://*.chess.com/*"],
    world: "MAIN",
    runAt: "document_start",
    main() {
      let _0x4d335c = false;
      let _0x127e36 = "GM";
      try {
        _0x4d335c = localStorage.getItem("chessr-title") === "true";
        _0x127e36 = localStorage.getItem("chessr-title-type") || "GM";
      } catch {}
      let _0xf2ddd6 = null;
      function _0x3b72f9(_0x5c79ce) {
        if (!_0x5c79ce) {
          return null;
        }
        let _0x3dfad4 = _0x5c79ce.cloneNode(true);
        _0x3dfad4
          .querySelectorAll("." + _0x15f4b3)
          .forEach((_0x2e3538) => _0x2e3538.remove());
        return _0x3dfad4.textContent?.trim() || null;
      }
      function _0x1f4284() {
        let _0x597caf = document.querySelector(
          'a[data-user-activity-key="profile"]',
        );
        if (_0x597caf?.href) {
          let _0x140d89 = _0x597caf.href.split("/").filter(Boolean);
          let _0x1a51e2 = _0x140d89[_0x140d89.length - 1];
          if (_0x1a51e2) {
            return _0x1a51e2;
          }
        }
        return (
          _0x3b72f9(
            document.querySelector(
              '[data-user-activity-key="profile"] .sidebar-link-text',
            ),
          ) ||
          _0x3b72f9(document.querySelector(".nav-link-name")) ||
          _0x3b72f9(document.querySelector(".nav-user-header-username")) ||
          (document.documentElement.classList.contains("user-logged-in"), null)
        );
      }
      function _0x413997() {
        document
          .querySelectorAll("." + _0x15f4b3)
          .forEach((_0x4c3d99) => _0x4c3d99.remove());
      }
      function _0x14f1ca(_0x3fd402) {
        document
          .querySelectorAll(
            ".player-tagline, .cc-user-block-component, .user-block-component",
          )
          .forEach((_0x51d812) => {
            let _0x484d3c = _0x51d812.querySelector(
              '[data-test-element="user-tagline-username"]',
            );
            if (
              !_0x484d3c ||
              _0x484d3c.textContent?.trim().toLowerCase() !== _0x3fd402 ||
              _0x51d812.querySelector("." + _0x15f4b3)
            ) {
              return;
            }
            let _0x5f22eb = document.createElement("a");
            _0x5f22eb.className =
              "cc-user-title-component cc-text-x-small-bold " + _0x15f4b3;
            _0x5f22eb.href = "/members/titled-players";
            _0x5f22eb.target = "_blank";
            _0x5f22eb.textContent = _0x127e36;
            _0x484d3c.parentNode?.insertBefore(_0x5f22eb, _0x484d3c);
          });
      }
      function _0x4cd49d(_0x4a0f5c) {
        let _0x4945d0 = new URL(location.href).pathname
          .split("/")
          .filter(Boolean);
        let _0x4b0380 = _0x4945d0.indexOf("member");
        if (_0x4b0380 === -1) {
          return;
        }
        let _0x275bc4 = _0x4945d0[_0x4b0380 + 1]?.toLowerCase();
        if (!_0x275bc4 || _0x275bc4 !== _0x4a0f5c) {
          return;
        }
        let _0x18762d = document.querySelector(".profile-card-username");
        if (
          !_0x18762d ||
          _0x18762d.parentElement?.querySelector("." + _0x15f4b3)
        ) {
          return;
        }
        let _0x21bdbe = document.createElement("a");
        _0x21bdbe.href = "/members/titled-players";
        _0x21bdbe.className = "profile-card-chesstitle " + _0x15f4b3;
        _0x21bdbe.setAttribute("v-tooltip", _0x3b81bd[_0x127e36] || _0x127e36);
        _0x21bdbe.textContent = _0x127e36;
        _0x18762d.parentElement?.insertBefore(_0x21bdbe, _0x18762d);
      }
      function _0x413d38(_0x4f07f6) {
        let _0x4da568 = document.querySelector(".profile-badges");
        if (!_0x4da568 || _0x4da568.querySelector("." + _0x15f4b3)) {
          return;
        }
        let _0x2de0f6 = new URL(location.href).pathname
          .split("/")
          .filter(Boolean);
        let _0x4e9ee1 = _0x2de0f6.indexOf("member");
        if (_0x4e9ee1 === -1) {
          return;
        }
        let _0xf8b8b8 = _0x2de0f6[_0x4e9ee1 + 1]?.toLowerCase();
        if (!_0xf8b8b8 || _0xf8b8b8 !== _0x4f07f6) {
          return;
        }
        let _0x41afce = document.createElement("a");
        _0x41afce.className = "profile-badge " + _0x15f4b3;
        _0x41afce.href = "/members/titled-players";
        _0x41afce.target = "_blank";
        let _0x3b7144 = document.createElement("div");
        _0x3b7144.className = "badges-icon-square badges-titled";
        _0x3b7144.innerHTML =
          '<span class="cc-icon-glyph cc-icon-size-24 badges-icon"><svg aria-hidden="true" data-glyph="game-crown-2" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg" style="fill:currentColor"><path d="M19 20V22H5.00002V20H19ZM1.27002 6.57001C2.30002 5.54001 3.47002 5.54001 4.17002 6.24001C4.74002 6.81001 4.84002 7.64001 4.17002 8.64001L7.24002 10.91C7.31002 10.98 7.47002 10.94 7.54002 10.84L10.37 6.84001H9.87002C8.77002 6.84001 8.30002 6.07001 8.30002 5.34001C8.30002 4.54001 9.00002 3.84001 9.87002 3.84001H10.5V3.11001C10.5 2.21001 11.2 1.51001 12 1.51001C12.83 1.51001 13.5 2.21001 13.5 3.11001V3.84001H14.13C15 3.84001 15.7 4.54001 15.7 5.34001C15.7 6.07001 15.23 6.84001 14.13 6.84001H13.63L16.5 10.84C16.57 10.94 16.67 10.97 16.77 10.91L19.8 8.68001C19.13 7.68001 19.23 6.81001 19.83 6.25001C20.53 5.52001 21.7 5.55001 22.73 6.58001L19 18.01H5.00002L1.27002 6.57001Z"></path></svg></span>';
        let _0x15d259 = document.createElement("div");
        _0x15d259.className = "badges-about";
        _0x15d259.innerHTML =
          '<span class="cc-heading-xx-small badges-name">Titled Player</span> <span class="cc-text-small badges-extra">' +
          (_0x3b81bd[_0x127e36] || _0x127e36) +
          "</span>";
        _0x41afce.appendChild(_0x3b7144);
        _0x41afce.appendChild(_0x15d259);
        let _0x203eca = _0x4da568.querySelector(
          ".profile-badge:has(.streak-badge-about)",
        );
        if (_0x203eca) {
          _0x203eca.insertAdjacentElement("afterend", _0x41afce);
        } else {
          _0x4da568.insertBefore(_0x41afce, _0x4da568.firstChild);
        }
      }
      function _0x2629a2() {
        let _0x2e9b52 = document.querySelector(
          'a[data-user-activity-key="profile"]',
        );
        if (!_0x2e9b52 || _0x2e9b52.querySelector("." + _0x15f4b3)) {
          return;
        }
        let _0x38a882 = _0x2e9b52.querySelector(".sidebar-link-text");
        if (!_0x38a882) {
          return;
        }
        let _0x414c46 = document.createElement("span");
        _0x414c46.className =
          "cc-user-title-component cc-text-x-small-bold " + _0x15f4b3;
        _0x414c46.textContent = _0x127e36;
        _0x414c46.style.marginRight = "4px";
        _0x38a882.insertBefore(_0x414c46, _0x38a882.firstChild);
      }
      function _0x3b2731() {
        if (!_0x4d335c || !/(^|\.)chess\.com$/.test(location.hostname)) {
          return;
        }
        let _0x4627fc = _0x1f4284();
        if (!_0x4627fc) {
          return;
        }
        let _0xe5bb9e = _0x4627fc.toLowerCase();
        _0x14f1ca(_0xe5bb9e);
        _0x4cd49d(_0xe5bb9e);
        _0x413d38(_0xe5bb9e);
        _0x2629a2();
      }
      function _0x194864() {
        if (_0x4d335c) {
          if (_0xf2ddd6) {
            clearTimeout(_0xf2ddd6);
          }
          _0xf2ddd6 = setTimeout(_0x3b2731, 100);
        }
      }
      if (_0x4d335c) {
        _0x194864();
      }
      new MutationObserver(() => {
        if (_0x4d335c) {
          _0x194864();
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.addEventListener("message", (_0x420184) => {
        if (_0x420184.data?.type !== "chessr:setTitle") {
          return;
        }
        let _0x2cf9c2 = !!_0x420184.data.enabled;
        let _0x3e851c =
          typeof _0x420184.data.type_ == "string" && _0x420184.data.type_
            ? _0x420184.data.type_
            : _0x127e36;
        let _0x3044e3 = _0x3e851c !== _0x127e36;
        _0x127e36 = _0x3e851c;
        try {
          localStorage.setItem("chessr-title-type", _0x127e36);
          localStorage.setItem("chessr-title", _0x2cf9c2 ? "true" : "false");
        } catch {}
        if (_0x2cf9c2) {
          _0x4d335c = true;
          if (_0x3044e3) {
            _0x413997();
          }
          _0x3b2731();
        } else {
          _0x4d335c = false;
          _0xf2ddd6 &&= (clearTimeout(_0xf2ddd6), null);
          _0x413997();
        }
      });
    },
  };
  function _0x25bd15(_0x5778ed, ..._0x24379e) {
    if (typeof _0x24379e[0] == "string") {
      _0x5778ed("[wxt] " + _0x24379e.shift(), ..._0x24379e);
    } else {
      _0x5778ed("[wxt]", ..._0x24379e);
    }
  }
  var _0x328022 = {
    debug: (..._0x35f841) => _0x25bd15(console.debug, ..._0x35f841),
    log: (..._0x44edcf) => _0x25bd15(console.log, ..._0x44edcf),
    warn: (..._0x19f0bc) => _0x25bd15(console.warn, ..._0x19f0bc),
    error: (..._0xa48d54) => _0x25bd15(console.error, ..._0xa48d54),
  };
  return (async () => {
    try {
      return await _0x5481f6.main();
    } catch (_0x5d358a) {
      _0x328022.error(
        'The content script "chesscomFakeTitle" crashed on startup!',
        _0x5d358a,
      );
      throw _0x5d358a;
    }
  })();
})();
