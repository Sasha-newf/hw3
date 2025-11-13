// ---------------------------------------------------------------------
// Heuristic evaluation function with extra features
// ---------------------------------------------------------------------
// Features:
// - aggregateHeight: sum of all column heights
// - maxHeight: maximum column height
// - completeLines: number of full rows
// - holes: empty cells with at least one block above
// - blocksAboveHoles: blocks hanging above holes
// - bumpiness: difference between neighboring column heights
// - wells: depth of wells (columns lower than both neighbors)
// ---------------------------------------------------------------------

function evaluateBoard(board) {
    let aggregateHeight    = 0;
    let maxHeight          = 0;
    let completeLines      = 0;
    let holes              = 0;
    let blocksAboveHoles   = 0;
    let bumpiness          = 0;
    let wells              = 0;

    let columnHeights = new Array(nx).fill(0);

    // Column heights, aggregate height, max height
    for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                let h = ny - y;
                columnHeights[x] = h;
                aggregateHeight += h;
                if (h > maxHeight)
                    maxHeight = h;
                break;
            }
        }
    }

    // Complete lines
    for (let y = 0; y < ny; y++) {
        let complete = true;
        for (let x = 0; x < nx; x++) {
            if (board[x][y] === 0) {
                complete = false;
                break;
            }
        }
        if (complete)
            completeLines++;
    }

    // Holes + blocks above holes
    for (let x = 0; x < nx; x++) {
        let blockFound  = false;
        let blocksSeen  = 0; // how many blocks above current cell

        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                blockFound = true;
                blocksSeen++;
            } else if (blockFound) {
                // this is a hole (empty with blocks above)
                holes++;
                blocksAboveHoles += blocksSeen;
            }
        }
    }

    // Bumpiness (difference between neighbor columns)
    for (let x = 0; x < nx - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
    }

    // Wells (columns lower than both neighbors)
    for (let x = 0; x < nx; x++) {
        let leftHeight  = (x === 0)      ? columnHeights[x + 1] : columnHeights[x - 1];
        let rightHeight = (x === nx - 1) ? columnHeights[x - 1] : columnHeights[x + 1];
        let minNeighbor = Math.min(leftHeight, rightHeight);
        if (columnHeights[x] < minNeighbor) {
            wells += (minNeighbor - columnHeights[x]);
        }
    }

    // Linear combination of all features (tuned weights)
    return (
          1.00 * completeLines    // like clearing lines
        - 0.50 * aggregateHeight  // dislike tall overall stack
        - 0.70 * maxHeight        // dislike being close to the top
        - 0.90 * holes            // strongly dislike holes
        - 0.40 * blocksAboveHoles // dislike blocks hanging above holes
        - 0.30 * bumpiness        // dislike uneven surface
        - 0.25 * wells            // dislike deep wells
    );
}

// ---------------------------------------------------------------------
// Helper: deep copy of the current board ("blocks" from game.js)
// ---------------------------------------------------------------------

function copyBlocks(src) {
    let dst = [];
    for (let x = 0; x < nx; x++) {
        dst[x] = [];
        for (let y = 0; y < ny; y++) {
            dst[x][y] = src[x][y];
        }
    }
    return dst;
}

// ---------------------------------------------------------------------
// Helper: compute drop position for a given type/x/dir on current board
// ---------------------------------------------------------------------

function getDropPositionFor(type, x, dir) {
    let y = 0;
    while (!occupied(type, x, y + 1, dir)) {
        y++;
    }
    return y;
}

// ---------------------------------------------------------------------
// Generate all possible moves for the current piece
// ---------------------------------------------------------------------

function getPossibleMoves(piece) {
    let moves = [];
    let type = piece.type;

    for (let dir = 0; dir < 4; dir++) {
        // try all horizontal positions where the piece of this size can fit
        for (let x = 0; x <= nx - type.size; x++) {

            // skip obviously invalid placements (colliding at the spawn row)
            if (!unoccupied(type, x, 0, dir))
                continue;

            let y = getDropPositionFor(type, x, dir);

            // simulate placing the piece on a copy of the board
            let newBoard = copyBlocks(blocks);
            eachblock(type, x, y, dir, function (bx, by) {
                newBoard[bx][by] = type;
            });

            moves.push({
                x: x,
                y: y,
                dir: dir,
                board: newBoard
            });
        }
    }

    return moves;
}

// ---------------------------------------------------------------------
// Select the best move according to the heuristic
// ---------------------------------------------------------------------

function selectBestMove(piece) {
    let moves = getPossibleMoves(piece);
    let bestMove  = null;
    let bestScore = -Infinity;

    moves.forEach(move => {
        let score = evaluateBoard(move.board);
        if (score > bestScore) {
            bestScore = score;
            bestMove  = move;
        }
    });

    return bestMove;
}
