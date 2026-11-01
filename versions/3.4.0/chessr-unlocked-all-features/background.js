var background = (function () {
  var _0xd0f0d3 = globalThis.browser?.runtime?.id
    ? globalThis.browser
    : globalThis.chrome;
  function _0x2069ec(_0x1218ee) {
    if (_0x1218ee == null || typeof _0x1218ee == "function") {
      return {
        main: _0x1218ee,
      };
    } else {
      return _0x1218ee;
    }
  }
  var _0x2781fc = 100;
  var _0x2dec70 = [];
  function _0x2d64b6(_0x46b3c6, _0x4e439b) {
    if (_0x2dec70.length >= _0x2781fc) {
      _0x2dec70.shift();
    }
    let _0xfe43d7 = _0x4e439b
      .map((_0x5c2d0f) => {
        if (typeof _0x5c2d0f == "string") {
          return _0x5c2d0f;
        }
        try {
          return JSON.stringify(_0x5c2d0f);
        } catch {
          return String(_0x5c2d0f);
        }
      })
      .join(" ")
      .slice(0, 800);
    _0x2dec70.push({
      ts: Date.now(),
      level: _0x46b3c6,
      msg: _0xfe43d7,
    });
  }
  var _0x189f30 = (() => {}).bind(console);
  var _0x590043 = (() => {}).bind(console);
  console.warn = (..._0x5c613f) => {
    _0x2d64b6("warn", _0x5c613f);
    _0x189f30(..._0x5c613f);
  };
  console.error = (..._0x2c7bd1) => {
    _0x2d64b6("error", _0x2c7bd1);
    _0x590043(..._0x2c7bd1);
  };
  if (
    typeof self !== "undefined" &&
    typeof self.addEventListener == "function"
  ) {
    self.addEventListener("error", (_0x166bc2) => {
      _0x2d64b6("error", [
        "[bg.onerror]",
        _0x166bc2?.message || String(_0x166bc2),
        (_0x166bc2?.filename || "?") + ":" + (_0x166bc2?.lineno || "?"),
      ]);
    });
    self.addEventListener("unhandledrejection", (_0x1c25a5) => {
      _0x2d64b6("error", [
        "[bg.unhandledrejection]",
        String(_0x1c25a5?.reason),
      ]);
    });
  }
  var _0x3a3c57 = Date.now();
  var _0x1e06a9 = new Set();
  var _0x29144c = new Set();
  async function _0x43cefd(_0x3753af) {
    if (_0x29144c.has(_0x3753af)) {
      return true;
    }
    try {
      await new Promise((_0x3316ac, _0x54a741) => {
        let _0x38454c = _0xd0f0d3.debugger;
        if (!_0x38454c?.attach) {
          return _0x54a741(Error("debugger API unavailable"));
        }
        _0x38454c.attach(
          {
            tabId: _0x3753af,
          },
          "1.3",
          () => {
            let _0x3f9cb3 = _0xd0f0d3.runtime.lastError;
            if (_0x3f9cb3) {
              return _0x54a741(Error(_0x3f9cb3.message));
            }
            _0x3316ac();
          },
        );
      });
      _0x29144c.add(_0x3753af);
      return true;
    } catch (_0x14a84e) {
      _0x2d64b6("warn", ["[cdp] attach failed", String(_0x14a84e)]);
      return false;
    }
  }
  function _0x334532(_0x276759, _0x562a7a, _0x5597c0) {
    return new Promise((_0x1493c5, _0x26477a) => {
      _0xd0f0d3.debugger.sendCommand(
        {
          tabId: _0x276759,
        },
        _0x562a7a,
        _0x5597c0,
        (_0x1041a1) => {
          let _0x59d298 = _0xd0f0d3.runtime.lastError;
          if (_0x59d298) {
            return _0x26477a(Error(_0x59d298.message));
          }
          _0x1493c5(_0x1041a1);
        },
      );
    });
  }
  function _0x171e85(_0x196708) {
    return new Promise((_0x507a83) =>
      setTimeout(_0x507a83, Math.max(0, _0x196708)),
    );
  }
  async function _0x5c0b69(
    _0x551892,
    _0x2e8408,
    _0x2497c1,
    _0x20eafe,
    _0x5eeb8b,
    _0x5807ef = 0,
    _0x4ecb77 = 0,
    _0x24fc57 = 0,
  ) {
    if (!(await _0x43cefd(_0x551892))) {
      return false;
    }
    try {
      if (_0x5807ef > 0) {
        await _0x171e85(_0x5807ef);
      }
      await _0x334532(_0x551892, "Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: _0x2e8408,
        y: _0x2497c1,
        button: "left",
        clickCount: 1,
      });
      if (_0x4ecb77 > 0) {
        await _0x171e85(_0x4ecb77);
      }
      let _0xdcf938 = _0x24fc57 > 0 ? _0x24fc57 / 10 : 0;
      for (let _0x13c652 = 1; _0x13c652 <= 10; _0x13c652++) {
        await _0x334532(_0x551892, "Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: _0x2e8408 + (_0x20eafe - _0x2e8408) * (_0x13c652 / 10),
          y: _0x2497c1 + (_0x5eeb8b - _0x2497c1) * (_0x13c652 / 10),
          button: "left",
        });
        if (_0xdcf938 > 0) {
          await _0x171e85(_0xdcf938);
        }
      }
      await _0x334532(_0x551892, "Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: _0x20eafe,
        y: _0x5eeb8b,
        button: "left",
        clickCount: 1,
      });
      return true;
    } catch (_0x310050) {
      _0x2d64b6("warn", ["[cdp] mouseMove failed", String(_0x310050)]);
      return false;
    }
  }
  var _0x18a162 = _0x2069ec(() => {
    _0xd0f0d3.runtime.onInstalled.addListener((_0x5b6ebb) => {
      if (_0x5b6ebb.reason === "install") {
        let _0x3fa558 = _0xd0f0d3.runtime.getManifest().version;
        _0xd0f0d3.tabs
          .create({
            url:
              "https://chessr.io/welcome?v=" +
              _0x3fa558 +
              "&utm_source=extension_install",
          })
          .catch(() => {});
      }
    });
    _0xd0f0d3.action.onClicked.addListener(() => {
      let _0x264421 = _0xd0f0d3.runtime.getManifest().version;
      _0xd0f0d3.tabs
        .create({
          url:
            "https://chessr.io/welcome?v=" +
            _0x264421 +
            "&utm_source=extension_icon",
        })
        .catch(() => {});
    });
    _0xd0f0d3.tabs
      .query({
        url: _0xd0f0d3.runtime.getURL("/stream.html"),
      })
      .then((_0x358c68) => {
        if (_0x358c68.length === 0) {
          _0xd0f0d3.storage.local
            .set({
              chessr_stream_open: {
                value: false,
                ts: Date.now(),
              },
            })
            .catch(() => {});
        } else {
          for (let _0x55311e of _0x358c68) {
            if (_0x55311e.id !== undefined) {
              _0x1e06a9.add(_0x55311e.id);
            }
          }
        }
      })
      .catch(() => {});
    let _0x380c0c = _0xd0f0d3.debugger;
    if (_0x380c0c?.onDetach?.addListener) {
      _0x380c0c.onDetach.addListener((_0x4036fd) => {
        if (_0x4036fd.tabId !== undefined) {
          _0x29144c.delete(_0x4036fd.tabId);
        }
      });
    }
    _0xd0f0d3.tabs.onRemoved.addListener((_0x28687f) => {
      _0x29144c.delete(_0x28687f);
      if (_0x1e06a9.has(_0x28687f)) {
        _0x1e06a9.delete(_0x28687f);
        _0xd0f0d3.storage.local.set({
          chessr_stream_open: {
            value: false,
            ts: Date.now(),
          },
        });
      }
    });
    _0xd0f0d3.runtime.onMessage.addListener(
      (_0x5265d8, _0x45e567, _0x252943) => {
        if (_0x5265d8?.type === "fetchExtensionFile" && _0x5265d8.path) {
          fetch(_0xd0f0d3.runtime.getURL(_0x5265d8.path))
            .then((_0x5d6a45) => _0x5d6a45.text())
            .then((_0x5d9d2c) =>
              _0x252943({
                text: _0x5d9d2c,
              }),
            )
            .catch((_0x36f22b) =>
              _0x252943({
                error: _0x36f22b.message,
              }),
            );
          return true;
        }
        if (
          _0x5265d8?.type === "cdpMouseMove" &&
          _0x45e567.tab?.id !== undefined
        ) {
          let {
            fromX: _0x3c01c8,
            fromY: _0x4647ab,
            toX: _0x5c7794,
            toY: _0x3bf8f2,
            pickDelay: _0x192a9c,
            selectDelay: _0x57654f,
            moveDelay: _0x1e84c0,
          } = _0x5265d8;
          _0x5c0b69(
            _0x45e567.tab.id,
            _0x3c01c8,
            _0x4647ab,
            _0x5c7794,
            _0x3bf8f2,
            _0x192a9c ?? 0,
            _0x57654f ?? 0,
            _0x1e84c0 ?? 0,
          )
            .then((_0x4afae8) =>
              _0x252943({
                ok: _0x4afae8,
              }),
            )
            .catch((_0x3e0dca) =>
              _0x252943({
                ok: false,
                error: String(_0x3e0dca),
              }),
            );
          return true;
        }
        if (_0x5265d8?.type === "cdpClick" && _0x45e567.tab?.id !== undefined) {
          let { x: _0x50d3b5, y: _0x2012fc } = _0x5265d8;
          let _0x3afbe2 = _0x45e567.tab.id;
          (async () => {
            if (!(await _0x43cefd(_0x3afbe2))) {
              return _0x252943({
                ok: false,
              });
            }
            try {
              await _0x334532(_0x3afbe2, "Input.dispatchMouseEvent", {
                type: "mousePressed",
                x: _0x50d3b5,
                y: _0x2012fc,
                button: "left",
                clickCount: 1,
              });
              await _0x334532(_0x3afbe2, "Input.dispatchMouseEvent", {
                type: "mouseReleased",
                x: _0x50d3b5,
                y: _0x2012fc,
                button: "left",
                clickCount: 1,
              });
              _0x252943({
                ok: true,
              });
            } catch (_0x4c4a79) {
              _0x252943({
                ok: false,
                error: String(_0x4c4a79),
              });
            }
          })();
          return true;
        }
        if (_0x5265d8?.type === "open_stream") {
          _0xd0f0d3.tabs
            .create({
              url: _0xd0f0d3.runtime.getURL("/stream.html"),
            })
            .then((_0x3a23ee) => {
              if (_0x3a23ee.id !== undefined) {
                _0x1e06a9.add(_0x3a23ee.id);
              }
            });
          return false;
        }
        if (_0x5265d8?.type === "getBackgroundDiag") {
          _0x252943({
            meta: {
              bootedAt: new Date(_0x3a3c57).toISOString(),
              uptimeSeconds: Math.round((Date.now() - _0x3a3c57) / 1000),
              extensionVersion: _0xd0f0d3.runtime.getManifest().version,
            },
            logs: _0x2dec70.slice(-50),
          });
          return false;
        }
      },
    );
  });
  var _0x2b86fe = class {
    constructor(_0x9b51ae) {
      if (_0x9b51ae === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._0x2b86fe.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        let _0x5249ca = /(.*):\/\/(.*?)(\/.*)/.exec(_0x9b51ae);
        if (_0x5249ca == null) {
          throw new _0x4d599a(_0x9b51ae, "Incorrect format");
        }
        let [_0x2627c6, _0x17623d, _0xd2bc84, _0x385b74] = _0x5249ca;
        _0x128e2c(_0x9b51ae, _0x17623d);
        _0x11f6f2(_0x9b51ae, _0xd2bc84);
        this.protocolMatches =
          _0x17623d === "*" ? ["http", "https"] : [_0x17623d];
        this.hostnameMatch = _0xd2bc84;
        this.pathnameMatch = _0x385b74;
      }
    }
    includes(_0x4eaa32) {
      if (this.isAllUrls) {
        return true;
      }
      let _0xc88c60 =
        typeof _0x4eaa32 == "string"
          ? new URL(_0x4eaa32)
          : _0x4eaa32 instanceof Location
            ? new URL(_0x4eaa32.href)
            : _0x4eaa32;
      return !!this.protocolMatches.find((_0x23d995) => {
        if (_0x23d995 === "http") {
          return this.isHttpMatch(_0xc88c60);
        }
        if (_0x23d995 === "https") {
          return this.isHttpsMatch(_0xc88c60);
        }
        if (_0x23d995 === "file") {
          return this.isFileMatch(_0xc88c60);
        }
        if (_0x23d995 === "ftp") {
          return this.isFtpMatch(_0xc88c60);
        }
        if (_0x23d995 === "urn") {
          return this.isUrnMatch(_0xc88c60);
        }
      });
    }
    isHttpMatch(_0x132a22) {
      return _0x132a22.protocol === "http:" && this.isHostPathMatch(_0x132a22);
    }
    isHttpsMatch(_0x2f29d8) {
      return _0x2f29d8.protocol === "https:" && this.isHostPathMatch(_0x2f29d8);
    }
    isHostPathMatch(_0x225243) {
      if (!this.hostnameMatch || !this.pathnameMatch) {
        return false;
      }
      let _0x2c47fe = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, "")),
      ];
      let _0x3e0855 = this.convertPatternToRegex(this.pathnameMatch);
      return (
        !!_0x2c47fe.find((_0x4c4192) => _0x4c4192.test(_0x225243.hostname)) &&
        _0x3e0855.test(_0x225243.pathname)
      );
    }
    isFileMatch(_0x4ef9ed) {
      throw Error(
        "Not implemented: file:// pattern matching. Open a PR to add support",
      );
    }
    isFtpMatch(_0x543fb6) {
      throw Error(
        "Not implemented: ftp:// pattern matching. Open a PR to add support",
      );
    }
    isUrnMatch(_0x49d26b) {
      throw Error(
        "Not implemented: urn:// pattern matching. Open a PR to add support",
      );
    }
    convertPatternToRegex(_0x2cd5cc) {
      let _0x4ddeab = this.escapeForRegex(_0x2cd5cc).replace(/\\\*/g, ".*");
      return RegExp("^" + _0x4ddeab + "$");
    }
    escapeForRegex(_0x3c3ed1) {
      return _0x3c3ed1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var _0x2b88c0 = _0x2b86fe;
  _0x2b88c0.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var _0x4d599a = class extends Error {
    constructor(_0x260e32, _0x1bc09c) {
      super('Invalid match pattern "' + _0x260e32 + '": ' + _0x1bc09c);
    }
  };
  function _0x128e2c(_0x22fe09, _0xe3db96) {
    if (!_0x2b88c0.PROTOCOLS.includes(_0xe3db96) && _0xe3db96 !== "*") {
      throw new _0x4d599a(
        _0x22fe09,
        _0xe3db96 +
          " not a valid protocol (" +
          _0x2b88c0.PROTOCOLS.join(", ") +
          ")",
      );
    }
  }
  function _0x11f6f2(_0x51ee92, _0x411311) {
    if (_0x411311.includes(":")) {
      throw new _0x4d599a(_0x51ee92, "Hostname cannot include a port");
    }
    if (
      _0x411311.includes("*") &&
      _0x411311.length > 1 &&
      !_0x411311.startsWith("*.")
    ) {
      throw new _0x4d599a(
        _0x51ee92,
        "If using a wildcard (*), it must go at the start of the hostname",
      );
    }
  }
  function _0x3ddf00(_0x77d56e, ..._0x14f515) {
    if (typeof _0x14f515[0] == "string") {
      _0x77d56e("[wxt] " + _0x14f515.shift(), ..._0x14f515);
    } else {
      _0x77d56e("[wxt]", ..._0x14f515);
    }
  }
  var _0x3692e4 = {
    debug: (..._0x280785) => _0x3ddf00(console.debug, ..._0x280785),
    log: (..._0xb478fb) => _0x3ddf00(console.log, ..._0xb478fb),
    warn: (..._0x5dfeee) => _0x3ddf00(console.warn, ..._0x5dfeee),
    error: (..._0x18035c) => _0x3ddf00(console.error, ..._0x18035c),
  };
  var _0x5d1890;
  try {
    _0x5d1890 = _0x18a162.main();
    _0x5d1890 instanceof Promise;
  } catch (_0x3bc9f2) {
    _0x3692e4.error("The background crashed on startup!");
    throw _0x3bc9f2;
  }
  return _0x5d1890;
})();
