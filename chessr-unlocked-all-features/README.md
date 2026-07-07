# chessr-unlocked-all-features — Active Development (All Features Unlocked)

This is the **Unlocked Version** — the modified Chessr.io extension with the entire 
authentication system removed and all premium features unlocked by default.

## What's Different

- ✅ Complete authentication system removal (no login required)
- ✅ All premium features unlocked by default
- ✅ Anonymous user mode (`{ id: "anon", email: "anonymous@chessr.local" }`)
- ✅ All chess engines available (Stockfish, Dragon, Rodent IV, Maia 3, Torch)
- ✅ No subscription gates or trial limitations
- ✅ Fully deobfuscated and formatted source code

## Architecture

- Started as an exact copy of `chessr-original-restored/` (the frozen, structure-restored 
  baseline with no functional changes).
- The sibling `chessr-original-restored/` folder is a permanent reference and must not be 
  edited — treat it as read-only. Diff against it to see what changed during the auth 
  removal and feature unlocking.
- All future development and improvements should be made here.
- See `project-documentation/PROJECT_REPORT.md` inside this folder for the full 
  architecture write-up and technical documentation covering:
  - Component responsibilities
  - Message protocol between contexts
  - Engine orchestration system
  - Three-platform adapter pattern (Chess.com, Lichess, WorldChess)

## Installation

1. Clone or extract this folder
2. Load the extension in Chrome via `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder
5. Navigate to chess.com, lichess.org, or worldchess.com to activate the overlay

## Key Modifications

### Authentication System
- Mock user created automatically on startup
- All auth methods stubbed (signIn, signUp, signOut, changePassword, resetPassword, resendConfirmation, resetPassword)
- `initialize()` method replaced with no-op
- No login/registration UI screens

### Premium Gates
- `isPremium()` always returns true
- `isFree()` always returns false  
- `plan: "premium"` in all initial states

### Code Quality
- All minified code deobfuscated and beautified
- String arrays restored to readable form
- Consistent formatting across bundles
- ~400 KB reduction from auth system removal optimization
