1. Fixing the Tetris game
I first went through game.js and found three main issues
Bug 1 – Wrong rotation for the J piece
The second rotation of the J tetromino had an incorrect bit mask:

```js  
// original
const j = { size: 3, blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: 'blue' };
```

0x8E00 produces a broken shape. I changed it to 0x8E80:

```js  
// FIX 1: fixed the 2nd rotation of the J piece (0x8E00 -> 0x8E80)
const j = { size: 3, blocks: [0x44C0, 0x8E80, 0x6440, 0x0E20], color: 'blue' };
```
Now J rotates correctly in all orientations

Bug 2 – Biased random piece selection
Pieces are drawn from a “bag” using:

```js  
var type = pieces.splice(random(0, pieces.length-1), 1)[0];
```
Here random returns a float, so the last index is basically never selected
I replaced it with a proper integer index:

```js  
// FIX 2: use an integer index from 0 to pieces.length-1
var index = Math.floor(Math.random() * pieces.length);
var type  = pieces.splice(index, 1)[0];
```
This makes the distribution of tetrominoes uniform again


Bug 3 – Wrong row range in line removal
In removeLines the loop was:

```js  
for (y = ny; y > 0; --y) { ... }
```

This skipped row 0 and accessed row ny (which doesn’t exist)
I fixed the loop to cover all valid rows from bottom to top:

```js  
// FIX 3: correct row range 0..ny-1
for (y = ny - 1; y >= 0; --y) {
    ...
}```

After these fixes, lines are cleared correctly and the board shifts down as expected




2. Improved heuristic agent

The original heuristic agent only looked at:
  aggregate column height
  number of complete lines
  number of holes
  bumpiness of the surface

I extended the evaluation function with extra features and tuned the weights

New features:
  maxHeight – maximum column height, to penalize being close to the top
  blocksAboveHoles – how many blocks “hang” above holes; such holes are very hard to fix
  wells – total depth of wells (columns that are significantly lower than both neighbors)

The final score is a linear combination:

```js  
score =
    1.00 * completeLines
  - 0.50 * aggregateHeight
  - 0.70 * maxHeight
  - 0.90 * holes
  - 0.40 * blocksAboveHoles
  - 0.30 * bumpiness
  - 0.25 * wells;
```

The one-ply heuristic agent works like this:
for the current piece, it enumerates all legal positions (all rotations and x-values), simulates dropping the piece on a copy of the board, evaluates the resulting board with evaluateBoard and chooses the move with the best score


3. Beam Search agent

To get a stronger agent, I implemented Beam Search on top of the same heuristic

Basic setup:
  Beam width: k = 5 states per depth
  Depth: d = 2 – first place the current piece, then the next piece

Each search state stores:
  a board configuration
  the first move that led to this state (x, y, dir)
  the heuristic score of the board

At each depth:
  For every state in the current beam, generate all legal placements of the relevant piece (current or next)
  Apply the move on a copy of the board, evaluate the new board
  If the state has no firstMove yet, record the current move as its firstMove
  Collect all candidate states, sort them by score, and keep only the top k


In the end, the best state in the final beam is chosen, and its firstMove is played:

```js  
function agent() {
    let bestMove = beamSearchAgent(current, next);
    if (bestMove) {
        current.x   = bestMove.x;
        current.y   = bestMove.y;
        current.dir = bestMove.dir;
        drop();
    }
}
```

So this agent explicitly looks two pieces ahead instead of being purely greedy


4.  Results and observations

I compared two agents:
  the simple one-ply heuristic agent (selectBestMove)
  the Beam Search agent (beamSearchAgent with depth 2, width 5)

In multiple runs, the Beam Search agent:
  survives longer on average
  scores higher
  produces fewer deep wells and “buried” holes


  The difference is especially visible when the board is half full and greedy decisions become risky

  5. Conclusion

In this homework I:
  understood the Tetris implementation and fixed several non-trivial bugs
  extended the heuristic with additional features (max height, blocks above holes, wells) and tuned the weights
  implemented a Beam Search agent that plans two moves ahead using this heuristic.
