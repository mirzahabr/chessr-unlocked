// Chessr pageContext script (WXT-generated entrypoint).
// Runs in the MAIN world on chess.com, lichess.org, and worldchess.com at document_start.
//
// This script runs on each of the three major chess platforms and adapts their internal
// game APIs to a common Chessr interface. It polls/hooks into the board and game objects,
// reads the current FEN, detects moves, and exposes methods to execute moves remotely.
// Communication with the content script happens via window.postMessage.
//
// Why a separate MAIN-world script at all: Manifest V3 isolated-world content
// scripts cannot see page globals (chess.com's `wc-chess-board.game`, Lichess's
// `window.lichess`/`window.site`, or WorldChess's `window["chessEngine: <id>"]`).
// This file exists solely to bridge that gap; content-scripts/content.js (the
// isolated-world React overlay) listens for the "chessr:*" messages emitted
// here and reacts by running engines, drawing arrows, etc. See
// project-documentation/PROJECT_REPORT.md ("Data Flow") for the full picture.

var pageContext = (function () {
  // ============================================================================
  // CHESS.COM ADAPTER
  // ============================================================================

  // Find the chess.com board element (wc-chess-board web component).
  function getChesscomBoard() {
    return document.querySelector("wc-chess-board");
  }

  // Extract end-of-game info (checkmate, stalemate, draw, etc.) from the board.
  function getChesscomGameEnd(boardElement) {
    const posInfo = boardElement.getPositionInfo?.();
    if (posInfo?.gameOver) {
      return {
        checkmate: !!posInfo.checkmate,
        stalemate: !!posInfo.stalemate,
        draw: !!posInfo.draw,
        threefold: !!posInfo.threefold,
        insufficient: !!posInfo.insufficient,
        fiftyMoveRule: !!posInfo.fiftyMoveRule,
      };
    } else {
      return null;
    }
  }

  // Read the player and opponent ratings from the DOM.
  function getChesscomRatings() {
    const playerContainer = document.querySelector("#board-layout-player-bottom");
    const opponentContainer = document.querySelector("#board-layout-player-top");
    const playerRatingEl = playerContainer?.querySelector('[data-cy="user-tagline-rating"]');
    const opponentRatingEl = opponentContainer?.querySelector('[data-cy="user-tagline-rating"]');

    const parseRating = (element) => {
      const text = element?.textContent?.trim().replace(/[()]/g, "");
      if (!text) {
        return null;
      }
      const rating = parseInt(text, 10);
      if (Number.isFinite(rating) && rating > 0) {
        return rating;
      } else {
        return null;
      }
    };

    return {
      playerRating: parseRating(playerRatingEl),
      opponentRating: parseRating(opponentRatingEl),
    };
  }

  // Extract the current line of moves from the game object, trying multiple methods.
  function getChesscomMoveList(gameObject) {
    if (!gameObject) {
      return [];
    }
    const moveLists = [];
    try {
      if (typeof gameObject.getCurrentFullLine == "function") {
        moveLists.push(gameObject.getCurrentFullLine());
      }
    } catch {}
    try {
      if (typeof gameObject.getRawLines == "function") {
        moveLists.push(gameObject.getRawLines());
      }
    } catch {}
    try {
      if (typeof gameObject.getLine == "function") {
        moveLists.push(gameObject.getLine());
      }
    } catch {}

    for (const rawLine of moveLists) {
      const moveArray =
        Array.isArray(rawLine) && Array.isArray(rawLine[0]) ? rawLine[0] : rawLine;
      if (!Array.isArray(moveArray) || moveArray.length === 0) {
        continue;
      }

      const moves = [];
      for (const moveObj of moveArray) {
        if (!moveObj || typeof moveObj != "object") {
          continue;
        }
        const from = moveObj.from;
        const to = moveObj.to;
        const promotion = moveObj.promotion ?? "";
        if (
          typeof from == "string" &&
          typeof to == "string" &&
          from.length === 2 &&
          to.length === 2
        ) {
          moves.push("" + from + to + promotion);
        }
      }
      if (moves.length > 0) {
        return moves;
      }
    }

    try {
      const pgn =
        typeof gameObject.getPGN == "function" ? gameObject.getPGN() : gameObject.pgn ?? null;
      if (typeof pgn == "string" && pgn.length > 0) {
        return ["pgn:" + pgn];
      }
    } catch {}

    return [];
  }

  // Find the legal move object that matches the given from/to/promotion.
  function findLegalMove(gameObject, fromSquare, toSquare, promotionPiece) {
    const legalMoves = gameObject.getLegalMoves?.() || [];
    for (const moveObj of legalMoves) {
      if (moveObj.from === fromSquare && moveObj.to === toSquare) {
        if (promotionPiece) {
          if (
            moveObj.promotion === promotionPiece ||
            moveObj.san?.endsWith("=" + promotionPiece.toUpperCase())
          ) {
            return moveObj;
          }
        } else {
          return moveObj;
        }
      }
    }
    return null;
  }

  // Execute a move by calling game.move() with userGenerated=true.
  function executeChesscomMove(gameObject, moveObj) {
    try {
      gameObject.move({
        ...moveObj,
        userGenerated: true,
        animate: false,
      });
    } catch {}
  }

  // Chess.com board adapter: hooks into the wc-chess-board element.
  class ChessBoardAdapter {
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
    ratingsLast = { playerRating: null, opponentRating: null };
    emit = null;

    matches(hostname) {
      return /(^|\.)chess\.com$/.test(hostname);
    }

    install(emitFn) {
      this.emit = emitFn;

      const pollBoard = () => {
        const newBoard = getChesscomBoard();
        if (!newBoard) {
          return;
        }

        const boardChanged = newBoard !== this.board;
        if (boardChanged) {
          this.board = newBoard;
          this.patched = false;
        }

        const newGame = boardChanged
          ? this.board.game
          : this.getRawGame(this.board, emitFn);
        if (newGame && newGame !== this.currentGame) {
          const isFirstGame = this.currentGame === null;
          this.currentGame = newGame;
          this.patched = false;
          if (!isFirstGame) {
            emitFn({ type: "chessr:newGame" });
          }
          this.patchGame(newGame, emitFn);
        }

        if (boardChanged) {
          Object.defineProperty(this.board, "game", {
            get: () => this.currentGame,
            set: (newGameValue) => {
              this.currentGame = newGameValue;
              this.patched = false;
              if (newGameValue) {
                emitFn({ type: "chessr:newGame" });
                this.patchGame(newGameValue, emitFn);
              }
            },
            configurable: true,
          });
        }
      };

      this.observer = new MutationObserver(() => {
        if (getChesscomBoard()) {
          pollBoard();
        }
      });
      this.observer.observe(document.documentElement, { childList: true, subtree: true });

      if (getChesscomBoard()) {
        pollBoard();
      }

      this.pollInterval = setInterval(() => {
        if (getChesscomBoard()) {
          pollBoard();
        }
      }, 500);

      // Hook history API changes to re-poll the board.
      this.origPushState = history.pushState;
      this.origReplaceState = history.replaceState;
      history.pushState = function (...args) {
        const result = this.__chessrOrigPushState
          ? this.__chessrOrigPushState.apply(this, args)
          : history.pushState.apply(this, args);
        queueMicrotask(() => {
          if (getChesscomBoard()) {
            pollBoard();
          }
        });
        return result;
      };
      history.__chessrOrigPushState = this.origPushState;

      history.replaceState = function (...args) {
        const result = this.__chessrOrigReplaceState
          ? this.__chessrOrigReplaceState.apply(this, args)
          : history.replaceState.apply(this, args);
        queueMicrotask(() => {
          if (getChesscomBoard()) {
            pollBoard();
          }
        });
        return result;
      };
      history.__chessrOrigReplaceState = this.origReplaceState;

      this.onPopState = () => {
        if (getChesscomBoard()) {
          pollBoard();
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

    startRatingsPoll(emitFn) {
      if (this.ratingsPoll) {
        clearInterval(this.ratingsPoll);
      }
      this.ratingsLast = { playerRating: null, opponentRating: null };
      let pollDuration = 0;

      const checkRatings = () => {
        const ratings = getChesscomRatings();
        if (
          (ratings.playerRating !== this.ratingsLast.playerRating ||
            ratings.opponentRating !== this.ratingsLast.opponentRating) &&
          (ratings.playerRating !== null || ratings.opponentRating !== null)
        ) {
          this.ratingsLast = ratings;
          emitFn({
            type: "chessr:ratings",
            playerRating: ratings.playerRating,
            opponentRating: ratings.opponentRating,
          });
        }
        if (
          (ratings.playerRating !== null && ratings.opponentRating !== null) ||
          pollDuration >= 15000
        ) {
          this.ratingsPoll &&= (clearInterval(this.ratingsPoll), null);
        }
      };

      checkRatings();
      this.ratingsPoll = setInterval(() => {
        pollDuration += 500;
        checkRatings();
      }, 500);
    }

    requestState() {
      if (!this.emit || !this.currentGame) {
        return;
      }
      const mode = this.currentGame.getMode();
      const result = this.currentGame.getResult?.() || "*";
      this.emit({
        type: "chessr:mode",
        name: mode?.name || null,
        playingAs: this.currentGame.getPlayingAs(),
        fen: this.currentGame.getFEN(),
        gameOver: this.currentGame.getPositionInfo()?.gameOver || false,
        turn: this.currentGame.getTurn(),
        result,
      });
    }

    // Unwrap a property that chess.com may have wrapped with a getter.
    getRawGame(board, emitFn) {
      if (!Object.getOwnPropertyDescriptor(board, "game")?.get) {
        return board.game;
      }
      delete board.game;
      const raw = board.game;
      Object.defineProperty(board, "game", {
        get: () => this.currentGame,
        set: (newGameValue) => {
          this.currentGame = newGameValue;
          this.patched = false;
          if (newGameValue) {
            emitFn({ type: "chessr:newGame" });
            this.patchGame(newGameValue, emitFn);
          }
        },
        configurable: true,
      });
      return raw;
    }

    // Patch a game object to emit move events and collect initial move list.
    patchGame(gameObject, emitFn) {
      if (!gameObject || this.patched) {
        return;
      }
      this.patched = true;
      this.lastMode = gameObject.getMode()?.name || null;

      // Collect the initial move list (retry up to 12 times in 250ms intervals).
      let attempts = 0;
      const tryEmitInitialMoves = () => {
        attempts++;
        const moves = getChesscomMoveList(gameObject);
        if (
          moves.length > 0 &&
          (moves.length !== 1 ||
            !moves[0].startsWith("pgn:") ||
            /\d+\.\s*\w/.test(moves[0].slice(4)))
        ) {
          emitFn({ type: "chessr:initialMoves", moves });
          return;
        }
        if (attempts < 12) {
          setTimeout(tryEmitInitialMoves, 250);
        }
      };
      tryEmitInitialMoves();

      // Patch the move() method to emit every move made.
      const origMove = gameObject.move.bind(gameObject);
      gameObject.move = (moveObj) => {
        const result = origMove(moveObj);
        emitFn({
          type: "chessr:move",
          fen: gameObject.getFEN(),
          gameOver: gameObject.getPositionInfo()?.gameOver || false,
          gameEnd: getChesscomGameEnd(gameObject),
          turn: gameObject.getTurn(),
        });
        return result;
      };

      // Listen to ResetGame event (new game started).
      gameObject.on("ResetGame", () => {
        emitFn({ type: "chessr:newGame" });
        this.startRatingsPoll(emitFn);
        this.lastMode = gameObject.getMode()?.name || null;
        emitFn({
          type: "chessr:mode",
          name: this.lastMode,
          playingAs: gameObject.getPlayingAs(),
        });
        emitFn({
          type: "chessr:move",
          fen: gameObject.getFEN(),
          gameOver: gameObject.getPositionInfo()?.gameOver || false,
          gameEnd: getChesscomGameEnd(gameObject),
          turn: gameObject.getTurn(),
        });
      });

      // Listen to ModeChanged event (playing -> observing, etc.).
      gameObject.on("ModeChanged", (event) => {
        const newMode = event.data;
        const wasPlaying = this.lastMode === "playing";
        const isNowPlaying = newMode === "playing";
        this.lastMode = newMode;

        if (isNowPlaying && !wasPlaying) {
          emitFn({ type: "chessr:newGame" });
          const emitMode = () => {
            emitFn({
              type: "chessr:mode",
              name: "playing",
              playingAs: gameObject.getPlayingAs(),
              fen: gameObject.getFEN(),
              gameOver: false,
              gameEnd: null,
              turn: gameObject.getTurn(),
              result: "*",
            });
          };
          emitMode();
          setTimeout(emitMode, 150);
          setTimeout(emitMode, 500);
          return;
        }

        const isGameOver = gameObject.getPositionInfo()?.gameOver || false;
        const result = gameObject.getResult?.() || "*";
        const shouldReportGameOver =
          isGameOver || (wasPlaying && !isNowPlaying) || result !== "*";
        emitFn({
          type: "chessr:mode",
          name: newMode,
          playingAs: gameObject.getPlayingAs(),
          fen: gameObject.getFEN(),
          gameOver: shouldReportGameOver,
          gameEnd: getChesscomGameEnd(gameObject),
          turn: gameObject.getTurn(),
          result,
        });
      });

      // Listen to PGN header updates (game result finalized).
      gameObject.on("UpdatePGNHeaders", (event) => {
        const headers = event.data;
        if (headers?.Result && headers.Result !== "*") {
          emitFn({
            type: "chessr:gameOver",
            result: headers.Result,
            fen: gameObject.getFEN(),
            turn: gameObject.getTurn(),
            gameEnd: getChesscomGameEnd(gameObject),
          });
        }
      });

      // Emit initial mode state (multiple times with slight delays for reliability).
      const emitInitialMode = () => {
        const mode = gameObject.getMode()?.name || null;
        const isPlaying = mode === "playing";
        emitFn({
          type: "chessr:mode",
          name: mode,
          playingAs: gameObject.getPlayingAs(),
          fen: gameObject.getFEN(),
          gameOver: isPlaying ? false : gameObject.getPositionInfo()?.gameOver || false,
          turn: gameObject.getTurn(),
          result: isPlaying ? "*" : gameObject.getResult?.() || "*",
        });
      };
      emitInitialMode();
      setTimeout(emitInitialMode, 150);
      setTimeout(emitInitialMode, 500);
      setTimeout(emitInitialMode, 1500);

      this.startRatingsPoll(emitFn);
    }

    async executeMove(uciMove, humanizeParams) {
      const gameObject = this.currentGame;
      if (!gameObject || !uciMove || uciMove.length < 4) {
        return false;
      }

      const fromSquare = uciMove.slice(0, 2);
      const toSquare = uciMove.slice(2, 4);
      const promotionPiece = uciMove[4];
      const legalMove = findLegalMove(gameObject, fromSquare, toSquare, promotionPiece);

      if (!legalMove) {
        return false;
      }

      if (humanizeParams) {
        try {
          gameObject.emit("PieceClicked", { square: fromSquare, piece: legalMove.piece });
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, humanizeParams.pickDelay));
        try {
          gameObject.emit("PieceSelected", { square: fromSquare, piece: legalMove.piece });
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, humanizeParams.selectDelay));
        await new Promise((resolve) => setTimeout(resolve, humanizeParams.moveDelay));
        executeChesscomMove(gameObject, legalMove);
      } else {
        try {
          gameObject.emit("PieceClicked", { square: fromSquare, piece: legalMove.piece });
        } catch {}
        try {
          gameObject.emit("PieceSelected", { square: fromSquare, piece: legalMove.piece });
        } catch {}
        executeChesscomMove(gameObject, legalMove);
      }

      return true;
    }

    executePremove(uciMove) {
      const gameObject = this.currentGame;
      if (!gameObject?.premoves || !uciMove || uciMove.length < 4) {
        return false;
      }
      const fromSquare = uciMove.slice(0, 2);
      const toSquare = uciMove.slice(2, 4);
      const promotionPiece = uciMove[4];
      try {
        gameObject.premoves.move({ from: fromSquare, to: toSquare, promotion: promotionPiece }, null);
        return true;
      } catch {
        return false;
      }
    }

    cancelPremoves() {
      const gameObject = this.currentGame;
      if (gameObject?.premoves) {
        try {
          gameObject.premoves.cancel();
        } catch {}
      }
    }

    requestRematch() {
      const gameObject = this.currentGame;
      const timeControl = gameObject?.timeControl?.get?.();
      const headers = gameObject?.getHeaders?.() || {};
      if (!timeControl) {
        return false;
      }

      const baseSeconds = Math.round((timeControl.baseTime || 0) / 1000);
      const incrementSeconds = Math.round((timeControl.increment || 0) / 1000);
      const isRated = !!headers.WhiteElo || !!headers.BlackElo;
      const seekRequest = {
        capabilities: isRated ? ["rated"] : [],
        rated: isRated,
        gameType: gameObject?.getVariant?.() || "chess",
        timeControl: {
          base: "PT" + baseSeconds + "S",
          increment: "PT" + incrementSeconds + "S",
        },
        ratingRange: { upper: null, lower: null },
      };

      fetch("https://www.chess.com/service/matcher/seeks/chess", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seekRequest),
      })
        .then(() => {})
        .catch(() => {});

      return true;
    }
  }

  // ============================================================================
  // LICHESS ADAPTER
  // ============================================================================

  const LICHESS_TAG = "[Chessr lichess]";
  const LICHESS_DEFAULT_EN_PASSANT = "-";
  const LICHESS_DEFAULT_CASTLE = "-";
  const LICHESS_DEFAULT_HALFMOVE = "0";

  function getLichessGameEnd(statusName) {
    if (statusName) {
      return {
        checkmate: statusName === "mate",
        stalemate: statusName === "stalemate",
        draw: statusName === "draw",
        threefold: statusName === "threefoldRepetition",
        insufficient: statusName === "insufficientMaterial",
        fiftyMoveRule: false,
      };
    } else {
      return null;
    }
  }

  function isLichessGameOver(statusName) {
    if (statusName) {
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
      ].includes(statusName);
    } else {
      return false;
    }
  }

  function getLichessResult(statusName, winner) {
    if (isLichessGameOver(statusName)) {
      if (winner === "white") {
        return "1-0";
      } else if (winner === "black") {
        return "0-1";
      } else {
        return "1/2-1/2";
      }
    } else {
      return "*";
    }
  }

  function normalizeLichessFen(fen, ply) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length >= 6) {
      return parts.slice(0, 6).join(" ");
    }
    if (parts.length === 1) {
      const turn = ply % 2 == 0 ? "w" : "b";
      const moveNumber = Math.floor(ply / 2) + 1;
      return parts[0] + " " + turn + " " + LICHESS_DEFAULT_CASTLE + " " + LICHESS_DEFAULT_EN_PASSANT + " " + LICHESS_DEFAULT_HALFMOVE + " " + moveNumber;
    }
    const turn = parts[1] ?? (ply % 2 == 0 ? "w" : "b");
    const castle = parts[2] ?? LICHESS_DEFAULT_CASTLE;
    const enPassant = parts[3] ?? LICHESS_DEFAULT_EN_PASSANT;
    const halfmove = parts[4] ?? LICHESS_DEFAULT_HALFMOVE;
    const moveNumber = parts[5] ?? String(Math.floor(ply / 2) + 1);
    return parts[0] + " " + turn + " " + castle + " " + enPassant + " " + halfmove + " " + moveNumber;
  }

  function getLichessBoardOrientation() {
    if (document.querySelector(".cg-wrap")?.classList.contains("orientation-black")) {
      return "black";
    } else {
      return "white";
    }
  }

  // Build a Lichess FEN from the visual board state (used in Lichess variants).
  function buildFenFromLichessBoard() {
    const boardElement = document.querySelector(".cg-wrap");
    if (!boardElement) {
      return null;
    }

    const pieceMap = {
      pawn: "p",
      knight: "n",
      bishop: "b",
      rook: "r",
      queen: "q",
      king: "k",
    };

    const squarePieces = {};
    const pieceElements = boardElement.querySelectorAll("piece");
    if (!pieceElements.length) {
      return null;
    }

    for (const pieceEl of pieceElements) {
      const key = pieceEl.cgKey;
      if (!key || key.length !== 2) {
        continue;
      }
      const classes = pieceEl.className.split(/\s+/);
      const color = classes.includes("white") ? "w" : classes.includes("black") ? "b" : null;
      const pieceType = classes.find((cls) => cls in pieceMap);
      if (!color || !pieceType) {
        continue;
      }
      const pieceLetter = pieceMap[pieceType];
      squarePieces[key] = color === "w" ? pieceLetter.toUpperCase() : pieceLetter;
    }

    const fenRows = [];
    for (let rank = 8; rank >= 1; rank--) {
      let row = "";
      let emptyCount = 0;
      for (let file = 0; file < 8; file++) {
        const key = String.fromCharCode(97 + file) + rank;
        const piece = squarePieces[key];
        if (piece) {
          emptyCount &&= (row += emptyCount, 0);
          row += piece;
        } else {
          emptyCount++;
        }
      }
      if (emptyCount) {
        row += emptyCount;
      }
      fenRows.push(row);
    }

    const fen = fenRows.join("/");
    if (!fen.includes("K") || !fen.includes("k")) {
      return null;
    } else {
      return fen;
    }
  }

  function getLichessRatings() {
    const parseRating = (element) => {
      const text = element?.textContent?.trim();
      if (!text) {
        return null;
      }
      const match = text.match(/(\d{3,4})/);
      if (match) {
        return parseInt(match[1], 10);
      } else {
        return null;
      }
    };
    return {
      playerRating: parseRating(document.querySelector(".ruser-bottom rating")),
      opponentRating: parseRating(document.querySelector(".ruser-top rating")),
    };
  }

  function getLichessSoundApi() {
    const wnd = window;
    if (wnd.site?.sound) {
      return wnd.site;
    } else if (wnd.lichess?.sound) {
      return wnd.lichess;
    } else {
      return null;
    }
  }

  function getLichessSocket() {
    const wnd = window;
    return wnd.lichess?.socket ?? wnd.site?.socket;
  }

  function getLichessPuzzle() {
    const wnd = window;
    return wnd.lichess?.puzzle ?? wnd.site?.puzzle;
  }

  function isLichessStorm() {
    return /^\/storm(\/|$)/.test(location.pathname);
  }

  function isLichessRacer() {
    return /^\/racer(\/|$)/.test(location.pathname);
  }

  function isLichessVariant() {
    return isLichessStorm() || isLichessRacer();
  }

  // Convert a square notation (e.g., "e4") to pixel coordinates on the Lichess board.
  function squareToPixels(boardElement, square, orientation) {
    if (square.length < 2) {
      return null;
    }
    const boardRect = boardElement.getBoundingClientRect();
    const squareSize = boardRect.width / 8;
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1;
    const pixelFile = orientation === "white" ? file : 7 - file;
    const pixelRank = orientation === "white" ? 7 - rank : rank;
    return {
      x: boardRect.left + pixelFile * squareSize + squareSize / 2,
      y: boardRect.top + pixelRank * squareSize + squareSize / 2,
    };
  }

  function getLichessChessground() {
    const wnd = window;
    const chessground = wnd.lichess?.chessground ?? wnd.site?.chessground;
    try {
      const instance = chessground?.();
      if (instance) {
        return instance;
      }
    } catch {}
    return document.querySelector(".main-board .cg-wrap, .cg-wrap")?.["lichess-chessground"] ??
      null;
  }

  // Lichess board adapter: hooks into the sound.move method.
  class LichessAdapter {
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

    matches(hostname) {
      return /(^|\.)lichess\.org$/.test(hostname);
    }

    install(emitFn) {
      this.emit = emitFn;
      this.lastUrl = location.href;

      window.__chessrLichess = () => ({
        hookInstalled: this.hookInstalled,
        lastFen: this.lastFen,
        lastPly: this.lastPly,
        lastGameOver: this.lastGameOver,
        hasSoundCarrier: !!getLichessSoundApi()?.sound?.move,
        orientation: getLichessBoardOrientation(),
      });

      let bootElapsed = 0;
      this.bootPoll = setInterval(() => {
        bootElapsed += 100;
        if (this.tryInstallHook()) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        } else if (bootElapsed >= 5000) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        }
      }, 100);

      this.urlPoll = setInterval(() => {
        if (location.href !== this.lastUrl) {
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

      const soundApi = getLichessSoundApi();
      const moveSound = soundApi?.sound?.move;
      if (!moveSound) {
        return false;
      }

      if (moveSound.__chessrPatched) {
        this.hookInstalled = true;
        return true;
      }

      const origMoveSound = moveSound;
      const wrappedMoveSound = (data) => {
        try {
          this.onSoundMove(data);
        } catch {}
        return origMoveSound.call(soundApi.sound, data);
      };
      wrappedMoveSound.__chessrPatched = true;
      soundApi.sound.move = wrappedMoveSound;
      this.hookInstalled = true;

      getLichessSocket()?.events?.on("endData", (endData) => {
        this.onEndData(endData);
      });

      this.emitInitialMode();
      this.ratingsTimer ||= setTimeout(() => this.detectRatings(), 800);

      const boardElement = document.querySelector(".main-board");
      if (boardElement) {
        this.observer = new MutationObserver(() =>
          setTimeout(() => this.emitInitialMode(), 100)
        );
        this.observer.observe(boardElement, { childList: true });
      }

      return true;
    }

    onSoundMove(data) {
      if (!this.emit) {
        return;
      }

      if (
        (typeof data?.fen != "string" || typeof data?.ply != "number") &&
        isLichessVariant()
      ) {
        setTimeout(() => this.onStormMove(data), 0);
        return;
      }

      if (typeof data?.fen != "string" || typeof data?.ply != "number") {
        return;
      }

      const ply = data.ply;
      const fen = data.fen;
      const normalizedFen = normalizeLichessFen(fen, ply);
      const turn = ply % 2 == 0 ? "white" : "black";
      const isGameOver = isLichessGameOver(data.status?.name);
      const gameEnd = getLichessGameEnd(data.status?.name);

      this.lastFen = normalizedFen;
      this.lastPly = ply;
      this.lastGameOver = isGameOver;
      this.lastGameEnd = gameEnd;
      this.lastResult = getLichessResult(data.status?.name, data.winner);

      this.emit({
        type: "chessr:move",
        fen: normalizedFen,
        gameOver: isGameOver,
        gameEnd,
        turn,
      });
      this.emit({
        type: "chessr:mode",
        name: isGameOver ? "observing" : "playing",
        playingAs: getLichessBoardOrientation(),
        fen: normalizedFen,
        gameOver: isGameOver,
        gameEnd,
        turn,
        result: this.lastResult,
      });

      if (
        !isGameOver &&
        getLichessPuzzle() &&
        turn !== getLichessBoardOrientation()
      ) {
        if (this.postMoveCheckTimer) {
          clearTimeout(this.postMoveCheckTimer);
        }
        this.postMoveCheckTimer = setTimeout(() => {
          this.postMoveCheckTimer = null;
          this.checkForSilentRevert();
        }, 700);
      }
    }

    onStormMove(data, retryCount = 0) {
      if (!this.emit) {
        return;
      }

      const boardFen = buildFenFromLichessBoard();
      if (!boardFen) {
        const retryFunctions = [
          (cb) => requestAnimationFrame(cb),
          (cb) => setTimeout(cb, 50),
          (cb) => setTimeout(cb, 100),
          (cb) => setTimeout(cb, 200),
        ];
        if (retryCount < retryFunctions.length) {
          retryFunctions[retryCount](() => this.onStormMove(data, retryCount + 1));
          return;
        }
        return;
      }

      const orientation = getLichessBoardOrientation();
      const normalizedFen =
        boardFen + " " + (orientation === "white" ? "w" : "b") + " - - 0 1";

      if (!this.lastFen || this.lastFen.split(/\s+/)[0] !== boardFen) {
        this.lastFen = normalizedFen;
        this.lastPly += 1;
        this.lastGameOver = false;
        this.lastGameEnd = null;
        this.lastResult = "*";
        this.emit({
          type: "chessr:move",
          fen: normalizedFen,
          gameOver: false,
          gameEnd: null,
          turn: orientation,
        });
        this.emit({
          type: "chessr:mode",
          name: "playing",
          playingAs: orientation,
          fen: normalizedFen,
          gameOver: false,
          gameEnd: null,
          turn: orientation,
          result: "*",
        });
      }
    }

    checkForSilentRevert() {
      if (!this.emit || !this.lastFen) {
        return;
      }

      const boardFen = buildFenFromLichessBoard();
      if (!boardFen || boardFen === this.lastFen.split(/\s+/)[0]) {
        return;
      }

      const orientation = getLichessBoardOrientation();
      const normalizedFen =
        boardFen + " " + (orientation === "white" ? "w" : "b") + " - - 0 1";
      this.lastFen = normalizedFen;

      this.emit({
        type: "chessr:move",
        fen: normalizedFen,
        gameOver: false,
        gameEnd: null,
        turn: orientation,
      });
      this.emit({
        type: "chessr:mode",
        name: "playing",
        playingAs: orientation,
        fen: normalizedFen,
        gameOver: false,
        gameEnd: null,
        turn: orientation,
        result: "*",
      });
    }

    emitInitialMode() {
      if (!this.emit) {
        return;
      }

      const orientation = getLichessBoardOrientation();
      const isPuzzle = !!getLichessPuzzle();
      const isVariant = isLichessVariant();
      const isPuzzleOrVariant = isPuzzle || isVariant;

      let currentFen = this.lastFen;
      let currentTurn = this.lastPly % 2 == 0 ? "white" : "black";

      if (!currentFen && isPuzzleOrVariant) {
        const boardFen = buildFenFromLichessBoard();
        if (boardFen) {
          currentTurn = orientation;
          currentFen = boardFen + " " + (orientation === "white" ? "w" : "b") + " - - 0 1";
          this.lastFen = currentFen;
        }
      } else if (
        !currentFen &&
        !isPuzzle &&
        !isVariant &&
        buildFenFromLichessBoard() === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      ) {
        currentTurn = "white";
        currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.lastFen = currentFen;
      }

      this.emit({
        type: "chessr:mode",
        name: "playing",
        playingAs: orientation,
        fen: currentFen,
        gameOver: false,
        gameEnd: null,
        turn: currentTurn,
        result: "*",
      });

      if (currentFen) {
        this.emit({
          type: "chessr:move",
          fen: currentFen,
          gameOver: false,
          gameEnd: null,
          turn: currentTurn,
        });
      }
    }

    onEndData(endData) {
      if (!this.emit) {
        return;
      }

      const result = getLichessResult(endData?.status?.name, endData?.winner);
      if (result !== "*") {
        this.lastGameOver = true;
        this.lastResult = result;
        this.lastGameEnd = getLichessGameEnd(endData?.status?.name);
        this.emit({
          type: "chessr:gameOver",
          result,
          fen: this.lastFen ?? undefined,
          gameEnd: this.lastGameEnd,
        });
      }
    }

    detectRatings() {
      if (!this.emit || this.ratingsSent) {
        return;
      }

      const { playerRating, opponentRating } = getLichessRatings();
      if (playerRating !== null || opponentRating !== null) {
        this.emit({
          type: "chessr:ratings",
          playerRating,
          opponentRating,
        });
        this.ratingsSent = true;
      }
    }

    onUrlChange() {
      if (this.emit) {
        this.emit({ type: "chessr:newGame" });
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
        this.postMoveCheckTimer &&= (clearTimeout(this.postMoveCheckTimer), null);
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
            playingAs: getLichessBoardOrientation(),
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

    async executeMove(uciMove, humanizeParams) {
      if (!uciMove || uciMove.length < 4) {
        return false;
      }

      const puzzle = getLichessPuzzle();
      if (puzzle?.playUci) {
        if (humanizeParams) {
          const totalDelay =
            humanizeParams.pickDelay + humanizeParams.selectDelay + humanizeParams.moveDelay;
          if (totalDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, totalDelay));
          }
        }
        try {
          puzzle.playUci(uciMove);
          return true;
        } catch {
          return false;
        }
      }

      const fromSquare = uciMove.slice(0, 2);
      const toSquare = uciMove.slice(2, 4);
      const promotionPiece = uciMove[4];
      const delayMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const chessground = getLichessChessground();
      if (chessground && typeof chessground.selectSquare == "function") {
        if (humanizeParams) {
          const totalDelay =
            humanizeParams.pickDelay + humanizeParams.selectDelay + humanizeParams.moveDelay;
          if (totalDelay > 0) {
            await delayMs(totalDelay);
          }
        }
        try {
          chessground.selectSquare(fromSquare);
          chessground.selectSquare(toSquare);
        } catch {
          return false;
        }
        if (promotionPiece) {
          await delayMs(80);
          const promotionDialog = document.querySelector("#promotion-choice");
          if (promotionDialog) {
            const promotionIndex =
              { q: 0, n: 1, r: 2, b: 3 }[promotionPiece.toLowerCase()] ?? 0;
            promotionDialog.children[promotionIndex]?.click();
          }
        }
        return true;
      }

      const boardElement = document.querySelector(".cg-wrap cg-board");
      if (!boardElement) {
        return false;
      }

      const orientation = getLichessBoardOrientation();
      const fromCoords = squareToPixels(boardElement, fromSquare, orientation);
      const toCoords = squareToPixels(boardElement, toSquare, orientation);

      if (!fromCoords || !toCoords) {
        return false;
      }

      window.postMessage(
        {
          type: "chessr:cdpMouseMove",
          fromX: fromCoords.x,
          fromY: fromCoords.y,
          toX: toCoords.x,
          toY: toCoords.y,
          pickDelay: humanizeParams?.pickDelay ?? 0,
          selectDelay: humanizeParams?.selectDelay ?? 0,
          moveDelay: humanizeParams?.moveDelay ?? 0,
        },
        "*"
      );

      if (promotionPiece) {
        await delayMs(
          (humanizeParams?.pickDelay ?? 0) +
          (humanizeParams?.selectDelay ?? 0) +
          (humanizeParams?.moveDelay ?? 0) +
          200
        );
        const promotionDialog = document.querySelector("#promotion-choice");
        if (promotionDialog) {
          const promotionIndex =
            { q: 0, n: 1, r: 2, b: 3 }[promotionPiece.toLowerCase()] ?? 0;
          const promotionButton = promotionDialog.children[promotionIndex];
          if (promotionButton) {
            const buttonRect = promotionButton.getBoundingClientRect();
            window.postMessage(
              {
                type: "chessr:cdpClick",
                x: buttonRect.left + buttonRect.width / 2,
                y: buttonRect.top + buttonRect.height / 2,
              },
              "*"
            );
          }
        }
      }

      return true;
    }

    executePremove(uciMove) {
      if (!uciMove || uciMove.length < 4) {
        return false;
      } else {
        this.executeMove(uciMove);
        return true;
      }
    }

    cancelPremoves() {
      getLichessChessground()?.cancelPremove?.();
    }

    requestRematch() {
      for (const selector of [
        "button.rematch.fbt",
        ".rematch button",
        'button[data-icon=""]',
        ".rematch-decision .accept",
      ]) {
        const button = document.querySelector(selector);
        if (button) {
          button.click();
          return true;
        }
      }
      return false;
    }
  }

  // ============================================================================
  // WORLDCHESS ADAPTER
  // ============================================================================

  const WORLDCHESS_TAG = "[Chessr worldchess]";
  const WORLDCHESS_GAME_ID_PATTERN = /^\/game\/([0-9a-f-]{36})/i;

  function getWorldchessGameId() {
    const match = location.pathname.match(WORLDCHESS_GAME_ID_PATTERN);
    if (match) {
      return match[1];
    } else {
      return null;
    }
  }

  function getWorldchessEngine(gameId) {
    if (gameId) {
      const engine = window["chessEngine: " + gameId];
      if (engine && typeof engine == "object") {
        return engine;
      }
    }
    for (const key of Object.keys(window)) {
      if (key.startsWith("chessEngine:")) {
        const engine = window[key];
        if (engine && typeof engine == "object" && typeof engine.move == "function") {
          return engine;
        }
      }
    }
    return null;
  }

  function getWorldchessCurrentUserId() {
    const profileLinks = Array.from(document.querySelectorAll('a[href^="/profile/"]'));
    let userIdHref = profileLinks.find((link) =>
      /my profile|mon profil|mein profil|mi perfil|il mio profilo/i.test(link.textContent ?? "")
    )?.getAttribute("href");
    userIdHref ||=
      profileLinks.find(
        (link) =>
          !link.closest('[data-component="GameLayoutPlayer"]') &&
          /^\/profile\/\d+/.test(link.getAttribute("href") ?? "")
      )?.getAttribute("href") ?? "";

    const match = userIdHref?.match(/^\/profile\/(\d+)/);
    if (match) {
      return match[1];
    } else {
      return null;
    }
  }

  function parseWorldchessRating(text, usernameToRemove) {
    const afterRemoval = text.replace(usernameToRemove, "").trim();
    if (!afterRemoval || /^new$/i.test(afterRemoval)) {
      return null;
    }
    const rating = parseInt(afterRemoval, 10);
    if (Number.isFinite(rating) && rating > 0) {
      return rating;
    } else {
      return null;
    }
  }

  const WORLDCHESS_RATING_LABELS = {
    "club player": 1500,
    beginner: 800,
    intermediate: 1200,
    advanced: 1700,
    expert: 1900,
    master: 2100,
    grandmaster: 2400,
  };

  function getWorldchessTitleRating() {
    const match = document.title.match(/\bvs\s+([^/]+?)\s*\//i);
    if (match) {
      return WORLDCHESS_RATING_LABELS[match[1].trim().toLowerCase()] ?? null;
    } else {
      return null;
    }
  }

  function getWorldchessRatings() {
    const currentUserId = getWorldchessCurrentUserId();
    if (!currentUserId) {
      return { playerRating: null, opponentRating: null };
    }

    const playerLayoutElements = Array.from(
      document.querySelectorAll('[data-component="GameLayoutPlayer"]')
    );
    let playerRating = null;
    let opponentRating = null;

    for (const playerLayout of playerLayoutElements) {
      const playerInfo = playerLayout.querySelector('[data-component="GamePlayerInfo"]');
      if (!playerInfo) {
        continue;
      }

      const usernameLink = Array.from(playerInfo.querySelectorAll('a[href^="/profile/"]')).find(
        (link) => (link.textContent ?? "").trim().length > 0
      );
      if (!usernameLink) {
        continue;
      }

      const username = (usernameLink.textContent ?? "").trim();
      const rating = parseWorldchessRating(playerInfo.textContent ?? "", username);

      if ((usernameLink.getAttribute("href") ?? "").startsWith("/profile/" + currentUserId)) {
        playerRating = rating;
      } else {
        opponentRating = rating;
      }
    }

    if (opponentRating === null) {
      opponentRating = getWorldchessTitleRating();
    }

    return { playerRating, opponentRating };
  }

  function getWorldchessBoardRotation() {
    const boardElement = document.querySelector("cg-board");
    if (boardElement && typeof boardElement.rotation == "number") {
      return boardElement.rotation;
    } else {
      return 0;
    }
  }

  function getWorldchessPlayerColor() {
    const boardElement = document.querySelector("cg-board");
    if (!boardElement?.parentElement) {
      return null;
    }

    const reactFiberKey = Object.keys(boardElement.parentElement).find((key) =>
      key.startsWith("__reactFiber")
    );
    if (!reactFiberKey) {
      return null;
    }

    let fiberNode = boardElement.parentElement[reactFiberKey];
    for (let depth = 0; fiberNode && depth < 20; depth++) {
      const playerSide = fiberNode.memoizedProps?.playerSide;
      if (playerSide === "w") {
        return "white";
      }
      if (playerSide === "b") {
        return "black";
      }
      fiberNode = fiberNode.return;
    }
    return null;
  }

  function getWorldchessSquarePixels(squareKey, boardWidth, rotation) {
    if (squareKey.length < 2) {
      return null;
    }
    const file = squareKey.charCodeAt(0) - 97;
    const rank = parseInt(squareKey[1], 10) - 1;

    if (file < 0 || file > 7 || rank < 0 || rank > 7) {
      return null;
    }

    const squareSize = boardWidth / 8;
    let pixelFile, pixelRank;
    if (rotation === 0) {
      pixelFile = file;
      pixelRank = 7 - rank;
    } else {
      pixelFile = 7 - file;
      pixelRank = rank;
    }

    return {
      x: pixelFile * squareSize + squareSize / 2,
      y: pixelRank * squareSize + squareSize / 2,
    };
  }

  function executeWorldchessDrag(uciMove) {
    const boardElement = document.querySelector("cg-board");
    if (!boardElement) {
      return false;
    }

    const boardRect = boardElement.getBoundingClientRect();
    if (!boardRect.width || !boardRect.height) {
      return false;
    }

    const rotation = typeof boardElement.rotation == "number" ? boardElement.rotation : 0;
    const fromCoords = getWorldchessSquarePixels(uciMove.slice(0, 2), boardRect.width, rotation);
    const toCoords = getWorldchessSquarePixels(uciMove.slice(2, 4), boardRect.width, rotation);

    if (!fromCoords || !toCoords) {
      return false;
    }

    const dispatchMouseEvent = (eventType, relX, relY) => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: boardRect.left + relX,
        clientY: boardRect.top + relY,
        button: 0,
        buttons: eventType === "mouseup" ? 0 : 1,
      });
      boardElement.dispatchEvent(event);
    };

    dispatchMouseEvent("mousedown", fromCoords.x, fromCoords.y);
    dispatchMouseEvent("mousemove", toCoords.x, toCoords.y);
    dispatchMouseEvent("mouseup", toCoords.x, toCoords.y);

    return true;
  }

  function normalizeFenWorldchess(fen, turn) {
    if (!fen || typeof fen != "string") {
      return null;
    }
    const parts = fen.trim().split(/\s+/);
    if (parts.length >= 6) {
      return parts.slice(0, 6).join(" ");
    }
    if (parts.length === 1) {
      return parts[0] + " " + (turn ?? "w") + " - - 0 1";
    }
    const t = parts[1] ?? turn ?? "w";
    const castle = parts[2] ?? "-";
    const enPassant = parts[3] ?? "-";
    const halfmove = parts[4] ?? "0";
    const fullmove = parts[5] ?? "1";
    return parts[0] + " " + t + " " + castle + " " + enPassant + " " + halfmove + " " + fullmove;
  }

  function charToColor(char) {
    if (char === "b") {
      return "black";
    } else {
      return "white";
    }
  }

  function getWorldchessGameEnd(checkmateData) {
    if (checkmateData?.checkmate) {
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

  // WorldChess board adapter: hooks into the engine object's store.
  class WorldchessAdapter {
    emit = null;
    engine = null;
    gameId = null;
    bootPoll = null;
    urlPoll = null;
    ratingsPoll = null;
    ratingsLast = { playerRating: null, opponentRating: null };
    lastUrl = "";
    playerColor = null;
    disposers = [];
    lastFen = null;
    lastGameOver = false;
    lastResult = "*";
    lastGameEnd = null;

    matches(hostname) {
      return /(^|\.)worldchess\.com$/.test(hostname);
    }

    install(emitFn) {
      this.emit = emitFn;
      this.lastUrl = location.href;

      window.__chessrWorldchess = () => ({
        gameId: this.gameId,
        hasEngine: !!this.engine,
        lastFen: this.lastFen,
        lastGameOver: this.lastGameOver,
        playerColor: this.playerColor,
        boardRotation: getWorldchessBoardRotation(),
      });

      let bootElapsed = 0;
      this.bootPoll = setInterval(() => {
        bootElapsed += 200;
        if (this.tryAttachEngine()) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        } else if (bootElapsed >= 15000) {
          this.bootPoll &&= (clearInterval(this.bootPoll), null);
        }
      }, 200);

      this.urlPoll = setInterval(() => {
        if (location.href !== this.lastUrl) {
          this.lastUrl = location.href;
          this.onUrlChange();
        }
      }, 500);

      this.startRatingsPoll(emitFn);
      return () => this.dispose();
    }

    startRatingsPoll(emitFn) {
      if (this.ratingsPoll) {
        clearInterval(this.ratingsPoll);
      }
      this.ratingsLast = { playerRating: null, opponentRating: null };
      let pollElapsed = 0;

      const checkRatings = () => {
        const ratings = getWorldchessRatings();
        if (
          (ratings.playerRating !== this.ratingsLast.playerRating ||
            ratings.opponentRating !== this.ratingsLast.opponentRating) &&
          (ratings.playerRating !== null || ratings.opponentRating !== null)
        ) {
          this.ratingsLast = ratings;
          emitFn({
            type: "chessr:ratings",
            playerRating: ratings.playerRating,
            opponentRating: ratings.opponentRating,
          });
        }
        if (
          (ratings.playerRating !== null && ratings.opponentRating !== null) ||
          pollElapsed >= 15000
        ) {
          this.ratingsPoll &&= (clearInterval(this.ratingsPoll), null);
        }
      };

      checkRatings();
      this.ratingsPoll = setInterval(() => {
        pollElapsed += 500;
        checkRatings();
      }, 500);
    }

    tryAttachEngine() {
      if (this.engine) {
        return true;
      }

      const gameId = getWorldchessGameId();
      if (!gameId) {
        return false;
      }

      const engine = getWorldchessEngine(gameId);
      if (!engine) {
        return false;
      }

      this.engine = engine;
      this.gameId = gameId;

      const playerColor = getWorldchessPlayerColor();
      const boardRotation = getWorldchessBoardRotation();
      this.playerColor =
        playerColor ?? (boardRotation === 0 ? "white" : "black");

      const fenDisposer = engine.store.on("currentFen", () => this.onFenChange());
      const checkmateDisposer = engine.store.on("checkmateData", () => this.onCheckmate());
      this.disposers.push(fenDisposer, checkmateDisposer);

      return true;
    }

    onFenChange() {
      if (!this.emit || !this.engine) {
        return;
      }

      const state = this.engine.store.get();
      const normalizedFen = normalizeFenWorldchess(state.currentFen, state.turn);

      if (!normalizedFen || this.lastFen === normalizedFen) {
        return;
      }

      const turn = charToColor(state.turn);
      const isCheckmate = !!state.checkmateData?.checkmate;
      const gameEnd = getWorldchessGameEnd(state.checkmateData);

      this.lastFen = normalizedFen;
      this.lastGameOver = isCheckmate;
      this.lastGameEnd = gameEnd;
      if (isCheckmate) {
        this.lastResult = turn === "white" ? "0-1" : "1-0";
      }

      this.emit({
        type: "chessr:move",
        fen: normalizedFen,
        gameOver: isCheckmate,
        gameEnd,
        turn,
      });

      this.emit({
        type: "chessr:mode",
        name: isCheckmate ? "observing" : "playing",
        playingAs: this.playerColor,
        fen: normalizedFen,
        gameOver: isCheckmate,
        gameEnd,
        turn,
        result: this.lastResult,
      });

      if (isCheckmate) {
        this.emit({
          type: "chessr:gameOver",
          result: this.lastResult,
          fen: normalizedFen,
          turn,
          gameEnd,
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
      for (const disposer of this.disposers) {
        try {
          disposer();
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
        this.emit({ type: "chessr:newGame" });
      }
      if (this.emit) {
        this.startRatingsPoll(this.emit);
      }

      if (!this.bootPoll) {
        let bootElapsed = 0;
        this.bootPoll = setInterval(() => {
          bootElapsed += 200;
          if (this.tryAttachEngine() || bootElapsed >= 15000) {
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
      for (const disposer of this.disposers) {
        try {
          disposer();
        } catch {}
      }
      this.disposers.length = 0;
      this.engine = null;
      this.emit = null;
    }

    requestState() {
      if (this.emit) {
        if (this.lastFen && this.engine) {
          const state = this.engine.store.get();
          this.emit({
            type: "chessr:mode",
            name: this.lastGameOver ? "observing" : "playing",
            playingAs: this.playerColor,
            fen: this.lastFen,
            gameOver: this.lastGameOver,
            gameEnd: this.lastGameEnd,
            turn: charToColor(state.turn),
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

    async executeMove(uciMove, humanizeParams) {
      if (!uciMove || uciMove.length < 4) {
        return false;
      }

      const engine = this.engine;
      if (!engine || typeof engine.move != "function") {
        return false;
      }

      if (humanizeParams) {
        const totalDelay =
          humanizeParams.pickDelay + humanizeParams.selectDelay + humanizeParams.moveDelay;
        if (totalDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, totalDelay));
        }
      }

      try {
        await engine.move(uciMove, { isUserMove: true });
        return true;
      } catch {
        return false;
      }
    }

    executePremove(uciMove) {
      if (!uciMove || uciMove.length < 4) {
        return false;
      } else {
        return !!executeWorldchessDrag(uciMove);
      }
    }

    cancelPremoves() {
      // WorldChess doesn't support premove cancellation.
    }

    requestRematch() {
      for (const selector of [
        '[data-component="GameLayoutDesktopLeftControls"] button',
        '[data-component="GameLayoutMobileControlButtons"] button',
      ]) {
        const button = document.querySelector(selector);
        if (button && /new\s*game/i.test(button.textContent ?? "")) {
          button.click();
          return true;
        }
      }
      return false;
    }
  }

  // ============================================================================
  // DISPATCHER
  // ============================================================================

  const adapters = [new ChessBoardAdapter(), new LichessAdapter(), new WorldchessAdapter()];

  function selectAdapter(hostname) {
    return adapters.find((adapter) => adapter.matches(hostname)) ?? null;
  }

  const mainPageContext = {
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
      const adapter = selectAdapter(location.hostname);
      if (adapter) {
        adapter.install((message) => window.postMessage(message, "*"));

        window.addEventListener("message", (event) => {
          const data = event.data;
          if (typeof data?.type == "string" && data.type.startsWith("chessr:")) {
            switch (data.type) {
              case "chessr:executeMove":
                adapter.executeMove(data.move, data.humanize ?? undefined);
                break;
              case "chessr:executePremove":
                adapter.executePremove(data.move);
                break;
              case "chessr:cancelPremoves":
                adapter.cancelPremoves();
                break;
              case "chessr:rematch":
                adapter.requestRematch();
                break;
              case "chessr:requestState":
                adapter.requestState?.();
                break;
            }
          }
        });
      }
    },
  };

  // ---- WXT-style logger ----

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

  // ---- Boot ----

  return (async () => {
    try {
      return await mainPageContext.main();
    } catch (error) {
      logger.error('The content script "pageContext" crashed on startup!', error);
      throw error;
    }
  })();
})();
