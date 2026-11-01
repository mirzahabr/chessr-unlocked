var pagecontext = (function () {
  function _0x54d24b(_0x230254) {
    return _0x230254;
  }
  function _0x3ef6c6() {
    return document.querySelector("wc-chess-board");
  }
  function _0x2fb8c8(_0xb4a032) {
    let _0x34f20e = _0xb4a032.getPositionInfo();
    if (_0x34f20e?.gameOver) {
      return {
        checkmate: !!_0x34f20e.checkmate,
        stalemate: !!_0x34f20e.stalemate,
        draw: !!_0x34f20e.draw,
        threefold: !!_0x34f20e.threefold,
        insufficient: !!_0x34f20e.insufficient,
        fiftyMoveRule: !!_0x34f20e.fiftyMoveRule,
      };
    } else {
      return null;
    }
  }
  function _0x2e8efd() {
    let _0x29cdd6 = document.querySelector("#board-layout-player-bottom");
    let _0x30aeb7 = document.querySelector("#board-layout-player-top");
    let _0x2dee5c = _0x29cdd6?.querySelector('[data-cy="user-tagline-rating"]');
    let _0x1e7d22 = _0x30aeb7?.querySelector('[data-cy="user-tagline-rating"]');
    let _0x4d2e97 = (_0x5b9721) => {
      let _0x418e4f = _0x5b9721?.textContent?.trim().replace(/[()]/g, "");
      if (!_0x418e4f) {
        return null;
      }
      let _0x10f64e = parseInt(_0x418e4f, 10);
      if (Number.isFinite(_0x10f64e) && _0x10f64e > 0) {
        return _0x10f64e;
      } else {
        return null;
      }
    };
    return {
      playerRating: _0x4d2e97(_0x2dee5c),
      opponentRating: _0x4d2e97(_0x1e7d22),
    };
  }
  function _0x1f6424(_0x47e70e) {
    if (!_0x47e70e) {
      return [];
    }
    let _0x248a5f = [];
    try {
      if (typeof _0x47e70e.getCurrentFullLine == "function") {
        _0x248a5f.push(_0x47e70e.getCurrentFullLine());
      }
    } catch {}
    try {
      if (typeof _0x47e70e.getRawLines == "function") {
        _0x248a5f.push(_0x47e70e.getRawLines());
      }
    } catch {}
    try {
      if (typeof _0x47e70e.getLine == "function") {
        _0x248a5f.push(_0x47e70e.getLine());
      }
    } catch {}
    for (let _0x473057 of _0x248a5f) {
      let _0x1a1d27 =
        Array.isArray(_0x473057) && Array.isArray(_0x473057[0])
          ? _0x473057[0]
          : _0x473057;
      if (!Array.isArray(_0x1a1d27) || _0x1a1d27.length === 0) {
        continue;
      }
      let _0x16c36e = [];
      for (let _0x1a2a7f of _0x1a1d27) {
        if (!_0x1a2a7f || typeof _0x1a2a7f != "object") {
          continue;
        }
        let _0x403faf = _0x1a2a7f.from;
        let _0x4a70d8 = _0x1a2a7f.to;
        let _0x527d74 = _0x1a2a7f.promotion ?? "";
        if (
          typeof _0x403faf == "string" &&
          typeof _0x4a70d8 == "string" &&
          _0x403faf.length === 2 &&
          _0x4a70d8.length === 2
        ) {
          _0x16c36e.push("" + _0x403faf + _0x4a70d8 + _0x527d74);
        }
      }
      if (_0x16c36e.length > 0) {
        return _0x16c36e;
      }
    }
    try {
      let _0x712f59 =
        typeof _0x47e70e.getPGN == "function"
          ? _0x47e70e.getPGN()
          : (_0x47e70e.pgn ?? null);
      if (typeof _0x712f59 == "string" && _0x712f59.length > 0) {
        return ["pgn:" + _0x712f59];
      }
    } catch {}
    return [];
  }
  function _0x5dd94b(_0xfc89ae, _0x55fa9d, _0x5ddfa8, _0xffcb7a) {
    let _0x4938e9 = _0xfc89ae.getLegalMoves?.() || [];
    for (let _0x4db20 of _0x4938e9) {
      if (_0x4db20.from === _0x55fa9d && _0x4db20.to === _0x5ddfa8) {
        if (_0xffcb7a) {
          if (
            _0x4db20.promotion === _0xffcb7a ||
            _0x4db20.san?.endsWith("=" + _0xffcb7a.toUpperCase())
          ) {
            return _0x4db20;
          }
        } else {
          return _0x4db20;
        }
      }
    }
    return null;
  }
  function _0x245bcf(_0x27687e, _0x964eda) {
    try {
      _0x27687e.move({
        ..._0x964eda,
        userGenerated: true,
        animate: false,
      });
    } catch {}
  }
  var _0x1a816e = class {
    board = null;
    currentGame = null;
    patched = false;
    lastMode = null;
    observer = null;
    pollInterval = null;
    origPushState = null;
    origReplaceState = null;
    onPopState = null;
    ratingsPoll = null;
    ratingsLast = {
      playerRating: null,
      opponentRating: null,
    };
    emit = null;
    matches(_0x5a6c10) {
      return /(^|\.)chess\.com$/.test(_0x5a6c10);
    }
    install(_0x3c4ce9) {
      this.emit = _0x3c4ce9;
      let _0x54c6fa = () => {
        let _0x13b503 = _0x3ef6c6();
        if (!_0x13b503) {
          return;
        }
        let _0x1ecc32 = _0x13b503 !== this.board;
        if (_0x1ecc32) {
          this.board = _0x13b503;
          this.patched = false;
        }
        let _0x203f46 = _0x1ecc32
          ? this.board.game
          : this.getRawGame(this.board, _0x3c4ce9);
        if (_0x203f46 && _0x203f46 !== this.currentGame) {
          let _0x513158 = this.currentGame === null;
          this.currentGame = _0x203f46;
          this.patched = false;
          if (!_0x513158) {
            _0x3c4ce9({
              type: "chessr:newGame",
            });
          }
          this.patchGame(_0x203f46, _0x3c4ce9);
        }
        if (_0x1ecc32) {
          Object.defineProperty(this.board, "game", {
            get: () => this.currentGame,
            set: (_0x25c844) => {
              this.currentGame = _0x25c844;
              this.patched = false;
              if (_0x25c844) {
                _0x3c4ce9({
                  type: "chessr:newGame",
                });
                this.patchGame(_0x25c844, _0x3c4ce9);
              }
            },
            configurable: true,
          });
        }
      };
      this.observer = new MutationObserver(() => {
        if (_0x3ef6c6()) {
          _0x54c6fa();
        }
      });
      this.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      if (_0x3ef6c6()) {
        _0x54c6fa();
      }
      this.pollInterval = setInterval(() => {
        if (_0x3ef6c6()) {
          _0x54c6fa();
        }
      }, 500);
      this.origPushState = history.pushState;
      this.origReplaceState = history.replaceState;
      history.pushState = function (..._0x97d158) {
        let _0x173d3e = this.__chessrOrigPushState
          ? this.__chessrOrigPushState.apply(this, _0x97d158)
          : history.pushState.apply(this, _0x97d158);
        queueMicrotask(() => {
          if (_0x3ef6c6()) {
            _0x54c6fa();
          }
        });
        return _0x173d3e;
      };
      history.__chessrOrigPushState = this.origPushState;
      history.replaceState = function (..._0xe9f866) {
        let _0x15cd4a = this.__chessrOrigReplaceState
          ? this.__chessrOrigReplaceState.apply(this, _0xe9f866)
          : history.replaceState.apply(this, _0xe9f866);
        queueMicrotask(() => {
          if (_0x3ef6c6()) {
            _0x54c6fa();
          }
        });
        return _0x15cd4a;
      };
      history.__chessrOrigReplaceState = this.origReplaceState;
      this.onPopState = () => {
        if (_0x3ef6c6()) {
          _0x54c6fa();
        }
      };
      window.addEventListener("popstate", this.onPopState);
      return () => this.dispose();
    }
    dispose() {
      this.observer?.disconnect();
      this.observer = null;
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
      this.pollInterval = null;
      if (this.ratingsPoll) {
        clearInterval(this.ratingsPoll);
      }
      this.ratingsPoll = null;
      if (this.origPushState) {
        history.pushState = this.origPushState;
      }
      if (this.origReplaceState) {
        history.replaceState = this.origReplaceState;
      }
      if (this.onPopState) {
        window.removeEventListener("popstate", this.onPopState);
      }
      this.emit = null;
    }
    startRatingsPoll(_0x5d5a3b) {
      if (this.ratingsPoll) {
        clearInterval(this.ratingsPoll);
      }
      this.ratingsLast = {
        playerRating: null,
        opponentRating: null,
      };
      let _0x37bd53 = 0;
      let _0x338893 = () => {
        let _0x14b20e = _0x2e8efd();
        if (
          (_0x14b20e.playerRating !== this.ratingsLast.playerRating ||
            _0x14b20e.opponentRating !== this.ratingsLast.opponentRating) &&
          (_0x14b20e.playerRating !== null || _0x14b20e.opponentRating !== null)
        ) {
          this.ratingsLast = _0x14b20e;
          _0x5d5a3b({
            type: "chessr:ratings",
            playerRating: _0x14b20e.playerRating,
            opponentRating: _0x14b20e.opponentRating,
          });
        }
        if (
          (_0x14b20e.playerRating !== null &&
            _0x14b20e.opponentRating !== null) ||
          _0x37bd53 >= 15000
        ) {
          this.ratingsPoll &&= (clearInterval(this.ratingsPoll), null);
        }
      };
      _0x338893();
      this.ratingsPoll = setInterval(() => {
        _0x37bd53 += 500;
        _0x338893();
      }, 500);
    }
    requestState() {
      if (!this.emit || !this.currentGame) {
        return;
      }
      let _0x3ec6d3 = this.currentGame.getMode();
      let _0x44f929 = this.currentGame.getResult?.() || "*";
      this.emit({
        type: "chessr:mode",
        name: _0x3ec6d3?.name || null,
        playingAs: this.currentGame.getPlayingAs(),
        fen: this.currentGame.getFEN(),
        gameOver: this.currentGame.getPositionInfo()?.gameOver || false,
        turn: this.currentGame.getTurn(),
        result: _0x44f929,
      });
    }
    getRawGame(_0x212fbe, _0x5b9618) {
      if (!Object.getOwnPropertyDescriptor(_0x212fbe, "game")?.get) {
        return _0x212fbe.game;
      }
      delete _0x212fbe.game;
      let _0x5f53f6 = _0x212fbe.game;
      Object.defineProperty(_0x212fbe, "game", {
        get: () => this.currentGame,
        set: (_0x119b46) => {
          this.currentGame = _0x119b46;
          this.patched = false;
          if (_0x119b46) {
            _0x5b9618({
              type: "chessr:newGame",
            });
            this.patchGame(_0x119b46, _0x5b9618);
          }
        },
        configurable: true,
      });
      return _0x5f53f6;
    }
    patchGame(_0x3c0e06, _0x49e6ad) {
      if (!_0x3c0e06 || this.patched) {
        return;
      }
      this.patched = true;
      this.lastMode = _0x3c0e06.getMode()?.name || null;
      let _0x463e1c = 0;
      let _0x3f77c9 = () => {
        _0x463e1c++;
        let _0x1f6310 = _0x1f6424(_0x3c0e06);
        if (
          _0x1f6310.length > 0 &&
          (_0x1f6310.length !== 1 ||
            !_0x1f6310[0].startsWith("pgn:") ||
            !!/\d+\.\s*\w/.test(_0x1f6310[0].slice(4)))
        ) {
          _0x49e6ad({
            type: "chessr:initialMoves",
            moves: _0x1f6310,
          });
          return;
        }
        if (_0x463e1c < 12) {
          setTimeout(_0x3f77c9, 250);
        }
      };
      _0x3f77c9();
      let _0x5b2b2b = _0x3c0e06.move.bind(_0x3c0e06);
      _0x3c0e06.move = (_0x3f04e4) => {
        let _0x229c50 = _0x5b2b2b(_0x3f04e4);
        _0x49e6ad({
          type: "chessr:move",
          fen: _0x3c0e06.getFEN(),
          gameOver: _0x3c0e06.getPositionInfo()?.gameOver || false,
          gameEnd: _0x2fb8c8(_0x3c0e06),
          turn: _0x3c0e06.getTurn(),
        });
        return _0x229c50;
      };
      _0x3c0e06.on("ResetGame", () => {
        _0x49e6ad({
          type: "chessr:newGame",
        });
        this.startRatingsPoll(_0x49e6ad);
        this.lastMode = _0x3c0e06.getMode()?.name || null;
        _0x49e6ad({
          type: "chessr:mode",
          name: this.lastMode,
          playingAs: _0x3c0e06.getPlayingAs(),
        });
        _0x49e6ad({
          type: "chessr:move",
          fen: _0x3c0e06.getFEN(),
          gameOver: _0x3c0e06.getPositionInfo()?.gameOver || false,
          gameEnd: _0x2fb8c8(_0x3c0e06),
          turn: _0x3c0e06.getTurn(),
        });
      });
      _0x3c0e06.on("ModeChanged", (_0x20dfd2) => {
        let _0x345d19 = _0x20dfd2.data;
        let _0x30d9b8 = this.lastMode === "playing";
        let _0x334aac = _0x345d19 === "playing";
        this.lastMode = _0x345d19;
        if (_0x334aac && !_0x30d9b8) {
          _0x49e6ad({
            type: "chessr:newGame",
          });
          let _0x107540 = () => {
            _0x49e6ad({
              type: "chessr:mode",
              name: "playing",
              playingAs: _0x3c0e06.getPlayingAs(),
              fen: _0x3c0e06.getFEN(),
              gameOver: false,
              gameEnd: null,
              turn: _0x3c0e06.getTurn(),
              result: "*",
            });
          };
          _0x107540();
          setTimeout(_0x107540, 150);
          setTimeout(_0x107540, 500);
          return;
        }
        let _0xc548d5 = _0x3c0e06.getPositionInfo()?.gameOver || false;
        let _0x4cfdb4 = _0x3c0e06.getResult?.() || "*";
        let _0x8f3bbc =
          _0xc548d5 || (_0x30d9b8 && !_0x334aac) || _0x4cfdb4 !== "*";
        _0x49e6ad({
          type: "chessr:mode",
          name: _0x345d19,
          playingAs: _0x3c0e06.getPlayingAs(),
          fen: _0x3c0e06.getFEN(),
          gameOver: _0x8f3bbc,
          gameEnd: _0x2fb8c8(_0x3c0e06),
          turn: _0x3c0e06.getTurn(),
          result: _0x4cfdb4,
        });
      });
      _0x3c0e06.on("UpdatePGNHeaders", (_0x1661b7) => {
        let _0x2abf40 = _0x1661b7.data;
        if (_0x2abf40?.Result && _0x2abf40.Result !== "*") {
          _0x49e6ad({
            type: "chessr:gameOver",
            result: _0x2abf40.Result,
            fen: _0x3c0e06.getFEN(),
            turn: _0x3c0e06.getTurn(),
            gameEnd: _0x2fb8c8(_0x3c0e06),
          });
        }
      });
      let _0x2636d4 = () => {
        let _0x15e474 = _0x3c0e06.getMode()?.name || null;
        let _0x5f2cbe = _0x15e474 === "playing";
        _0x49e6ad({
          type: "chessr:mode",
          name: _0x15e474,
          playingAs: _0x3c0e06.getPlayingAs(),
          fen: _0x3c0e06.getFEN(),
          gameOver: _0x5f2cbe
            ? false
            : _0x3c0e06.getPositionInfo()?.gameOver || false,
          turn: _0x3c0e06.getTurn(),
          result: _0x5f2cbe ? "*" : _0x3c0e06.getResult?.() || "*",
        });
      };
      _0x2636d4();
      setTimeout(_0x2636d4, 150);
      setTimeout(_0x2636d4, 500);
      setTimeout(_0x2636d4, 1500);
      this.startRatingsPoll(_0x49e6ad);
    }
    async executeMove(_0x403415, _0x6c1820) {
      let _0x7d24da = this.currentGame;
      if (!_0x7d24da || !_0x403415 || _0x403415.length < 4) {
        return false;
      }
      let _0x2854fd = _0x403415.slice(0, 2);
      let _0x2604a4 = _0x403415.slice(2, 4);
      let _0x12fe3b = _0x403415[4];
      let _0x53ff1b = _0x5dd94b(_0x7d24da, _0x2854fd, _0x2604a4, _0x12fe3b);
      if (!_0x53ff1b) {
        return false;
      }
      if (_0x6c1820) {
        try {
          _0x7d24da.emit("PieceClicked", {
            square: _0x2854fd,
            piece: _0x53ff1b.piece,
          });
        } catch {}
        await new Promise((_0x1dd2da) =>
          setTimeout(_0x1dd2da, _0x6c1820.pickDelay),
        );
        try {
          _0x7d24da.emit("PieceSelected", {
            square: _0x2854fd,
            piece: _0x53ff1b.piece,
          });
        } catch {}
        await new Promise((_0x37eab4) =>
          setTimeout(_0x37eab4, _0x6c1820.selectDelay),
        );
        await new Promise((_0x39d615) =>
          setTimeout(_0x39d615, _0x6c1820.moveDelay),
        );
        _0x245bcf(_0x7d24da, _0x53ff1b);
      } else {
        try {
          _0x7d24da.emit("PieceClicked", {
            square: _0x2854fd,
            piece: _0x53ff1b.piece,
          });
        } catch {}
        try {
          _0x7d24da.emit("PieceSelected", {
            square: _0x2854fd,
            piece: _0x53ff1b.piece,
          });
        } catch {}
        _0x245bcf(_0x7d24da, _0x53ff1b);
      }
      return true;
    }
    executePremove(_0x24df58) {
      let _0x393690 = this.currentGame;
      if (!_0x393690?.premoves || !_0x24df58 || _0x24df58.length < 4) {
        return false;
      }
      let _0x576596 = _0x24df58.slice(0, 2);
      let _0x445982 = _0x24df58.slice(2, 4);
      let _0xc66833 = _0x24df58[4];
      try {
        _0x393690.premoves.move(
          {
            from: _0x576596,
            to: _0x445982,
            promotion: _0xc66833,
          },
          null,
        );
        return true;
      } catch {
        return false;
      }
    }
    cancelPremoves() {
      let _0x5ac1bf = this.currentGame;
      if (_0x5ac1bf?.premoves) {
        try {
          _0x5ac1bf.premoves.cancel();
        } catch {}
      }
    }
    requestRematch() {
      let _0xdc6b95 = this.currentGame;
      let _0x13813e = _0xdc6b95?.timeControl?.get?.();
      let _0x51a5ff = _0xdc6b95?.getHeaders?.() || {};
      if (!_0x13813e) {
        return false;
      }
      let _0x71bedb = Math.round((_0x13813e.baseTime || 0) / 1000);
      let _0x828671 = Math.round((_0x13813e.increment || 0) / 1000);
      let _0x35de02 = !!_0x51a5ff.WhiteElo || !!_0x51a5ff.BlackElo;
      let _0x349ba8 = {
        capabilities: _0x35de02 ? ["rated"] : [],
        rated: _0x35de02,
        gameType: _0xdc6b95?.getVariant?.() || "chess",
        timeControl: {
          base: "PT" + _0x71bedb + "S",
          increment: "PT" + _0x828671 + "S",
        },
        ratingRange: {
          upper: null,
          lower: null,
        },
      };
      fetch("https://www.chess.com/service/matcher/seeks/chess", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(_0x349ba8),
      })
        .then((_0x40cce7) => {})
        .catch((_0x5b4ee9) => {});
      return true;
    }
  };
  var _0x4d0521 = "[Chessr lichess]";
  var _0x5c1249 = "-";
  var _0x282352 = "-";
  var _0x4cdd45 = "0";
  function _0x5de24d(_0x11d409) {
    if (_0x11d409) {
      return {
        checkmate: _0x11d409 === "mate",
        stalemate: _0x11d409 === "stalemate",
        draw: _0x11d409 === "draw",
        threefold: _0x11d409 === "threefoldRepetition",
        insufficient: _0x11d409 === "insufficientMaterial",
        fiftyMoveRule: false,
      };
    } else {
      return null;
    }
  }
  function _0x1ba0f4(_0x2b01ab) {
    if (_0x2b01ab) {
      return [
        "mate",
        "stalemate",
        "draw",
        "resign",
        "timeout",
        "outoftime",
        "cheat",
        "noStart",
        "unknownFinish",
        "variantEnd",
        "aborted",
        "threefoldRepetition",
        "insufficientMaterial",
      ].includes(_0x2b01ab);
    } else {
      return false;
    }
  }
  function _0x4db8ba(_0x3b06fb, _0x54f83a) {
    if (_0x1ba0f4(_0x3b06fb)) {
      if (_0x54f83a === "white") {
        return "1-0";
      } else if (_0x54f83a === "black") {
        return "0-1";
      } else {
        return "1/2-1/2";
      }
    } else {
      return "*";
    }
  }
  function _0x19a43b(_0x1341aa, _0x3feb72) {
    let _0x232b9e = _0x1341aa.trim().split(/\s+/);
    if (_0x232b9e.length >= 6) {
      return _0x232b9e.slice(0, 6).join(" ");
    }
    if (_0x232b9e.length === 1) {
      let _0x3258ab = _0x3feb72 % 2 == 0 ? "w" : "b";
      let _0x26a45a = Math.floor(_0x3feb72 / 2) + 1;
      return (
        _0x232b9e[0] +
        " " +
        _0x3258ab +
        " " +
        _0x5c1249 +
        " " +
        _0x282352 +
        " " +
        _0x4cdd45 +
        " " +
        _0x26a45a
      );
    }
    let _0x29d708 = _0x232b9e[1] ?? (_0x3feb72 % 2 == 0 ? "w" : "b");
    let _0x55e04e = _0x232b9e[2] ?? _0x5c1249;
    let _0x312408 = _0x232b9e[3] ?? _0x282352;
    let _0x3aa60c = _0x232b9e[4] ?? _0x4cdd45;
    let _0xda81a = _0x232b9e[5] ?? String(Math.floor(_0x3feb72 / 2) + 1);
    return (
      _0x232b9e[0] +
      " " +
      _0x29d708 +
      " " +
      _0x55e04e +
      " " +
      _0x312408 +
      " " +
      _0x3aa60c +
      " " +
      _0xda81a
    );
  }
  function _0x7fbf1a() {
    if (
      document
        .querySelector(".cg-wrap")
        ?.classList.contains("orientation-black")
    ) {
      return "black";
    } else {
      return "white";
    }
  }
  function _0x4317c4() {
    let _0x5e43e9 = document.querySelector(".cg-wrap");
    if (!_0x5e43e9) {
      return null;
    }
    let _0x4bb245 = {
      pawn: "p",
      knight: "n",
      bishop: "b",
      rook: "r",
      queen: "q",
      king: "k",
    };
    let _0x195a06 = {};
    let _0x521ef5 = _0x5e43e9.querySelectorAll("piece");
    if (!_0x521ef5.length) {
      return null;
    }
    for (let _0xf2ae30 of _0x521ef5) {
      let _0x258c22 = _0xf2ae30.cgKey;
      if (!_0x258c22 || _0x258c22.length !== 2) {
        continue;
      }
      let _0xe1d30c = _0xf2ae30.className.split(/\s+/);
      let _0x10dc1d = _0xe1d30c.includes("white")
        ? "w"
        : _0xe1d30c.includes("black")
          ? "b"
          : null;
      let _0x3c56b4 = _0xe1d30c.find((_0x2370e1) => _0x2370e1 in _0x4bb245);
      if (!_0x10dc1d || !_0x3c56b4) {
        continue;
      }
      let _0x58673d = _0x4bb245[_0x3c56b4];
      _0x195a06[_0x258c22] =
        _0x10dc1d === "w" ? _0x58673d.toUpperCase() : _0x58673d;
    }
    let _0x725b12 = [];
    for (let _0x4f817b = 8; _0x4f817b >= 1; _0x4f817b--) {
      let _0x10c370 = "";
      let _0x22dde2 = 0;
      for (let _0x14e970 = 0; _0x14e970 < 8; _0x14e970++) {
        let _0x5099af =
          _0x195a06[String.fromCharCode(97 + _0x14e970) + _0x4f817b];
        if (_0x5099af) {
          _0x22dde2 &&= ((_0x10c370 += _0x22dde2), 0);
          _0x10c370 += _0x5099af;
        } else {
          _0x22dde2++;
        }
      }
      if (_0x22dde2) {
        _0x10c370 += _0x22dde2;
      }
      _0x725b12.push(_0x10c370);
    }
    let _0x3a6f3c = _0x725b12.join("/");
    if (!_0x3a6f3c.includes("K") || !_0x3a6f3c.includes("k")) {
      return null;
    } else {
      return _0x3a6f3c;
    }
  }
  function _0x1a8f90() {
    let _0xf78385 = (_0x4febd3) => {
      let _0x5d955f = _0x4febd3?.textContent?.trim();
      if (!_0x5d955f) {
        return null;
      }
      let _0x352b85 = _0x5d955f.match(/(\d{3,4})/);
      if (_0x352b85) {
        return parseInt(_0x352b85[1], 10);
      } else {
        return null;
      }
    };
    return {
      playerRating: _0xf78385(document.querySelector(".ruser-bottom rating")),
      opponentRating: _0xf78385(document.querySelector(".ruser-top rating")),
    };
  }
  function _0xbae784() {
    let _0x1dd4c4 = window;
    if (_0x1dd4c4.site?.sound) {
      return _0x1dd4c4.site;
    } else if (_0x1dd4c4.lichess?.sound) {
      return _0x1dd4c4.lichess;
    } else {
      return null;
    }
  }
  function _0x3c1c0a() {
    let _0xef82b = window;
    return _0xef82b.lichess?.socket ?? _0xef82b.site?.socket;
  }
  function _0xa88577() {
    let _0x5c3aed = window;
    return _0x5c3aed.lichess?.puzzle ?? _0x5c3aed.site?.puzzle;
  }
  function _0x4c767b() {
    return /^\/storm(\/|$)/.test(location.pathname);
  }
  function _0x4648bd() {
    return /^\/racer(\/|$)/.test(location.pathname);
  }
  function _0x23cf8d() {
    return _0x4c767b() || _0x4648bd();
  }
  function _0x4156c2(_0x3dade8, _0x353619, _0x1a4425) {
    if (_0x353619.length < 2) {
      return null;
    }
    let _0x15efbd = _0x3dade8.getBoundingClientRect();
    let _0x448709 = _0x15efbd.width / 8;
    let _0x3c0638 = _0x353619.charCodeAt(0) - 97;
    let _0x403a99 = parseInt(_0x353619[1], 10) - 1;
    let _0x49e303 = _0x1a4425 === "white" ? _0x3c0638 : 7 - _0x3c0638;
    let _0x9d7379 = _0x1a4425 === "white" ? 7 - _0x403a99 : _0x403a99;
    return {
      x: _0x15efbd.left + _0x49e303 * _0x448709 + _0x448709 / 2,
      y: _0x15efbd.top + _0x9d7379 * _0x448709 + _0x448709 / 2,
    };
  }
  function _0x30ef38() {
    let _0x3fb81c = window;
    let _0x3ba776 =
      _0x3fb81c.lichess?.chessground ?? _0x3fb81c.site?.chessground;
    try {
      let _0x477736 = _0x3ba776?.();
      if (_0x477736) {
        return _0x477736;
      }
    } catch {}
    return (
      document.querySelector(".main-board .cg-wrap, .cg-wrap")?.[
        "lichess-chessground"
      ] ?? null
    );
  }
  var _0x3d0d9a = class {
    emit = null;
    hookInstalled = false;
    bootPoll = null;
    urlPoll = null;
    observer = null;
    ratingsTimer = null;
    ratingsSent = false;
    lastUrl = "";
    lastFen = null;
    lastPly = 0;
    lastGameOver = false;
    lastResult = "*";
    lastGameEnd = null;
    postMoveCheckTimer = null;
    matches(_0x46e79c) {
      return /(^|\.)lichess\.org$/.test(_0x46e79c);
    }
    install(_0x28512b) {
      this.emit = _0x28512b;
      this.lastUrl = location.href;
      window.__chessrLichess = () => ({
        hookInstalled: this.hookInstalled,
        lastFen: this.lastFen,
        lastPly: this.lastPly,
        lastGameOver: this.lastGameOver,
        hasSoundCarrier: !!_0xbae784()?.sound?.move,
        orientation: _0x7fbf1a(),
      });
      let _0x523a26 = 0;
      this.bootPoll = setInterval(() => {
        _0x523a26 += 100;
        if (this.tryInstallHook()) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        } else if (_0x523a26 >= 5000) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        }
      }, 100);
      this.urlPoll = setInterval(() => {
        if (location.href !== this.lastUrl) {
          let _0x6d3d34 = this.lastUrl;
          this.lastUrl = location.href;
          this.onUrlChange();
        }
      }, 500);
      return () => this.dispose();
    }
    tryInstallHook() {
      if (this.hookInstalled) {
        return true;
      }
      let _0x1ebde0 = _0xbae784();
      let _0x113520 = _0x1ebde0?.sound?.move;
      if (!_0x113520) {
        return false;
      }
      if (_0x113520.__chessrPatched) {
        this.hookInstalled = true;
        return true;
      }
      let _0x287671 = _0x113520;
      let _0x33f0bd = (_0x549a8e) => {
        try {
          this.onSoundMove(_0x549a8e);
        } catch {}
        return _0x287671.call(_0x1ebde0.sound, _0x549a8e);
      };
      _0x33f0bd.__chessrPatched = true;
      _0x1ebde0.sound.move = _0x33f0bd;
      this.hookInstalled = true;
      _0x3c1c0a()?.events?.on("endData", (_0x21d1ce) => {
        this.onEndData(_0x21d1ce);
      });
      this.emitInitialMode();
      this.ratingsTimer ||= setTimeout(() => this.detectRatings(), 800);
      let _0x5557cf = document.querySelector(".main-board");
      if (_0x5557cf) {
        this.observer = new MutationObserver(() =>
          setTimeout(() => this.emitInitialMode(), 100),
        );
        this.observer.observe(_0x5557cf, {
          childList: true,
        });
      }
      return true;
    }
    onSoundMove(_0x143489) {
      if (!this.emit) {
        return;
      }
      if (
        (typeof _0x143489?.fen != "string" ||
          typeof _0x143489?.ply != "number") &&
        _0x23cf8d()
      ) {
        setTimeout(() => this.onStormMove(_0x143489), 0);
        return;
      }
      if (
        typeof _0x143489?.fen != "string" ||
        typeof _0x143489?.ply != "number"
      ) {
        return;
      }
      let _0x2d8871 = _0x143489.ply;
      let _0x5deef0 = _0x143489.fen;
      let _0x121c47 = _0x19a43b(_0x5deef0, _0x2d8871);
      let _0x265f06 = _0x2d8871 % 2 == 0 ? "white" : "black";
      let _0x392c06 = _0x1ba0f4(_0x143489.status?.name);
      let _0x1ae489 = _0x5de24d(_0x143489.status?.name);
      this.lastFen = _0x121c47;
      this.lastPly = _0x2d8871;
      this.lastGameOver = _0x392c06;
      this.lastGameEnd = _0x1ae489;
      this.lastResult = _0x4db8ba(_0x143489.status?.name, _0x143489.winner);
      this.emit({
        type: "chessr:move",
        fen: _0x121c47,
        gameOver: _0x392c06,
        gameEnd: _0x1ae489,
        turn: _0x265f06,
      });
      this.emit({
        type: "chessr:mode",
        name: _0x392c06 ? "observing" : "playing",
        playingAs: _0x7fbf1a(),
        fen: _0x121c47,
        gameOver: _0x392c06,
        gameEnd: _0x1ae489,
        turn: _0x265f06,
        result: this.lastResult,
      });
      if (!_0x392c06 && _0xa88577() && _0x265f06 !== _0x7fbf1a()) {
        if (this.postMoveCheckTimer) {
          clearTimeout(this.postMoveCheckTimer);
        }
        this.postMoveCheckTimer = setTimeout(() => {
          this.postMoveCheckTimer = null;
          this.checkForSilentRevert();
        }, 700);
      }
    }
    onStormMove(_0x25bc6b, _0x572bdf = 0) {
      if (!this.emit) {
        return;
      }
      let _0x5171d5 = _0x4317c4();
      if (!_0x5171d5) {
        let _0x54027b = [
          (_0x2afdc0) => requestAnimationFrame(_0x2afdc0),
          (_0x20a253) => setTimeout(_0x20a253, 50),
          (_0x3b6822) => setTimeout(_0x3b6822, 100),
          (_0x460459) => setTimeout(_0x460459, 200),
        ];
        if (_0x572bdf < _0x54027b.length) {
          _0x54027b[_0x572bdf](() =>
            this.onStormMove(_0x25bc6b, _0x572bdf + 1),
          );
          return;
        }
        return;
      }
      let _0x1f4abd = _0x7fbf1a();
      let _0x52ae12 =
        _0x5171d5 + " " + (_0x1f4abd === "white" ? "w" : "b") + " - - 0 1";
      if (!this.lastFen || this.lastFen.split(/\s+/)[0] !== _0x5171d5) {
        this.lastFen = _0x52ae12;
        this.lastPly += 1;
        this.lastGameOver = false;
        this.lastGameEnd = null;
        this.lastResult = "*";
        this.emit({
          type: "chessr:move",
          fen: _0x52ae12,
          gameOver: false,
          gameEnd: null,
          turn: _0x1f4abd,
        });
        this.emit({
          type: "chessr:mode",
          name: "playing",
          playingAs: _0x1f4abd,
          fen: _0x52ae12,
          gameOver: false,
          gameEnd: null,
          turn: _0x1f4abd,
          result: "*",
        });
      }
    }
    checkForSilentRevert() {
      if (!this.emit || !this.lastFen) {
        return;
      }
      let _0x86b41b = _0x4317c4();
      if (!_0x86b41b || _0x86b41b === this.lastFen.split(/\s+/)[0]) {
        return;
      }
      let _0x48b1b5 = _0x7fbf1a();
      let _0x5061d4 =
        _0x86b41b + " " + (_0x48b1b5 === "white" ? "w" : "b") + " - - 0 1";
      this.lastFen = _0x5061d4;
      this.emit({
        type: "chessr:move",
        fen: _0x5061d4,
        gameOver: false,
        gameEnd: null,
        turn: _0x48b1b5,
      });
      this.emit({
        type: "chessr:mode",
        name: "playing",
        playingAs: _0x48b1b5,
        fen: _0x5061d4,
        gameOver: false,
        gameEnd: null,
        turn: _0x48b1b5,
        result: "*",
      });
    }
    emitInitialMode() {
      if (!this.emit) {
        return;
      }
      let _0x3c4ee5 = _0x7fbf1a();
      let _0xf3d1d4 = !!_0xa88577();
      let _0x2c0fc4 = _0x23cf8d();
      let _0x2bddc5 = _0xf3d1d4 || _0x2c0fc4;
      let _0x4ce982 = this.lastFen;
      let _0x19652a = this.lastPly % 2 == 0 ? "white" : "black";
      if (!_0x4ce982 && _0x2bddc5) {
        let _0x239358 = _0x4317c4();
        if (_0x239358) {
          _0x19652a = _0x3c4ee5;
          _0x4ce982 =
            _0x239358 + " " + (_0x3c4ee5 === "white" ? "w" : "b") + " - - 0 1";
          this.lastFen = _0x4ce982;
        }
      } else if (
        !_0x4ce982 &&
        !_0xf3d1d4 &&
        !_0x2c0fc4 &&
        _0x4317c4() === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      ) {
        _0x19652a = "white";
        _0x4ce982 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.lastFen = _0x4ce982;
      }
      this.emit({
        type: "chessr:mode",
        name: "playing",
        playingAs: _0x3c4ee5,
        fen: _0x4ce982,
        gameOver: false,
        gameEnd: null,
        turn: _0x19652a,
        result: "*",
      });
      if (_0x4ce982) {
        this.emit({
          type: "chessr:move",
          fen: _0x4ce982,
          gameOver: false,
          gameEnd: null,
          turn: _0x19652a,
        });
      }
    }
    onEndData(_0x52c549) {
      if (!this.emit) {
        return;
      }
      let _0x2b0968 = _0x4db8ba(_0x52c549?.status?.name, _0x52c549?.winner);
      if (_0x2b0968 !== "*") {
        this.lastGameOver = true;
        this.lastResult = _0x2b0968;
        this.lastGameEnd = _0x5de24d(_0x52c549?.status?.name);
        this.emit({
          type: "chessr:gameOver",
          result: _0x2b0968,
          fen: this.lastFen ?? undefined,
          gameEnd: this.lastGameEnd,
        });
      }
    }
    detectRatings() {
      if (!this.emit || this.ratingsSent) {
        return;
      }
      let { playerRating: _0x4bbac5, opponentRating: _0x11b31a } = _0x1a8f90();
      if (_0x4bbac5 !== null || _0x11b31a !== null) {
        this.emit({
          type: "chessr:ratings",
          playerRating: _0x4bbac5,
          opponentRating: _0x11b31a,
        });
        this.ratingsSent = true;
      }
    }
    onUrlChange() {
      if (this.emit) {
        this.emit({
          type: "chessr:newGame",
        });
        this.lastFen = null;
        this.lastPly = 0;
        this.lastGameOver = false;
        this.lastResult = "*";
        this.lastGameEnd = null;
        this.ratingsSent = false;
        if (this.ratingsTimer) {
          clearTimeout(this.ratingsTimer);
        }
        this.ratingsTimer = setTimeout(() => this.detectRatings(), 800);
        this.postMoveCheckTimer &&=
          (clearTimeout(this.postMoveCheckTimer), null);
        setTimeout(() => this.emitInitialMode(), 100);
        setTimeout(() => this.emitInitialMode(), 500);
      }
    }
    dispose() {
      if (this.bootPoll) {
        clearInterval(this.bootPoll);
      }
      this.bootPoll = null;
      if (this.urlPoll) {
        clearInterval(this.urlPoll);
      }
      this.urlPoll = null;
      if (this.ratingsTimer) {
        clearTimeout(this.ratingsTimer);
      }
      this.ratingsTimer = null;
      if (this.postMoveCheckTimer) {
        clearTimeout(this.postMoveCheckTimer);
      }
      this.postMoveCheckTimer = null;
      this.observer?.disconnect();
      this.observer = null;
      this.emit = null;
    }
    requestState() {
      if (this.emit) {
        if (this.lastFen) {
          this.emit({
            type: "chessr:mode",
            name: this.lastGameOver ? "observing" : "playing",
            playingAs: _0x7fbf1a(),
            fen: this.lastFen,
            gameOver: this.lastGameOver,
            gameEnd: this.lastGameEnd,
            turn: this.lastPly % 2 == 0 ? "white" : "black",
            result: this.lastResult,
          });
        } else {
          this.emitInitialMode();
        }
      }
    }
    async executeMove(_0x1bf683, _0x5b3066) {
      if (!_0x1bf683 || _0x1bf683.length < 4) {
        return false;
      }
      let _0x31dae5 = _0xa88577();
      if (_0x31dae5?.playUci) {
        if (_0x5b3066) {
          let _0x3a8c57 =
            _0x5b3066.pickDelay + _0x5b3066.selectDelay + _0x5b3066.moveDelay;
          if (_0x3a8c57 > 0) {
            await new Promise((_0x9f8d04) => setTimeout(_0x9f8d04, _0x3a8c57));
          }
        }
        try {
          _0x31dae5.playUci(_0x1bf683);
          return true;
        } catch {
          return false;
        }
      }
      let _0x1760b6 = _0x1bf683.slice(0, 2);
      let _0x5eb316 = _0x1bf683.slice(2, 4);
      let _0x27a360 = _0x1bf683[4];
      let _0x22a6a5 = (_0x139570) =>
        new Promise((_0x2b532a) => setTimeout(_0x2b532a, _0x139570));
      let _0xfa28da = _0x30ef38();
      if (_0xfa28da && typeof _0xfa28da.selectSquare == "function") {
        if (_0x5b3066) {
          let _0x1401ac =
            _0x5b3066.pickDelay + _0x5b3066.selectDelay + _0x5b3066.moveDelay;
          if (_0x1401ac > 0) {
            await _0x22a6a5(_0x1401ac);
          }
        }
        try {
          _0xfa28da.selectSquare(_0x1760b6);
          _0xfa28da.selectSquare(_0x5eb316);
        } catch {
          return false;
        }
        if (_0x27a360) {
          await _0x22a6a5(80);
          let _0x38019f = document.querySelector("#promotion-choice");
          if (_0x38019f) {
            let _0x16408b =
              {
                q: 0,
                n: 1,
                r: 2,
                b: 3,
              }[_0x27a360.toLowerCase()] ?? 0;
            _0x38019f.children[_0x16408b]?.click();
          }
        }
        return true;
      }
      let _0x2f91e4 = document.querySelector(".cg-wrap cg-board");
      if (!_0x2f91e4) {
        return false;
      }
      let _0x2ca003 = _0x7fbf1a();
      let _0x2648b8 = _0x4156c2(_0x2f91e4, _0x1760b6, _0x2ca003);
      let _0x4c4d74 = _0x4156c2(_0x2f91e4, _0x5eb316, _0x2ca003);
      if (!_0x2648b8 || !_0x4c4d74) {
        return false;
      }
      window.postMessage(
        {
          type: "chessr:cdpMouseMove",
          fromX: _0x2648b8.x,
          fromY: _0x2648b8.y,
          toX: _0x4c4d74.x,
          toY: _0x4c4d74.y,
          pickDelay: _0x5b3066?.pickDelay ?? 0,
          selectDelay: _0x5b3066?.selectDelay ?? 0,
          moveDelay: _0x5b3066?.moveDelay ?? 0,
        },
        "*",
      );
      if (_0x27a360) {
        await _0x22a6a5(
          (_0x5b3066?.pickDelay ?? 0) +
            (_0x5b3066?.selectDelay ?? 0) +
            (_0x5b3066?.moveDelay ?? 0) +
            200,
        );
        let _0x39d45c = document.querySelector("#promotion-choice");
        if (_0x39d45c) {
          let _0x2281bd =
            {
              q: 0,
              n: 1,
              r: 2,
              b: 3,
            }[_0x27a360.toLowerCase()] ?? 0;
          let _0x4b89fc = _0x39d45c.children[_0x2281bd];
          if (_0x4b89fc) {
            let _0x501286 = _0x4b89fc.getBoundingClientRect();
            window.postMessage(
              {
                type: "chessr:cdpClick",
                x: _0x501286.left + _0x501286.width / 2,
                y: _0x501286.top + _0x501286.height / 2,
              },
              "*",
            );
          }
        }
      }
      return true;
    }
    executePremove(_0x3197db) {
      if (!_0x3197db || _0x3197db.length < 4) {
        return false;
      } else {
        this.executeMove(_0x3197db);
        return true;
      }
    }
    cancelPremoves() {
      _0x30ef38()?.cancelPremove?.();
    }
    requestRematch() {
      for (let _0x2e09d9 of [
        "button.rematch.fbt",
        ".rematch button",
        'button[data-icon=""]',
        ".rematch-decision .accept",
      ]) {
        let _0x30173e = document.querySelector(_0x2e09d9);
        if (_0x30173e) {
          _0x30173e.click();
          return true;
        }
      }
      return false;
    }
  };
  var _0x336524 = "[Chessr worldchess]";
  var _0x3a3f30 = /^\/game\/([0-9a-f-]{36})/i;
  function _0x235ffc() {
    let _0x232089 = location.pathname.match(_0x3a3f30);
    if (_0x232089) {
      return _0x232089[1];
    } else {
      return null;
    }
  }
  function _0x4fc00a(_0x4f7108) {
    if (_0x4f7108) {
      let _0x3af3c0 = window["chessEngine: " + _0x4f7108];
      if (_0x3af3c0 && typeof _0x3af3c0 == "object") {
        return _0x3af3c0;
      }
    }
    for (let _0x3eee85 of Object.keys(window)) {
      if (_0x3eee85.startsWith("chessEngine:")) {
        let _0x42a4eb = window[_0x3eee85];
        if (
          _0x42a4eb &&
          typeof _0x42a4eb == "object" &&
          typeof _0x42a4eb.move == "function"
        ) {
          return _0x42a4eb;
        }
      }
    }
    return null;
  }
  function _0xe75d12() {
    let _0x5a7b50 = Array.from(
      document.querySelectorAll('a[href^="/profile/"]'),
    );
    let _0x31e268 = _0x5a7b50
      .find((_0x3d1425) =>
        /my profile|mon profil|mein profil|mi perfil|il mio profilo/i.test(
          _0x3d1425.textContent ?? "",
        ),
      )
      ?.getAttribute("href");
    _0x31e268 ||=
      _0x5a7b50
        .find(
          (_0xd5126b) =>
            !_0xd5126b.closest('[data-component="GameLayoutPlayer"]') &&
            /^\/profile\/\d+/.test(_0xd5126b.getAttribute("href") ?? ""),
        )
        ?.getAttribute("href") ?? "";
    let _0xb28b5d = _0x31e268?.match(/^\/profile\/(\d+)/);
    if (_0xb28b5d) {
      return _0xb28b5d[1];
    } else {
      return null;
    }
  }
  function _0x1efcd6(_0x4142ae, _0x43dcac) {
    let _0x25b6a9 = _0x4142ae.replace(_0x43dcac, "").trim();
    if (!_0x25b6a9 || /^new$/i.test(_0x25b6a9)) {
      return null;
    }
    let _0x2b05fc = parseInt(_0x25b6a9, 10);
    if (Number.isFinite(_0x2b05fc) && _0x2b05fc > 0) {
      return _0x2b05fc;
    } else {
      return null;
    }
  }
  var _0x227d0d = {
    "club player": 1500,
    beginner: 800,
    intermediate: 1200,
    advanced: 1700,
    expert: 1900,
    master: 2100,
    grandmaster: 2400,
  };
  function _0x53152d() {
    let _0x3f155b = document.title.match(/\bvs\s+([^/]+?)\s*\//i);
    if (_0x3f155b) {
      return _0x227d0d[_0x3f155b[1].trim().toLowerCase()] ?? null;
    } else {
      return null;
    }
  }
  function _0x5bced2() {
    let _0x258ac9 = _0xe75d12();
    if (!_0x258ac9) {
      return {
        playerRating: null,
        opponentRating: null,
      };
    }
    let _0x4f2b66 = Array.from(
      document.querySelectorAll('[data-component="GameLayoutPlayer"]'),
    );
    let _0x885148 = null;
    let _0x301b24 = null;
    for (let _0x12dd95 of _0x4f2b66) {
      let _0x17cf78 = _0x12dd95.querySelector(
        '[data-component="GamePlayerInfo"]',
      );
      if (!_0x17cf78) {
        continue;
      }
      let _0x4621a3 = Array.from(
        _0x17cf78.querySelectorAll('a[href^="/profile/"]'),
      ).find((_0x3ac51c) => (_0x3ac51c.textContent ?? "").trim().length > 0);
      if (!_0x4621a3) {
        continue;
      }
      let _0x203aac = (_0x4621a3.textContent ?? "").trim();
      let _0x392db5 = _0x1efcd6(_0x17cf78.textContent ?? "", _0x203aac);
      if (
        (_0x4621a3.getAttribute("href") ?? "").startsWith(
          "/profile/" + _0x258ac9,
        )
      ) {
        _0x885148 = _0x392db5;
      } else {
        _0x301b24 = _0x392db5;
      }
    }
    if (_0x301b24 === null) {
      _0x301b24 = _0x53152d();
    }
    return {
      playerRating: _0x885148,
      opponentRating: _0x301b24,
    };
  }
  function _0x533124() {
    let _0x139749 = document.querySelector("cg-board");
    if (_0x139749 && typeof _0x139749.rotation == "number") {
      return _0x139749.rotation;
    } else {
      return 0;
    }
  }
  function _0x4214f0() {
    let _0x50fa9d = document.querySelector("cg-board");
    if (!_0x50fa9d?.parentElement) {
      return null;
    }
    let _0x327499 = Object.keys(_0x50fa9d.parentElement).find((_0x3967ec) =>
      _0x3967ec.startsWith("__reactFiber"),
    );
    if (!_0x327499) {
      return null;
    }
    let _0x31377f = _0x50fa9d.parentElement[_0x327499];
    for (let _0x5e920d = 0; _0x31377f && _0x5e920d < 20; _0x5e920d++) {
      let _0x173072 = _0x31377f.memoizedProps?.playerSide;
      if (_0x173072 === "w") {
        return "white";
      }
      if (_0x173072 === "b") {
        return "black";
      }
      _0x31377f = _0x31377f.return;
    }
    return null;
  }
  function _0x4fa100(_0x23af0b, _0x24e584, _0x374101) {
    if (_0x23af0b.length < 2) {
      return null;
    }
    let _0x3631f6 = _0x23af0b.charCodeAt(0) - 97;
    let _0x5de555 = parseInt(_0x23af0b[1], 10) - 1;
    if (_0x3631f6 < 0 || _0x3631f6 > 7 || _0x5de555 < 0 || _0x5de555 > 7) {
      return null;
    }
    let _0x564916 = _0x24e584 / 8;
    let _0x13faeb;
    let _0x4068c6;
    if (_0x374101 === 0) {
      _0x13faeb = _0x3631f6;
      _0x4068c6 = 7 - _0x5de555;
    } else {
      _0x13faeb = 7 - _0x3631f6;
      _0x4068c6 = _0x5de555;
    }
    return {
      x: _0x13faeb * _0x564916 + _0x564916 / 2,
      y: _0x4068c6 * _0x564916 + _0x564916 / 2,
    };
  }
  function _0x1a8d47(_0x147ea2) {
    let _0x3aab24 = document.querySelector("cg-board");
    if (!_0x3aab24) {
      return false;
    }
    let _0x5dabd3 = _0x3aab24.getBoundingClientRect();
    if (!_0x5dabd3.width || !_0x5dabd3.height) {
      return false;
    }
    let _0x1332af =
      typeof _0x3aab24.rotation == "number" ? _0x3aab24.rotation : 0;
    let _0x137163 = _0x4fa100(
      _0x147ea2.slice(0, 2),
      _0x5dabd3.width,
      _0x1332af,
    );
    let _0x9130b5 = _0x4fa100(
      _0x147ea2.slice(2, 4),
      _0x5dabd3.width,
      _0x1332af,
    );
    if (!_0x137163 || !_0x9130b5) {
      return false;
    }
    let _0x59341c = (_0x34ead1, _0x5d78d1, _0x1b734c) => {
      let _0x2a847b = new MouseEvent(_0x34ead1, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: _0x5dabd3.left + _0x5d78d1,
        clientY: _0x5dabd3.top + _0x1b734c,
        button: 0,
        buttons: _0x34ead1 === "mouseup" ? 0 : 1,
      });
      _0x3aab24.dispatchEvent(_0x2a847b);
    };
    _0x59341c("mousedown", _0x137163.x, _0x137163.y);
    _0x59341c("mousemove", _0x9130b5.x, _0x9130b5.y);
    _0x59341c("mouseup", _0x9130b5.x, _0x9130b5.y);
    return true;
  }
  function _0x103469(_0x3a0e92, _0x166a02) {
    if (!_0x3a0e92 || typeof _0x3a0e92 != "string") {
      return null;
    }
    let _0x2ae4a5 = _0x3a0e92.trim().split(/\s+/);
    if (_0x2ae4a5.length >= 6) {
      return _0x2ae4a5.slice(0, 6).join(" ");
    }
    if (_0x2ae4a5.length === 1) {
      return _0x2ae4a5[0] + " " + (_0x166a02 ?? "w") + " - - 0 1";
    }
    let _0x4afbf4 = _0x2ae4a5[1] ?? _0x166a02 ?? "w";
    let _0x1f410d = _0x2ae4a5[2] ?? "-";
    let _0x4e5e69 = _0x2ae4a5[3] ?? "-";
    let _0x2837c6 = _0x2ae4a5[4] ?? "0";
    let _0x3278be = _0x2ae4a5[5] ?? "1";
    return (
      _0x2ae4a5[0] +
      " " +
      _0x4afbf4 +
      " " +
      _0x1f410d +
      " " +
      _0x4e5e69 +
      " " +
      _0x2837c6 +
      " " +
      _0x3278be
    );
  }
  function _0x2b9b85(_0x23d301) {
    if (_0x23d301 === "b") {
      return "black";
    } else {
      return "white";
    }
  }
  function _0x536c81(_0x317490) {
    if (_0x317490?.checkmate) {
      return {
        checkmate: true,
        stalemate: false,
        draw: false,
        threefold: false,
        insufficient: false,
        fiftyMoveRule: false,
      };
    } else {
      return null;
    }
  }
  var _0xb21015 = class {
    emit = null;
    engine = null;
    gameId = null;
    bootPoll = null;
    urlPoll = null;
    ratingsPoll = null;
    ratingsLast = {
      playerRating: null,
      opponentRating: null,
    };
    lastUrl = "";
    playerColor = null;
    disposers = [];
    lastFen = null;
    lastGameOver = false;
    lastResult = "*";
    lastGameEnd = null;
    matches(_0x4681fb) {
      return /(^|\.)worldchess\.com$/.test(_0x4681fb);
    }
    install(_0x110338) {
      this.emit = _0x110338;
      this.lastUrl = location.href;
      window.__chessrWorldchess = () => ({
        gameId: this.gameId,
        hasEngine: !!this.engine,
        lastFen: this.lastFen,
        lastGameOver: this.lastGameOver,
        playerColor: this.playerColor,
        boardRotation: _0x533124(),
      });
      let _0x7f8465 = 0;
      this.bootPoll = setInterval(() => {
        _0x7f8465 += 200;
        if (this.tryAttachEngine()) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        } else if (_0x7f8465 >= 15000) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        }
      }, 200);
      this.urlPoll = setInterval(() => {
        if (location.href !== this.lastUrl) {
          let _0x5a82f9 = this.lastUrl;
          this.lastUrl = location.href;
          this.onUrlChange();
        }
      }, 500);
      this.startRatingsPoll(_0x110338);
      return () => this.dispose();
    }
    startRatingsPoll(_0xa9474c) {
      if (this.ratingsPoll) {
        clearInterval(this.ratingsPoll);
      }
      this.ratingsLast = {
        playerRating: null,
        opponentRating: null,
      };
      let _0x4cdc30 = 0;
      let _0x848ee6 = () => {
        let _0x26786b = _0x5bced2();
        if (
          (_0x26786b.playerRating !== this.ratingsLast.playerRating ||
            _0x26786b.opponentRating !== this.ratingsLast.opponentRating) &&
          (_0x26786b.playerRating !== null || _0x26786b.opponentRating !== null)
        ) {
          this.ratingsLast = _0x26786b;
          _0xa9474c({
            type: "chessr:ratings",
            playerRating: _0x26786b.playerRating,
            opponentRating: _0x26786b.opponentRating,
          });
        }
        if (
          (_0x26786b.playerRating !== null &&
            _0x26786b.opponentRating !== null) ||
          _0x4cdc30 >= 15000
        ) {
          this.ratingsPoll &&= (clearInterval(this.ratingsPoll), null);
        }
      };
      _0x848ee6();
      this.ratingsPoll = setInterval(() => {
        _0x4cdc30 += 500;
        _0x848ee6();
      }, 500);
    }
    tryAttachEngine() {
      if (this.engine) {
        return true;
      }
      let _0x36e4a8 = _0x235ffc();
      if (!_0x36e4a8) {
        return false;
      }
      let _0x4a6c53 = _0x4fc00a(_0x36e4a8);
      if (!_0x4a6c53) {
        return false;
      }
      this.engine = _0x4a6c53;
      this.gameId = _0x36e4a8;
      let _0x4c05d9 = _0x4214f0();
      let _0x7f7bf5 = _0x533124();
      this.playerColor = _0x4c05d9 ?? (_0x7f7bf5 === 0 ? "white" : "black");
      let _0x41c54a = _0x4a6c53.store.on("currentFen", () =>
        this.onFenChange(),
      );
      let _0x380c4f = _0x4a6c53.store.on("checkmateData", () =>
        this.onCheckmate(),
      );
      this.disposers.push(_0x41c54a, _0x380c4f);
      return true;
    }
    onFenChange() {
      if (!this.emit || !this.engine) {
        return;
      }
      let _0x59d3e8 = this.engine.store.get();
      let _0x38aedf = _0x103469(_0x59d3e8.currentFen, _0x59d3e8.turn);
      if (!_0x38aedf || this.lastFen === _0x38aedf) {
        return;
      }
      let _0x573a52 = _0x2b9b85(_0x59d3e8.turn);
      let _0x21733a = !!_0x59d3e8.checkmateData?.checkmate;
      let _0x1ba171 = _0x536c81(_0x59d3e8.checkmateData);
      this.lastFen = _0x38aedf;
      this.lastGameOver = _0x21733a;
      this.lastGameEnd = _0x1ba171;
      if (_0x21733a) {
        this.lastResult = _0x573a52 === "white" ? "0-1" : "1-0";
      }
      this.emit({
        type: "chessr:move",
        fen: _0x38aedf,
        gameOver: _0x21733a,
        gameEnd: _0x1ba171,
        turn: _0x573a52,
      });
      this.emit({
        type: "chessr:mode",
        name: _0x21733a ? "observing" : "playing",
        playingAs: this.playerColor,
        fen: _0x38aedf,
        gameOver: _0x21733a,
        gameEnd: _0x1ba171,
        turn: _0x573a52,
        result: this.lastResult,
      });
      if (_0x21733a) {
        this.emit({
          type: "chessr:gameOver",
          result: this.lastResult,
          fen: _0x38aedf,
          turn: _0x573a52,
          gameEnd: _0x1ba171,
        });
      }
    }
    onCheckmate() {
      if (this.engine && this.engine.store.get().checkmateData?.checkmate) {
        if (!this.lastGameOver) {
          this.lastFen = null;
          this.onFenChange();
        }
      }
    }
    onUrlChange() {
      for (let _0xea8d5e of this.disposers) {
        try {
          _0xea8d5e();
        } catch {}
      }
      this.disposers.length = 0;
      this.engine = null;
      this.gameId = null;
      this.playerColor = null;
      this.lastFen = null;
      this.lastGameOver = false;
      this.lastResult = "*";
      this.lastGameEnd = null;
      if (this.emit) {
        this.emit({
          type: "chessr:newGame",
        });
      }
      if (this.emit) {
        this.startRatingsPoll(this.emit);
      }
      if (!this.bootPoll) {
        let _0x195a29 = 0;
        this.bootPoll = setInterval(() => {
          _0x195a29 += 200;
          if (this.tryAttachEngine() || _0x195a29 >= 15000) {
            this.bootPoll &&= (clearInterval(this.bootPoll), null);
          }
        }, 200);
      }
    }
    dispose() {
      if (this.bootPoll) {
        clearInterval(this.bootPoll);
      }
      this.bootPoll = null;
      if (this.urlPoll) {
        clearInterval(this.urlPoll);
      }
      this.urlPoll = null;
      if (this.ratingsPoll) {
        clearInterval(this.ratingsPoll);
      }
      this.ratingsPoll = null;
      for (let _0xa621cb of this.disposers) {
        try {
          _0xa621cb();
        } catch {}
      }
      this.disposers.length = 0;
      this.engine = null;
      this.emit = null;
    }
    requestState() {
      if (this.emit) {
        if (this.lastFen && this.engine) {
          let _0x35bb04 = this.engine.store.get();
          this.emit({
            type: "chessr:mode",
            name: this.lastGameOver ? "observing" : "playing",
            playingAs: this.playerColor,
            fen: this.lastFen,
            gameOver: this.lastGameOver,
            gameEnd: this.lastGameEnd,
            turn: _0x2b9b85(_0x35bb04.turn),
            result: this.lastResult,
          });
        } else {
          this.emit({
            type: "chessr:mode",
            name: "idle",
            playingAs: null,
          });
        }
      }
    }
    async executeMove(_0x11640a, _0x433424) {
      if (!_0x11640a || _0x11640a.length < 4) {
        return false;
      }
      let _0x2ca63d = this.engine;
      if (!_0x2ca63d || typeof _0x2ca63d.move != "function") {
        return false;
      }
      if (_0x433424) {
        let _0x3025ac =
          _0x433424.pickDelay + _0x433424.selectDelay + _0x433424.moveDelay;
        if (_0x3025ac > 0) {
          await new Promise((_0x1e56b1) => setTimeout(_0x1e56b1, _0x3025ac));
        }
      }
      try {
        await _0x2ca63d.move(_0x11640a, {
          isUserMove: true,
        });
        return true;
      } catch {
        return false;
      }
    }
    executePremove(_0x2bfc0c) {
      if (!_0x2bfc0c || _0x2bfc0c.length < 4) {
        return false;
      } else {
        return !!_0x1a8d47(_0x2bfc0c);
      }
    }
    cancelPremoves() {}
    requestRematch() {
      for (let _0x1213c6 of [
        '[data-component="GameLayoutDesktopLeftControls"] button',
        '[data-component="GameLayoutMobileControlButtons"] button',
      ]) {
        let _0x4b887d = document.querySelector(_0x1213c6);
        if (_0x4b887d && /new\s*game/i.test(_0x4b887d.textContent ?? "")) {
          _0x4b887d.click();
          return true;
        }
      }
      return false;
    }
  };
  var _0x336fa8 = [new _0x1a816e(), new _0x3d0d9a(), new _0xb21015()];
  function _0x349e3e(_0x28d57d) {
    return _0x336fa8.find((_0x1c7708) => _0x1c7708.matches(_0x28d57d)) ?? null;
  }
  var _0x41deb8 = {
    matches: [
      "*://chess.com/*",
      "*://*.chess.com/*",
      "*://lichess.org/*",
      "*://*.lichess.org/*",
      "*://worldchess.com/*",
      "*://*.worldchess.com/*",
    ],
    world: "MAIN",
    runAt: "document_start",
    main() {
      let _0x42b515 = _0x349e3e(location.hostname);
      if (_0x42b515) {
        _0x42b515.install((_0x43e8ec) => window.postMessage(_0x43e8ec, "*"));
        window.addEventListener("message", (_0x19b1b3) => {
          let _0x53d232 = _0x19b1b3.data;
          if (
            typeof _0x53d232?.type == "string" &&
            _0x53d232.type.startsWith("chessr:")
          ) {
            switch (_0x53d232.type) {
              case "chessr:executeMove":
                _0x42b515.executeMove(
                  _0x53d232.move,
                  _0x53d232.humanize ?? undefined,
                );
                break;
              case "chessr:executePremove":
                _0x42b515.executePremove(_0x53d232.move);
                break;
              case "chessr:cancelPremoves":
                _0x42b515.cancelPremoves();
                break;
              case "chessr:rematch":
                _0x42b515.requestRematch();
                break;
              case "chessr:requestState":
                _0x42b515.requestState?.();
                break;
            }
          }
        });
      }
    },
  };
  function _0x3bd123(_0x1d18f0, ..._0x1af157) {
    if (typeof _0x1af157[0] == "string") {
      _0x1d18f0("[wxt] " + _0x1af157.shift(), ..._0x1af157);
    } else {
      _0x1d18f0("[wxt]", ..._0x1af157);
    }
  }
  var _0xee78d8 = {
    debug: (..._0x205415) => _0x3bd123(console.debug, ..._0x205415),
    log: (..._0x427a78) => _0x3bd123(console.log, ..._0x427a78),
    warn: (..._0x28814b) => _0x3bd123(console.warn, ..._0x28814b),
    error: (..._0x138177) => _0x3bd123(console.error, ..._0x138177),
  };
  return (async () => {
    try {
      return await _0x41deb8.main();
    } catch (_0x2d4d24) {
      _0xee78d8.error(
        'The content script "pageContext" crashed on startup!',
        _0x2d4d24,
      );
      throw _0x2d4d24;
    }
  })();
})();
