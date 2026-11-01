var background = (function () {
  var _0x4d2749 = globalThis.browser?.runtime?.id
    ? globalThis.browser
    : globalThis.chrome;
  function _0x493720(_0x2a590d) {
    if (_0x2a590d == null || typeof _0x2a590d == "function") {
      return {
        main: _0x2a590d,
      };
    } else {
      return _0x2a590d;
    }
  }
  var _0x5aec43 = 100;
  var _0x36fad9 = [];
  function _0x273e60(_0x5eab9a, _0x2a48dc) {
    if (_0x36fad9.length >= _0x5aec43) {
      _0x36fad9.shift();
    }
    let _0x3760de = _0x2a48dc
      .map((_0x38f785) => {
        if (typeof _0x38f785 == "string") {
          return _0x38f785;
        }
        try {
          return JSON.stringify(_0x38f785);
        } catch {
          return String(_0x38f785);
        }
      })
      .join(" ")
      .slice(0, 800);
    _0x36fad9.push({
      ts: Date.now(),
      level: _0x5eab9a,
      msg: _0x3760de,
    });
  }
  var _0x2beb83 = (() => {}).bind(console);
  var _0x1fa0f0 = (() => {}).bind(console);
  console.warn = (..._0x480090) => {
    _0x273e60("warn", _0x480090);
    _0x2beb83(..._0x480090);
  };
  console.error = (..._0x245cc5) => {
    _0x273e60("error", _0x245cc5);
    _0x1fa0f0(..._0x245cc5);
  };
  if (
    typeof self !== "undefined" &&
    typeof self.addEventListener == "function"
  ) {
    self.addEventListener("error", (_0x2a023a) => {
      _0x273e60("error", [
        "[bg.onerror]",
        _0x2a023a?.message || String(_0x2a023a),
        (_0x2a023a?.filename || "?") + ":" + (_0x2a023a?.lineno || "?"),
      ]);
    });
    self.addEventListener("unhandledrejection", (_0x1f88cc) => {
      _0x273e60("error", [
        "[bg.unhandledrejection]",
        String(_0x1f88cc?.reason),
      ]);
    });
  }
  var _0x56ccd8 = Date.now();
  var _0xccd794 = new Set();
  var _0x2b9a0e = new Set();
  async function _0xff6f5e(_0x20f208) {
    if (_0x2b9a0e.has(_0x20f208)) {
      return true;
    }
    try {
      await new Promise((_0x112c62, _0x5b68db) => {
        let _0x84b796 = _0x4d2749.debugger;
        if (!_0x84b796?.attach) {
          return _0x5b68db(Error("debugger API unavailable"));
        }
        _0x84b796.attach(
          {
            tabId: _0x20f208,
          },
          "1.3",
          () => {
            let _0x326acb = _0x4d2749.runtime.lastError;
            if (_0x326acb) {
              return _0x5b68db(Error(_0x326acb.message));
            }
            _0x112c62();
          },
        );
      });
      _0x2b9a0e.add(_0x20f208);
      return true;
    } catch (_0x4cbf1d) {
      _0x273e60("warn", ["[cdp] attach failed", String(_0x4cbf1d)]);
      return false;
    }
  }
  function _0x83bd7c(_0x22d342, _0x4f48e2, _0x246c05) {
    return new Promise((_0x27d276, _0x2431bd) => {
      _0x4d2749.debugger.sendCommand(
        {
          tabId: _0x22d342,
        },
        _0x4f48e2,
        _0x246c05,
        (_0x23e245) => {
          let _0x42d01e = _0x4d2749.runtime.lastError;
          if (_0x42d01e) {
            return _0x2431bd(Error(_0x42d01e.message));
          }
          _0x27d276(_0x23e245);
        },
      );
    });
  }
  function _0x55a9fb(_0x252b67) {
    return new Promise((_0x1dda1e) =>
      setTimeout(_0x1dda1e, Math.max(0, _0x252b67)),
    );
  }
  async function _0x2eace0(
    _0x4da050,
    _0x5ec919,
    _0x5396d3,
    _0x30880e,
    _0x599334,
    _0x20020d = 0,
    _0x5aa35d = 0,
    _0x3b95b4 = 0,
  ) {
    if (!(await _0xff6f5e(_0x4da050))) {
      return false;
    }
    try {
      if (_0x20020d > 0) {
        await _0x55a9fb(_0x20020d);
      }
      await _0x83bd7c(_0x4da050, "Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: _0x5ec919,
        y: _0x5396d3,
        button: "left",
        clickCount: 1,
      });
      if (_0x5aa35d > 0) {
        await _0x55a9fb(_0x5aa35d);
      }
      let _0x210862 = _0x3b95b4 > 0 ? _0x3b95b4 / 10 : 0;
      for (let _0x2f9244 = 1; _0x2f9244 <= 10; _0x2f9244++) {
        await _0x83bd7c(_0x4da050, "Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: _0x5ec919 + (_0x30880e - _0x5ec919) * (_0x2f9244 / 10),
          y: _0x5396d3 + (_0x599334 - _0x5396d3) * (_0x2f9244 / 10),
          button: "left",
        });
        if (_0x210862 > 0) {
          await _0x55a9fb(_0x210862);
        }
      }
      await _0x83bd7c(_0x4da050, "Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: _0x30880e,
        y: _0x599334,
        button: "left",
        clickCount: 1,
      });
      return true;
    } catch (_0x3e1c90) {
      _0x273e60("warn", ["[cdp] mouseMove failed", String(_0x3e1c90)]);
      return false;
    }
  }
  var _0x27ea6e = _0x493720(() => {
    _0x4d2749.runtime.onInstalled.addListener((_0x101eeb) => {
      if (_0x101eeb.reason === "install") {
        let _0x29495d = _0x4d2749.runtime.getManifest().version;
        _0x4d2749.tabs
          .create({
            url:
              "https://chessr.io/welcome?v=" +
              _0x29495d +
              "&utm_source=extension_install",
          })
          .catch(() => {});
      }
    });
    _0x4d2749.action.onClicked.addListener(() => {
      let _0x18d4bd = _0x4d2749.runtime.getManifest().version;
      _0x4d2749.tabs
        .create({
          url:
            "https://chessr.io/welcome?v=" +
            _0x18d4bd +
            "&utm_source=extension_icon",
        })
        .catch(() => {});
    });
    _0x4d2749.tabs
      .query({
        url: _0x4d2749.runtime.getURL("/stream.html"),
      })
      .then((_0x594d92) => {
        if (_0x594d92.length === 0) {
          _0x4d2749.storage.local
            .set({
              chessr_stream_open: {
                value: false,
                ts: Date.now(),
              },
            })
            .catch(() => {});
        } else {
          for (let _0x2e1d3c of _0x594d92) {
            if (_0x2e1d3c.id !== undefined) {
              _0xccd794.add(_0x2e1d3c.id);
            }
          }
        }
      })
      .catch(() => {});
    let _0x36939 = _0x4d2749.debugger;
    if (_0x36939?.onDetach?.addListener) {
      _0x36939.onDetach.addListener((_0x394f9c) => {
        if (_0x394f9c.tabId !== undefined) {
          _0x2b9a0e.delete(_0x394f9c.tabId);
        }
      });
    }
    _0x4d2749.tabs.onRemoved.addListener((_0x70606d) => {
      _0x2b9a0e.delete(_0x70606d);
      if (_0xccd794.has(_0x70606d)) {
        _0xccd794.delete(_0x70606d);
        _0x4d2749.storage.local.set({
          chessr_stream_open: {
            value: false,
            ts: Date.now(),
          },
        });
      }
    });
    _0x4d2749.runtime.onMessage.addListener(
      (_0x295f2a, _0x4a7096, _0x1fec4b) => {
        if (_0x295f2a?.type === "fetchExtensionFile" && _0x295f2a.path) {
          fetch(_0x4d2749.runtime.getURL(_0x295f2a.path))
            .then((_0x1910a3) => _0x1910a3.text())
            .then((_0x38e98d) =>
              _0x1fec4b({
                text: _0x38e98d,
              }),
            )
            .catch((_0x4576cf) =>
              _0x1fec4b({
                error: _0x4576cf.message,
              }),
            );
          return true;
        }
        if (
          _0x295f2a?.type === "cdpMouseMove" &&
          _0x4a7096.tab?.id !== undefined
        ) {
          let {
            fromX: _0x20264d,
            fromY: _0x5b5a69,
            toX: _0x3ca344,
            toY: _0x13c2ea,
            pickDelay: _0xbb63b2,
            selectDelay: _0x3be1f8,
            moveDelay: _0x45b18d,
          } = _0x295f2a;
          _0x2eace0(
            _0x4a7096.tab.id,
            _0x20264d,
            _0x5b5a69,
            _0x3ca344,
            _0x13c2ea,
            _0xbb63b2 ?? 0,
            _0x3be1f8 ?? 0,
            _0x45b18d ?? 0,
          )
            .then((_0x405f6f) =>
              _0x1fec4b({
                ok: _0x405f6f,
              }),
            )
            .catch((_0x362241) =>
              _0x1fec4b({
                ok: false,
                error: String(_0x362241),
              }),
            );
          return true;
        }
        if (_0x295f2a?.type === "cdpClick" && _0x4a7096.tab?.id !== undefined) {
          let { x: _0x11c9d2, y: _0x29e806 } = _0x295f2a;
          let _0x1c6cc7 = _0x4a7096.tab.id;
          (async () => {
            if (!(await _0xff6f5e(_0x1c6cc7))) {
              return _0x1fec4b({
                ok: false,
              });
            }
            try {
              await _0x83bd7c(_0x1c6cc7, "Input.dispatchMouseEvent", {
                type: "mousePressed",
                x: _0x11c9d2,
                y: _0x29e806,
                button: "left",
                clickCount: 1,
              });
              await _0x83bd7c(_0x1c6cc7, "Input.dispatchMouseEvent", {
                type: "mouseReleased",
                x: _0x11c9d2,
                y: _0x29e806,
                button: "left",
                clickCount: 1,
              });
              _0x1fec4b({
                ok: true,
              });
            } catch (_0x533551) {
              _0x1fec4b({
                ok: false,
                error: String(_0x533551),
              });
            }
          })();
          return true;
        }
        if (_0x295f2a?.type === "open_stream") {
          _0x4d2749.tabs
            .create({
              url: _0x4d2749.runtime.getURL("/stream.html"),
            })
            .then((_0x1a30b9) => {
              if (_0x1a30b9.id !== undefined) {
                _0xccd794.add(_0x1a30b9.id);
              }
            });
          return false;
        }
        if (_0x295f2a?.type === "getBackgroundDiag") {
          _0x1fec4b({
            meta: {
              bootedAt: new Date(_0x56ccd8).toISOString(),
              uptimeSeconds: Math.round((Date.now() - _0x56ccd8) / 1000),
              extensionVersion: _0x4d2749.runtime.getManifest().version,
            },
            logs: _0x36fad9.slice(-50),
          });
          return false;
        }
      },
    );
  });
  var _0x3da81b = class {
    constructor(_0x49b87c) {
      if (_0x49b87c === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._0x3da81b.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        let _0x121414 = /(.*):\/\/(.*?)(\/.*)/.exec(_0x49b87c);
        if (_0x121414 == null) {
          throw new _0xb2459f(_0x49b87c, "Incorrect format");
        }
        let [_0x353371, _0x5879ec, _0xaa4c86, _0x582516] = _0x121414;
        _0x54770b(_0x49b87c, _0x5879ec);
        _0xd16acb(_0x49b87c, _0xaa4c86);
        this.protocolMatches =
          _0x5879ec === "*" ? ["http", "https"] : [_0x5879ec];
        this.hostnameMatch = _0xaa4c86;
        this.pathnameMatch = _0x582516;
      }
    }
    includes(_0x26d1e2) {
      if (this.isAllUrls) {
        return true;
      }
      let _0x206781 =
        typeof _0x26d1e2 == "string"
          ? new URL(_0x26d1e2)
          : _0x26d1e2 instanceof Location
            ? new URL(_0x26d1e2.href)
            : _0x26d1e2;
      return !!this.protocolMatches.find((_0x3c2b14) => {
        if (_0x3c2b14 === "http") {
          return this.isHttpMatch(_0x206781);
        }
        if (_0x3c2b14 === "https") {
          return this.isHttpsMatch(_0x206781);
        }
        if (_0x3c2b14 === "file") {
          return this.isFileMatch(_0x206781);
        }
        if (_0x3c2b14 === "ftp") {
          return this.isFtpMatch(_0x206781);
        }
        if (_0x3c2b14 === "urn") {
          return this.isUrnMatch(_0x206781);
        }
      });
    }
    isHttpMatch(_0x33c3e0) {
      return _0x33c3e0.protocol === "http:" && this.isHostPathMatch(_0x33c3e0);
    }
    isHttpsMatch(_0x360f72) {
      return _0x360f72.protocol === "https:" && this.isHostPathMatch(_0x360f72);
    }
    isHostPathMatch(_0x45fbc8) {
      if (!this.hostnameMatch || !this.pathnameMatch) {
        return false;
      }
      let _0x5762f4 = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, "")),
      ];
      let _0xd44432 = this.convertPatternToRegex(this.pathnameMatch);
      return (
        !!_0x5762f4.find((_0xaf2626) => _0xaf2626.test(_0x45fbc8.hostname)) &&
        _0xd44432.test(_0x45fbc8.pathname)
      );
    }
    isFileMatch(_0x51c537) {
      throw Error(
        "Not implemented: file:// pattern matching. Open a PR to add support",
      );
    }
    isFtpMatch(_0x190688) {
      throw Error(
        "Not implemented: ftp:// pattern matching. Open a PR to add support",
      );
    }
    isUrnMatch(_0x408f3b) {
      throw Error(
        "Not implemented: urn:// pattern matching. Open a PR to add support",
      );
    }
    convertPatternToRegex(_0x28a79c) {
      let _0x49d32d = this.escapeForRegex(_0x28a79c).replace(/\\\*/g, ".*");
      return RegExp("^" + _0x49d32d + "$");
    }
    escapeForRegex(_0x451d40) {
      return _0x451d40.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var _0x3da0e3 = _0x3da81b;
  _0x3da0e3.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var _0xb2459f = class extends Error {
    constructor(_0x2d7bb7, _0x1b4d6e) {
      super('Invalid match pattern "' + _0x2d7bb7 + '": ' + _0x1b4d6e);
    }
  };
  function _0x54770b(_0x5a6cad, _0x562b44) {
    if (!_0x3da0e3.PROTOCOLS.includes(_0x562b44) && _0x562b44 !== "*") {
      throw new _0xb2459f(
        _0x5a6cad,
        _0x562b44 +
          " not a valid protocol (" +
          _0x3da0e3.PROTOCOLS.join(", ") +
          ")",
      );
    }
  }
  function _0xd16acb(_0x246e08, _0x44837a) {
    if (_0x44837a.includes(":")) {
      throw new _0xb2459f(_0x246e08, "Hostname cannot include a port");
    }
    if (
      _0x44837a.includes("*") &&
      _0x44837a.length > 1 &&
      !_0x44837a.startsWith("*.")
    ) {
      throw new _0xb2459f(
        _0x246e08,
        "If using a wildcard (*), it must go at the start of the hostname",
      );
    }
  }
  var _0x5fdc79 = {
    debug: (..._0x3474d4) => {
      [..._0x3474d4];
      return undefined;
    },
    log: (..._0xba4e99) => {
      [..._0xba4e99];
      return undefined;
    },
    warn: (..._0x2dac23) => {
      [..._0x2dac23];
      return undefined;
    },
    error: (..._0x18ee5d) => {
      [..._0x18ee5d];
      return undefined;
    },
  };
  var _0x1952f3;
  try {
    _0x1952f3 = _0x27ea6e.main();
    _0x1952f3 instanceof Promise;
  } catch (_0xc84f9b) {
    _0x5fdc79.error("The background crashed on startup!");
    throw _0xc84f9b;
  }
  return _0x1952f3;
})();
