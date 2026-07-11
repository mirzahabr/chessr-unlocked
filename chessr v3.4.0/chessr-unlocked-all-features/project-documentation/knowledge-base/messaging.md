<!-- BEGIN AUTO-GENERATED: overview -->
Content-script (isolated world) and page-context (MAIN world) communicate via
`window.postMessage` using `chessr:*` message types (extracted list in the signature):
mode/move/newGame/gameOver/initialMoves/ratings (page→content),
executeMove/executePremove/cancelPremoves/rematch/requestState (content→page),
cdpMouseMove/cdpClick (content→background, CDP synthetic input), setAnon/setTitle, rescan.
<!-- END AUTO-GENERATED: overview -->
