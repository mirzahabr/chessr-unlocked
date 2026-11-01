// ── Local engine fallback (not part of upstream 3.7.2) ───────────────────────
// Upstream removed every chess engine in 3.7.2 and moved analysis to its server.
// This block restores the two local UCI engines from 3.4.0 — Komodo/Dragon and
// Stockfish — by transplanting the engine classes from the 3.4.0 restoration
// (commit 04c57c6) and re-pointing them at 3.7.2's chrome alias and result
// normaliser. It is a forced measure, not upstream code: the files were not
// supposed to be here. When the engine assets are absent, init() throws and the
// factory falls back to the server path unchanged.
var _0x4c1d1e = (() => {
  function _0x24557a(_0x1d24d4, _0xa1c855, _0x268636) {
    return Math.max(_0xa1c855, Math.min(_0x268636, _0x1d24d4));
  }
  function _0x462728(_0x45d33b) {
    let _0xd9b134 = _0x24557a(_0x45d33b, 400, 3500);
    return Math.round(((_0xd9b134 - 400) / 3100) * 100);
  }
  function _0x287064(_0x584408, _0x40fdb9) {
    let _0x1eb5b3 = {};
    let _0x5c9a7a = _0x24557a(_0x584408.targetElo, 400, 3500);
    let _0x2cf0c1 = _0x24557a(_0x584408.multiPv, 1, 3);
    let _0x492613 = _0x584408.limitStrength;
    if (_0x40fdb9.has("MultiPV")) {
      _0x1eb5b3.MultiPV = String(_0x2cf0c1);
    }
    if (_0x40fdb9.has("OwnBook")) {
      _0x1eb5b3.OwnBook = _0x2cf0c1 > 1 ? "false" : "true";
    }
    if (_0x40fdb9.has("Personality")) {
      _0x1eb5b3.Personality = _0x584408.personality || "Default";
    }
    let _0x104d9b = _0x40fdb9.has("UCI LimitStrength")
      ? "UCI LimitStrength"
      : _0x40fdb9.has("UCI_LimitStrength")
        ? "UCI_LimitStrength"
        : null;
    let _0x1c5bc3 = _0x40fdb9.has("UCI Elo")
      ? "UCI Elo"
      : _0x40fdb9.has("UCI_Elo")
        ? "UCI_Elo"
        : null;
    // Only touch the strength options when the user asked for a limited engine.
    // Setting an Elo value while LimitStrength is off still clamps some builds to a
    // depth-2 search (Komodo does), so the full-strength path must leave Elo alone.
    if (_0x492613 && _0x104d9b && _0x1c5bc3) {
      _0x1eb5b3[_0x104d9b] = "true";
      _0x1eb5b3[_0x1c5bc3] = String(_0x5c9a7a);
    } else if (!_0x492613 && _0x104d9b) {
      _0x1eb5b3[_0x104d9b] = "false";
      if (_0x40fdb9.has("Skill Level")) {
        _0x1eb5b3["Skill Level"] = "20";
      }
    } else if (_0x492613 && _0x40fdb9.has("Skill Level")) {
      _0x1eb5b3["Skill Level"] = String(_0x462728(_0x5c9a7a));
    }
    if (_0x584408.dynamism !== undefined && _0x40fdb9.has("Dynamism")) {
      _0x1eb5b3.Dynamism = String(_0x24557a(_0x584408.dynamism, 0, 200));
    }
    if (_0x584408.kingSafety !== undefined && _0x40fdb9.has("King Safety")) {
      _0x1eb5b3["King Safety"] = String(
        _0x24557a(_0x584408.kingSafety, 0, 200),
      );
    }
    if (_0x584408.variety !== undefined && _0x40fdb9.has("Variety")) {
      _0x1eb5b3.Variety = String(_0x24557a(_0x584408.variety, 0, 10));
    }
    return _0x1eb5b3;
  }
  function _0x1e9b89(_0x37fc96, _0x34a9ee = "dragon") {
    if (!_0x37fc96) {
      return "go";
    }
    switch (_0x37fc96.mode) {
      case "nodes":
        if (_0x37fc96.nodes == null) {
          return "go";
        } else {
          return "go nodes " + _0x37fc96.nodes;
        }
      case "depth":
        if (_0x37fc96.depth == null) {
          return "go";
        } else {
          return "go depth " + _0x37fc96.depth;
        }
      case "movetime":
        if (_0x37fc96.movetime == null) {
          return "go";
        } else {
          return "go movetime " + _0x37fc96.movetime;
        }
    }
  }
  var _0x17bc8a = 32;
  var _0x5cbcad = 30000;
  var _0x53f25b = 10000;
  var _0x33092d = class {
    id = "komodo";
    worker = null;
    blobUrl = null;
    _ready = false;
    _supportedOptions = new Set();
    activeResolve = null;
    activeReject = null;
    activeListener = null;
    activeFen = null;
    activeMultiPv = 1;
    activeTimer = null;
    activeResults = new Map();
    cancelling = null;
    lastFullmove = null;
    get ready() {
      return this._ready;
    }
    get supportedOptions() {
      return this._supportedOptions;
    }
    async init() {
      let _0x2c40d1 = _0x4313f9.runtime.getURL("/engine/dragon.js");
      let _0x57a5d4 = _0x4313f9.runtime.getURL("/engine/dragon.wasm");
      let _0x55d218 = _0x4313f9.runtime.getURL("/engine/book.bin");
      let _0x59d275 = await _0x4313f9.runtime.sendMessage({
        type: "fetchExtensionFile",
        path: new URL(_0x2c40d1).pathname,
      });
      if (_0x59d275.error || !_0x59d275.text) {
        throw Error("Failed to fetch dragon.js: " + _0x59d275.error);
      }
      let _0x5d1b5b = new Blob([_0x59d275.text], {
        type: "application/javascript",
      });
      this.blobUrl = URL.createObjectURL(_0x5d1b5b);
      let _0x33399b =
        encodeURIComponent(_0x57a5d4) +
        (_0x55d218 ? "|" + encodeURIComponent(_0x55d218) : "");
      this.worker = new Worker(this.blobUrl + "#" + _0x33399b);
      await this.withTimeout(
        new Promise((_0x1743b2) => {
          let _0x55b9d0 = (_0xb9c01d) => {
            let _0x2dd2ce =
              typeof _0xb9c01d.data == "string" ? _0xb9c01d.data : "";
            if (_0x2dd2ce.startsWith("option name ")) {
              let _0x499a1a = _0x2dd2ce.match(/^option name (.+?) type /);
              if (_0x499a1a) {
                this._supportedOptions.add(_0x499a1a[1]);
              }
            } else if (_0x2dd2ce.includes("uciok")) {
              this.worker.removeEventListener("message", _0x55b9d0);
              _0x1743b2();
            }
          };
          this.worker.addEventListener("message", _0x55b9d0);
          this.sendRaw("uci");
        }),
        _0x53f25b,
        "uci init timeout",
      );
      if (this._supportedOptions.has("Hash")) {
        this.sendRaw("setoption name Hash value " + _0x17bc8a);
      }
      if (this._supportedOptions.has("Threads")) {
        this.sendRaw("setoption name Threads value 1");
      }
      await this.withTimeout(
        this.waitForToken("readyok", () => this.sendRaw("isready")),
        _0x53f25b,
        "isready timeout",
      );
      if (!this._supportedOptions.has("MultiPV")) {
        throw Error(
          "Dragon WASM does not advertise MultiPV — cannot run suggestions",
        );
      }
      this._ready = true;
      await this.newGame();
    }
    getCapabilities() {
      let _0x58c712 = this._supportedOptions;
      return {
        hasPersonality: _0x58c712.has("Personality"),
        hasUciElo: _0x58c712.has("UCI Elo") || _0x58c712.has("UCI_Elo"),
        hasDynamism: _0x58c712.has("Dynamism"),
        hasKingSafety: _0x58c712.has("King Safety"),
        hasVariety: _0x58c712.has("Variety"),
      };
    }
    async search(_0x289b62) {
      if (!this.worker || !this._ready) {
        throw Error("SuggestionEngine not initialised");
      }
      if (this.activeResolve) {
        await this.cancel();
      }
      let _0x3ff551 = _0x2edf8c(_0x289b62.fen);
      if (this.lastFullmove !== null && _0x3ff551 < this.lastFullmove) {
        await this.newGame();
      }
      this.lastFullmove = _0x3ff551;
      return new Promise((_0x417704, _0x5499be) => {
        this.activeResolve = _0x417704;
        this.activeReject = _0x5499be;
        this.activeFen = _0x289b62.fen;
        this.activeMultiPv = Math.max(1, Math.min(3, _0x289b62.multiPv ?? 1));
        this.activeResults = new Map();
        this.activeTimer = setTimeout(() => {
          this.abortActive(Error("Search timeout"));
        }, _0x5cbcad);
        this.activeListener = (_0x4a4cf3) =>
          this.onSearchLine(
            typeof _0x4a4cf3.data == "string" ? _0x4a4cf3.data : "",
          );
        this.worker.addEventListener("message", this.activeListener);
        let _0x1a4791 = _0x287064(_0x289b62, this._supportedOptions);
        for (let [_0x4f07b7, _0x761239] of Object.entries(_0x1a4791)) {
          this.sendRaw("setoption name " + _0x4f07b7 + " value " + _0x761239);
        }
        this.sendRaw("isready");
        this.waitForToken("readyok").then(() => {
          if (this.activeResolve !== _0x417704) {
            return;
          }
          let _0x43bdf3 = _0x289b62.moves?.length
            ? " moves " + _0x289b62.moves.join(" ")
            : "";
          this.sendRaw("position fen " + _0x289b62.fen + _0x43bdf3);
          this.sendRaw(_0x1e9b89(_0x289b62.search ?? null, "dragon"));
        });
      });
    }
    async newGame() {
      if (!!this.worker && !!this._ready) {
        this.lastFullmove = null;
        this.sendRaw("ucinewgame");
        await this.waitForToken("readyok", () => this.sendRaw("isready"));
      }
    }
    destroy() {
      if (this.activeResolve) {
        this.abortActive(Error("Engine destroyed"));
      }
      if (this.worker) {
        try {
          this.sendRaw("quit");
        } catch {}
        this.worker.terminate();
        this.worker = null;
      }
      this.blobUrl &&= (URL.revokeObjectURL(this.blobUrl), null);
      this._ready = false;
    }
    async cancel() {
      if (this.activeResolve) {
        if (this.cancelling) {
          return this.cancelling;
        }
        this.cancelling = new Promise((_0xf6f7f6) => {
          let _0xe54d8d = this.activeReject;
          this.activeResolve = () => {
            _0xe54d8d(
              new DOMException("Suggestion search cancelled", "AbortError"),
            );
            _0xf6f7f6();
          };
          this.sendRaw("stop");
        });
        await this.cancelling;
        this.cancelling = null;
      }
    }
    abortActive(_0x4c56ab) {
      this.activeTimer &&= (clearTimeout(this.activeTimer), null);
      if (this.activeListener && this.worker) {
        this.worker.removeEventListener("message", this.activeListener);
      }
      this.activeListener = null;
      let _0x3c222e = this.activeReject;
      this.activeResolve = null;
      this.activeReject = null;
      this.activeFen = null;
      this.activeResults = new Map();
      _0x3c222e?.(_0x4c56ab);
    }
    onSearchLine(_0x502c07) {
      if (_0x502c07) {
        if (_0x502c07.startsWith("info") && _0x502c07.includes(" pv ")) {
          let _0xaa3c8f = _0x2c72c8(_0x502c07);
          if (_0xaa3c8f) {
            if (this.activeFen && this.activeFen.split(" ")[1] === "b") {
              _0xaa3c8f.evaluation = -_0xaa3c8f.evaluation;
              if (_0xaa3c8f.mateScore !== null) {
                _0xaa3c8f.mateScore = -_0xaa3c8f.mateScore;
              }
              [_0xaa3c8f.winRate, _0xaa3c8f.lossRate] = [
                _0xaa3c8f.lossRate,
                _0xaa3c8f.winRate,
              ];
            }
            this.activeResults.set(_0xaa3c8f.multipv, _0xaa3c8f);
          }
        } else if (_0x502c07.startsWith("bestmove")) {
          let _0x21b0ac = this.activeResolve;
          let _0xd5a4d7 = this.activeFen;
          let _0x19e409 = this.activeMultiPv;
          let _0x5eec99 = Array.from(this.activeResults.values())
            .sort(
              (_0x5d81d7, _0x3ef737) => _0x5d81d7.multipv - _0x3ef737.multipv,
            )
            .slice(0, _0x19e409);
          if (_0x5eec99.length === 0) {
            let _0x295388 = _0x502c07.split(/\s+/)[1];
            if (_0x295388 && _0x295388 !== "(none)" && _0x295388.length >= 4) {
              _0x5eec99 = [
                {
                  multipv: 1,
                  move: _0x295388,
                  evaluation: 0,
                  depth: 0,
                  winRate: 50,
                  drawRate: 0,
                  lossRate: 50,
                  mateScore: null,
                  pv: [_0x295388],
                },
              ];
            }
          }
          this.activeTimer &&= (clearTimeout(this.activeTimer), null);
          if (this.activeListener && this.worker) {
            this.worker.removeEventListener("message", this.activeListener);
          }
          this.activeListener = null;
          this.activeResolve = null;
          this.activeReject = null;
          this.activeFen = null;
          this.activeResults = new Map();
          if (_0x21b0ac) {
            _0x21b0ac(_0x18aa03(_0x5eec99, _0xd5a4d7));
          }
        }
      }
    }
    sendRaw(_0x21fbb2) {
      this.worker?.postMessage(_0x21fbb2);
    }
    waitForToken(_0x53f80b, _0x295cbb) {
      return new Promise((_0x47fcce) => {
        let _0x443001 = (_0x224ff4) => {
          if (
            (typeof _0x224ff4.data == "string" ? _0x224ff4.data : "").includes(
              _0x53f80b,
            )
          ) {
            this.worker.removeEventListener("message", _0x443001);
            _0x47fcce();
          }
        };
        this.worker.addEventListener("message", _0x443001);
        _0x295cbb?.();
      });
    }
    withTimeout(_0x26a6a4, _0x449946, _0x518478) {
      return new Promise((_0x2c7c12, _0x43d9bb) => {
        let _0xd04028 = setTimeout(
          () => _0x43d9bb(Error(_0x518478)),
          _0x449946,
        );
        _0x26a6a4.then(
          (_0x6910ba) => {
            clearTimeout(_0xd04028);
            _0x2c7c12(_0x6910ba);
          },
          (_0x21e725) => {
            clearTimeout(_0xd04028);
            _0x43d9bb(_0x21e725);
          },
        );
      });
    }
  };
  function _0x2edf8c(_0x5a2cbe) {
    let _0x4db477 = _0x5a2cbe.split(" ");
    let _0x349d03 = parseInt(_0x4db477[5] ?? "1", 10);
    if (Number.isFinite(_0x349d03) && _0x349d03 > 0) {
      return _0x349d03;
    } else {
      return 1;
    }
  }
  function _0x2c72c8(_0x1cbf15) {
    let _0x281543 = _0x1cbf15.match(/\bpv\s+(.+)$/);
    if (!_0x281543) {
      return null;
    }
    let _0xafe606 = _0x281543[1]
      .split(/\s+/)
      .filter((_0x366ec4) => _0x366ec4.length >= 4);
    if (!_0xafe606.length) {
      return null;
    }
    let _0x40c7f4 = parseInt(_0x1cbf15.match(/\bmultipv\s+(\d+)/)?.[1] || "1");
    let _0x537556 = parseInt(_0x1cbf15.match(/\bdepth\s+(\d+)/)?.[1] || "0");
    let _0x499880 = 0;
    let _0x3c0e31 = null;
    let _0x3ec8ca = 50;
    let _0x5f5983 = 0;
    let _0x4df8da = 50;
    let _0x3a19d1 = _0x1cbf15.match(/\bscore\s+mate\s+(-?\d+)/);
    let _0x54f858 = _0x1cbf15.match(/\bscore\s+cp\s+(-?\d+)/);
    let _0x4c0ab1 = _0x1cbf15.match(/\bwdl\s+(\d+)\s+(\d+)\s+(\d+)/);
    if (_0x3a19d1) {
      _0x3c0e31 = parseInt(_0x3a19d1[1]);
      _0x499880 = _0x3c0e31 > 0 ? 10000 : -10000;
      _0x3ec8ca = _0x3c0e31 > 0 ? 100 : 0;
      _0x5f5983 = 0;
      _0x4df8da = _0x3c0e31 > 0 ? 0 : 100;
    } else if (_0x54f858) {
      _0x499880 = parseInt(_0x54f858[1]);
    }
    if (_0x4c0ab1) {
      _0x3ec8ca = parseInt(_0x4c0ab1[1]) / 10;
      _0x5f5983 = parseInt(_0x4c0ab1[2]) / 10;
      _0x4df8da = parseInt(_0x4c0ab1[3]) / 10;
    } else if (!_0x3a19d1 && _0x54f858) {
      _0x3ec8ca = 50 + (2 / (1 + Math.exp(-_0x499880 / 400)) - 1) * 50;
      _0x3ec8ca = Math.round(_0x3ec8ca * 10) / 10;
      _0x4df8da = Math.round((100 - _0x3ec8ca) * 10) / 10;
    }
    return {
      multipv: _0x40c7f4,
      move: _0xafe606[0],
      evaluation: _0x499880,
      depth: _0x537556,
      winRate: Math.round(_0x3ec8ca * 10) / 10,
      drawRate: Math.round(_0x5f5983 * 10) / 10,
      lossRate: Math.round(_0x4df8da * 10) / 10,
      mateScore: _0x3c0e31,
      pv: _0xafe606,
    };
  }
  var _0x566dcb = 512;
  var _0x46f39d = 30000;
  var _0x73ac9d = 10000;
  var _0x312632 = class {
    id = "stockfish";
    worker = null;
    blobUrl = null;
    _ready = false;
    _supportedOptions = new Set();
    activeResolve = null;
    activeReject = null;
    activeListener = null;
    activeFen = null;
    activeMultiPv = 1;
    activeTimer = null;
    activeResults = new Map();
    cancelling = null;
    lastFullmove = null;
    get ready() {
      return this._ready;
    }
    get supportedOptions() {
      return this._supportedOptions;
    }
    async init() {
      let _0x2813bc = _0x4313f9.runtime.getURL("/engine/stockfish.js");
      let _0x1978c9 = _0x4313f9.runtime.getURL("/engine/stockfish.wasm");
      let _0x117f11 = await _0x4313f9.runtime.sendMessage({
        type: "fetchExtensionFile",
        path: new URL(_0x2813bc).pathname,
      });
      if (_0x117f11.error || !_0x117f11.text) {
        throw Error("Failed to fetch stockfish.js: " + _0x117f11.error);
      }
      let _0x30a389 = new Blob([_0x117f11.text], {
        type: "application/javascript",
      });
      this.blobUrl = URL.createObjectURL(_0x30a389);
      this.worker = new Worker(
        this.blobUrl + "#" + encodeURIComponent(_0x1978c9),
      );
      await this.withTimeout(
        new Promise((_0xf23745) => {
          let _0x4eb83c = (_0x36dd4b) => {
            let _0x2fb855 =
              typeof _0x36dd4b.data == "string" ? _0x36dd4b.data : "";
            if (_0x2fb855.startsWith("option name ")) {
              let _0x525e0c = _0x2fb855.match(/^option name (.+?) type /);
              if (_0x525e0c) {
                this._supportedOptions.add(_0x525e0c[1]);
              }
            } else if (_0x2fb855.includes("uciok")) {
              this.worker.removeEventListener("message", _0x4eb83c);
              _0xf23745();
            }
          };
          this.worker.addEventListener("message", _0x4eb83c);
          this.sendRaw("uci");
        }),
        _0x73ac9d,
        "uci init timeout",
      );
      if (this._supportedOptions.has("Hash")) {
        this.sendRaw("setoption name Hash value " + _0x566dcb);
      }
      if (this._supportedOptions.has("Threads")) {
        this.sendRaw("setoption name Threads value 1");
      }
      await this.withTimeout(
        this.waitForToken("readyok", () => this.sendRaw("isready")),
        _0x73ac9d,
        "isready timeout",
      );
      if (!this._supportedOptions.has("MultiPV")) {
        throw Error(
          "Stockfish WASM does not advertise MultiPV — cannot run suggestions",
        );
      }
      this._ready = true;
      await this.newGame();
    }
    getCapabilities() {
      let _0x412906 = this._supportedOptions;
      return {
        hasPersonality: _0x412906.has("Personality"),
        hasUciElo: _0x412906.has("UCI Elo") || _0x412906.has("UCI_Elo"),
        hasDynamism: _0x412906.has("Dynamism"),
        hasKingSafety: _0x412906.has("King Safety"),
        hasVariety: _0x412906.has("Variety"),
      };
    }
    async search(_0x1cac18) {
      if (!this.worker || !this._ready) {
        throw Error("StockfishSuggestionEngine not initialised");
      }
      if (this.activeResolve) {
        await this.cancel();
      }
      let _0x5d7974 = _0x1fe0e0(_0x1cac18.fen);
      if (this.lastFullmove !== null && _0x5d7974 < this.lastFullmove) {
        await this.newGame();
      }
      this.lastFullmove = _0x5d7974;
      return new Promise((_0x18bc64, _0x37876c) => {
        this.activeResolve = _0x18bc64;
        this.activeReject = _0x37876c;
        this.activeFen = _0x1cac18.fen;
        this.activeMultiPv = Math.max(1, Math.min(3, _0x1cac18.multiPv ?? 1));
        this.activeResults = new Map();
        this.activeTimer = setTimeout(() => {
          this.abortActive(Error("Search timeout"));
        }, _0x46f39d);
        this.activeListener = (_0x5b4b73) =>
          this.onSearchLine(
            typeof _0x5b4b73.data == "string" ? _0x5b4b73.data : "",
          );
        this.worker.addEventListener("message", this.activeListener);
        let _0x332640 = _0x287064(_0x1cac18, this._supportedOptions);
        for (let [_0x2b496b, _0x555767] of Object.entries(_0x332640)) {
          this.sendRaw("setoption name " + _0x2b496b + " value " + _0x555767);
        }
        this.sendRaw("isready");
        this.waitForToken("readyok").then(() => {
          if (this.activeResolve !== _0x18bc64) {
            return;
          }
          let _0x26ab1c = _0x1cac18.moves?.length
            ? " moves " + _0x1cac18.moves.join(" ")
            : "";
          this.sendRaw("position fen " + _0x1cac18.fen + _0x26ab1c);
          this.sendRaw(_0x1e9b89(_0x1cac18.search ?? null, "stockfish"));
        });
      });
    }
    async newGame() {
      if (!!this.worker && !!this._ready) {
        this.lastFullmove = null;
        this.sendRaw("ucinewgame");
        await this.waitForToken("readyok", () => this.sendRaw("isready"));
      }
    }
    destroy() {
      if (this.activeResolve) {
        this.abortActive(Error("Engine destroyed"));
      }
      if (this.worker) {
        try {
          this.sendRaw("quit");
        } catch {}
        this.worker.terminate();
        this.worker = null;
      }
      this.blobUrl &&= (URL.revokeObjectURL(this.blobUrl), null);
      this._ready = false;
    }
    async cancel() {
      if (this.activeResolve) {
        if (this.cancelling) {
          return this.cancelling;
        }
        this.cancelling = new Promise((_0x9ed65a) => {
          let _0x41b0b3 = this.activeReject;
          this.activeResolve = () => {
            _0x41b0b3(
              new DOMException("Suggestion search cancelled", "AbortError"),
            );
            _0x9ed65a();
          };
          this.sendRaw("stop");
        });
        await this.cancelling;
        this.cancelling = null;
      }
    }
    abortActive(_0x49dc94) {
      this.activeTimer &&= (clearTimeout(this.activeTimer), null);
      if (this.activeListener && this.worker) {
        this.worker.removeEventListener("message", this.activeListener);
      }
      this.activeListener = null;
      let _0x267823 = this.activeReject;
      this.activeResolve = null;
      this.activeReject = null;
      this.activeFen = null;
      this.activeResults = new Map();
      _0x267823?.(_0x49dc94);
    }
    onSearchLine(_0x47f923) {
      if (_0x47f923) {
        if (_0x47f923.startsWith("info") && _0x47f923.includes(" pv ")) {
          let _0x6a9a63 = _0xce029b(_0x47f923);
          if (_0x6a9a63) {
            if (this.activeFen && this.activeFen.split(" ")[1] === "b") {
              _0x6a9a63.evaluation = -_0x6a9a63.evaluation;
              if (_0x6a9a63.mateScore !== null) {
                _0x6a9a63.mateScore = -_0x6a9a63.mateScore;
              }
              [_0x6a9a63.winRate, _0x6a9a63.lossRate] = [
                _0x6a9a63.lossRate,
                _0x6a9a63.winRate,
              ];
            }
            this.activeResults.set(_0x6a9a63.move, _0x6a9a63);
          }
        } else if (_0x47f923.startsWith("bestmove")) {
          let _0x14567f = this.activeResolve;
          let _0x51dcef = this.activeFen;
          let _0xd342e4 = this.activeMultiPv;
          let _0xc2fae0 = Array.from(this.activeResults.values())
            .sort(
              (_0x2e9054, _0x32485d) => _0x2e9054.multipv - _0x32485d.multipv,
            )
            .slice(0, _0xd342e4);
          if (_0xc2fae0.length === 0) {
            let _0x4bcd8f = _0x47f923.split(/\s+/)[1];
            if (_0x4bcd8f && _0x4bcd8f !== "(none)" && _0x4bcd8f.length >= 4) {
              _0xc2fae0 = [
                {
                  multipv: 1,
                  move: _0x4bcd8f,
                  evaluation: 0,
                  depth: 0,
                  winRate: 50,
                  drawRate: 0,
                  lossRate: 50,
                  mateScore: null,
                  pv: [_0x4bcd8f],
                },
              ];
            }
          }
          this.activeTimer &&= (clearTimeout(this.activeTimer), null);
          if (this.activeListener && this.worker) {
            this.worker.removeEventListener("message", this.activeListener);
          }
          this.activeListener = null;
          this.activeResolve = null;
          this.activeReject = null;
          this.activeFen = null;
          this.activeResults = new Map();
          if (_0x14567f) {
            _0x14567f(_0x18aa03(_0xc2fae0, _0x51dcef));
          }
        }
      }
    }
    sendRaw(_0xf2692a) {
      this.worker?.postMessage(_0xf2692a);
    }
    waitForToken(_0x17ab6c, _0x5b3c80) {
      return new Promise((_0x42ae65) => {
        let _0x49ea4d = (_0x345121) => {
          if (
            (typeof _0x345121.data == "string" ? _0x345121.data : "").includes(
              _0x17ab6c,
            )
          ) {
            this.worker.removeEventListener("message", _0x49ea4d);
            _0x42ae65();
          }
        };
        this.worker.addEventListener("message", _0x49ea4d);
        _0x5b3c80?.();
      });
    }
    withTimeout(_0x5618e0, _0x27bb77, _0x1c6cfb) {
      return new Promise((_0x460111, _0x4b44d7) => {
        let _0xba122f = setTimeout(
          () => _0x4b44d7(Error(_0x1c6cfb)),
          _0x27bb77,
        );
        _0x5618e0.then(
          (_0x508240) => {
            clearTimeout(_0xba122f);
            _0x460111(_0x508240);
          },
          (_0x1dbfd0) => {
            clearTimeout(_0xba122f);
            _0x4b44d7(_0x1dbfd0);
          },
        );
      });
    }
  };
  function _0x1fe0e0(_0x134b98) {
    let _0x1099c0 = _0x134b98.split(" ");
    let _0x3006ad = parseInt(_0x1099c0[5] ?? "1", 10);
    if (Number.isFinite(_0x3006ad) && _0x3006ad > 0) {
      return _0x3006ad;
    } else {
      return 1;
    }
  }
  function _0xce029b(_0xeeeed1) {
    let _0x1b33f4 = _0xeeeed1.split(/\s+/);
    let _0x38d91f = 1;
    let _0x5638b9 = 0;
    let _0x54a623 = null;
    let _0x320675 = null;
    let _0x11e8d5 = -1;
    for (let _0x2ffa2d = 0; _0x2ffa2d < _0x1b33f4.length; _0x2ffa2d++) {
      let _0x23247a = _0x1b33f4[_0x2ffa2d];
      if (_0x23247a === "multipv") {
        _0x38d91f = parseInt(_0x1b33f4[++_0x2ffa2d], 10);
      } else if (_0x23247a === "depth") {
        _0x5638b9 = parseInt(_0x1b33f4[++_0x2ffa2d], 10);
      } else if (_0x23247a === "score") {
        let _0x50b83c = _0x1b33f4[++_0x2ffa2d];
        let _0x379cf1 = parseInt(_0x1b33f4[++_0x2ffa2d], 10);
        if (_0x50b83c === "cp") {
          _0x54a623 = _0x379cf1;
        } else if (_0x50b83c === "mate") {
          _0x320675 = _0x379cf1;
        }
      } else if (_0x23247a === "pv") {
        _0x11e8d5 = _0x2ffa2d + 1;
        break;
      }
    }
    if (_0x11e8d5 < 0) {
      return null;
    }
    let _0x5e0bc1 = _0x1b33f4.slice(_0x11e8d5).filter(Boolean);
    if (_0x5e0bc1.length === 0) {
      return null;
    }
    // 3.4.0 fed the UI pawns for Stockfish while Komodo fed centipawns; the UI
    // divides by 100, so Stockfish's scores displayed 100x too small. Normalise to
    // centipawns here, matching the Komodo path.
    let _0x34d30a =
      _0x320675 === null ? (_0x54a623 ?? 0) : _0x320675 > 0 ? 10000 : -10000;
    let _0x4d1d57 =
      _0x320675 === null
        ? Math.max(0, Math.min(100, 50 + (_0x54a623 ?? 0) / 4))
        : _0x320675 > 0
          ? 100
          : 0;
    return {
      multipv: _0x38d91f,
      move: _0x5e0bc1[0],
      evaluation: _0x34d30a,
      depth: _0x5638b9,
      winRate: _0x4d1d57,
      drawRate: 0,
      lossRate: 100 - _0x4d1d57,
      mateScore: _0x320675,
      pv: _0x5e0bc1,
    };
  }
  var _0x19dfd8 = 30000;
  function _0x43dba4(_0x417b9d) {
    if (_0x417b9d === "maia3") {
      return {
        hasPersonality: false,
        hasUciElo: false,
        hasDynamism: false,
        hasKingSafety: false,
        hasVariety: false,
      };
    } else if (_0x417b9d === "stockfish") {
      return {
        hasPersonality: false,
        hasUciElo: true,
        hasDynamism: false,
        hasKingSafety: false,
        hasVariety: false,
      };
    } else if (_0x417b9d === "rodent") {
      return {
        hasPersonality: true,
        hasUciElo: true,
        hasDynamism: false,
        hasKingSafety: false,
        hasVariety: false,
      };
    } else {
      return {
        hasPersonality: true,
        hasUciElo: true,
        hasDynamism: true,
        hasKingSafety: true,
        hasVariety: true,
      };
    }
  }
  return { komodo: _0x33092d, stockfish: _0x312632 };
})();
