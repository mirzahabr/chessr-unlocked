var chesscomfaketitle = (function () {
  function _0x2a4307(_0x1967b0) {
    return _0x1967b0;
  }
  var _0x544d61 = "x9110e26d-mock-title";
  var _0x3fa086 = {
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
  var _0x4e3a9a = {
    matches: ["*://chess.com/*", "*://*.chess.com/*"],
    world: "MAIN",
    runAt: "document_start",
    main() {
      let _0x598dc8 = false;
      let _0x54eae7 = "GM";
      try {
        _0x598dc8 = localStorage.getItem("x9110e26d-title") === "true";
        _0x54eae7 = localStorage.getItem("x9110e26d-title-type") || "GM";
      } catch {}
      let _0xa990d4 = null;
      function _0x5e4dc1(_0x22ee36) {
        if (!_0x22ee36) {
          return null;
        }
        let _0x3f2c81 = _0x22ee36.cloneNode(true);
        _0x3f2c81
          .querySelectorAll("." + _0x544d61)
          .forEach((_0xc12952) => _0xc12952.remove());
        return _0x3f2c81.textContent?.trim() || null;
      }
      function _0x433954() {
        let _0x6a88c2 = document.querySelector(
          'a[data-user-activity-key="profile"]',
        );
        if (_0x6a88c2?.href) {
          let _0x205be7 = _0x6a88c2.href.split("/").filter(Boolean);
          let _0x63bdfb = _0x205be7[_0x205be7.length - 1];
          if (_0x63bdfb) {
            return _0x63bdfb;
          }
        }
        return (
          _0x5e4dc1(
            document.querySelector(
              '[data-user-activity-key="profile"] .sidebar-link-text',
            ),
          ) ||
          _0x5e4dc1(document.querySelector(".nav-link-name")) ||
          _0x5e4dc1(document.querySelector(".nav-user-header-username")) ||
          (document.documentElement.classList.contains("user-logged-in"), null)
        );
      }
      function _0x30ef22() {
        document
          .querySelectorAll("." + _0x544d61)
          .forEach((_0x5a08b2) => _0x5a08b2.remove());
      }
      function _0x3f3989(_0x5e73c2) {
        document
          .querySelectorAll(
            ".player-tagline, .cc-user-block-component, .user-block-component",
          )
          .forEach((_0x31c5c2) => {
            let _0x3214bc = _0x31c5c2.querySelector(
              '[data-test-element="user-tagline-username"]',
            );
            if (
              !_0x3214bc ||
              _0x3214bc.textContent?.trim().toLowerCase() !== _0x5e73c2 ||
              _0x31c5c2.querySelector("." + _0x544d61)
            ) {
              return;
            }
            let _0x1d88f0 = document.createElement("a");
            _0x1d88f0.className =
              "cc-user-title-component cc-text-x-small-bold " + _0x544d61;
            _0x1d88f0.href = "/members/titled-players";
            _0x1d88f0.target = "_blank";
            _0x1d88f0.textContent = _0x54eae7;
            _0x3214bc.parentNode?.insertBefore(_0x1d88f0, _0x3214bc);
          });
      }
      function _0x3eacfe(_0x8a1d7a) {
        let _0x2dfa4e = new URL(location.href).pathname
          .split("/")
          .filter(Boolean);
        let _0x5923c9 = _0x2dfa4e.indexOf("member");
        if (_0x5923c9 === -1) {
          return;
        }
        let _0x4a4af1 = _0x2dfa4e[_0x5923c9 + 1]?.toLowerCase();
        if (!_0x4a4af1 || _0x4a4af1 !== _0x8a1d7a) {
          return;
        }
        let _0xfedb2d = document.querySelector(".profile-card-username");
        if (
          !_0xfedb2d ||
          _0xfedb2d.parentElement?.querySelector("." + _0x544d61)
        ) {
          return;
        }
        let _0x375366 = document.createElement("a");
        _0x375366.href = "/members/titled-players";
        _0x375366.className = "profile-card-chesstitle " + _0x544d61;
        _0x375366.setAttribute("v-tooltip", _0x3fa086[_0x54eae7] || _0x54eae7);
        _0x375366.textContent = _0x54eae7;
        _0xfedb2d.parentElement?.insertBefore(_0x375366, _0xfedb2d);
      }
      function _0x4f2c92(_0x48bf09) {
        let _0x51ef20 = document.querySelector(".profile-badges");
        if (!_0x51ef20 || _0x51ef20.querySelector("." + _0x544d61)) {
          return;
        }
        let _0x2a0218 = new URL(location.href).pathname
          .split("/")
          .filter(Boolean);
        let _0x2a4efb = _0x2a0218.indexOf("member");
        if (_0x2a4efb === -1) {
          return;
        }
        let _0x5aa04e = _0x2a0218[_0x2a4efb + 1]?.toLowerCase();
        if (!_0x5aa04e || _0x5aa04e !== _0x48bf09) {
          return;
        }
        let _0x2c9745 = document.createElement("a");
        _0x2c9745.className = "profile-badge " + _0x544d61;
        _0x2c9745.href = "/members/titled-players";
        _0x2c9745.target = "_blank";
        let _0x2fa486 = document.createElement("div");
        _0x2fa486.className = "badges-icon-square badges-titled";
        _0x2fa486.innerHTML =
          '<span class="cc-icon-glyph cc-icon-size-24 badges-icon"><svg aria-hidden="true" data-glyph="game-crown-2" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg" style="fill:currentColor"><path d="M19 20V22H5.00002V20H19ZM1.27002 6.57001C2.30002 5.54001 3.47002 5.54001 4.17002 6.24001C4.74002 6.81001 4.84002 7.64001 4.17002 8.64001L7.24002 10.91C7.31002 10.98 7.47002 10.94 7.54002 10.84L10.37 6.84001H9.87002C8.77002 6.84001 8.30002 6.07001 8.30002 5.34001C8.30002 4.54001 9.00002 3.84001 9.87002 3.84001H10.5V3.11001C10.5 2.21001 11.2 1.51001 12 1.51001C12.83 1.51001 13.5 2.21001 13.5 3.11001V3.84001H14.13C15 3.84001 15.7 4.54001 15.7 5.34001C15.7 6.07001 15.23 6.84001 14.13 6.84001H13.63L16.5 10.84C16.57 10.94 16.67 10.97 16.77 10.91L19.8 8.68001C19.13 7.68001 19.23 6.81001 19.83 6.25001C20.53 5.52001 21.7 5.55001 22.73 6.58001L19 18.01H5.00002L1.27002 6.57001Z"></path></svg></span>';
        let _0x1de132 = document.createElement("div");
        _0x1de132.className = "badges-about";
        _0x1de132.innerHTML =
          '<span class="cc-heading-xx-small badges-name">Titled Player</span> <span class="cc-text-small badges-extra">' +
          (_0x3fa086[_0x54eae7] || _0x54eae7) +
          "</span>";
        _0x2c9745.appendChild(_0x2fa486);
        _0x2c9745.appendChild(_0x1de132);
        let _0x48167e = _0x51ef20.querySelector(
          ".profile-badge:has(.streak-badge-about)",
        );
        if (_0x48167e) {
          _0x48167e.insertAdjacentElement("afterend", _0x2c9745);
        } else {
          _0x51ef20.insertBefore(_0x2c9745, _0x51ef20.firstChild);
        }
      }
      function _0x281331() {
        let _0x910eb8 = document.querySelector(
          'a[data-user-activity-key="profile"]',
        );
        if (!_0x910eb8 || _0x910eb8.querySelector("." + _0x544d61)) {
          return;
        }
        let _0x8812b4 = _0x910eb8.querySelector(".sidebar-link-text");
        if (!_0x8812b4) {
          return;
        }
        let _0xf1bf95 = document.createElement("span");
        _0xf1bf95.className =
          "cc-user-title-component cc-text-x-small-bold " + _0x544d61;
        _0xf1bf95.textContent = _0x54eae7;
        _0xf1bf95.style.marginRight = "4px";
        _0x8812b4.insertBefore(_0xf1bf95, _0x8812b4.firstChild);
      }
      function _0x48c31f() {
        if (!_0x598dc8 || !/(^|\.)chess\.com$/.test(location.hostname)) {
          return;
        }
        let _0x3e1133 = _0x433954();
        if (!_0x3e1133) {
          return;
        }
        let _0x35868e = _0x3e1133.toLowerCase();
        _0x3f3989(_0x35868e);
        _0x3eacfe(_0x35868e);
        _0x4f2c92(_0x35868e);
        _0x281331();
      }
      function _0x58fa80() {
        if (_0x598dc8) {
          if (_0xa990d4) {
            clearTimeout(_0xa990d4);
          }
          _0xa990d4 = setTimeout(_0x48c31f, 100);
        }
      }
      if (_0x598dc8) {
        _0x58fa80();
      }
      new MutationObserver(() => {
        if (_0x598dc8) {
          _0x58fa80();
        }
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      window.addEventListener("message", (_0x5524f0) => {
        if (_0x5524f0.data?.type !== "x9110e26d:setTitle") {
          return;
        }
        let _0x23c248 = !!_0x5524f0.data.enabled;
        let _0x220403 =
          typeof _0x5524f0.data.type_ == "string" && _0x5524f0.data.type_
            ? _0x5524f0.data.type_
            : _0x54eae7;
        let _0x5797be = _0x220403 !== _0x54eae7;
        _0x54eae7 = _0x220403;
        try {
          localStorage.setItem("x9110e26d-title-type", _0x54eae7);
          localStorage.setItem("x9110e26d-title", _0x23c248 ? "true" : "false");
        } catch {}
        if (_0x23c248) {
          _0x598dc8 = true;
          if (_0x5797be) {
            _0x30ef22();
          }
          _0x48c31f();
        } else {
          _0x598dc8 = false;
          _0xa990d4 &&= (clearTimeout(_0xa990d4), null);
          _0x30ef22();
        }
      });
    },
  };
  var _0x38aaba = {
    debug: (..._0x470b18) => {
      [..._0x470b18];
      return undefined;
    },
    log: (..._0x12ab58) => {
      [..._0x12ab58];
      return undefined;
    },
    warn: (..._0x1d0d54) => {
      [..._0x1d0d54];
      return undefined;
    },
    error: (..._0x2624b5) => {
      [..._0x2624b5];
      return undefined;
    },
  };
  return (async () => {
    try {
      return await _0x4e3a9a.main();
    } catch (_0x27e227) {
      _0x38aaba.error(
        'The content script "chesscomFakeTitle" crashed on startup!',
        _0x27e227,
      );
      throw _0x27e227;
    }
  })();
})();
