class Connect4AI {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.PLAYER1 = 1; // Joueur humain (rouge)
        this.PLAYER2 = 2; // IA (jaune)
        this.EMPTY = 0;
        
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(this.EMPTY));
        this.currentPlayer = this.PLAYER1;
        this.gameActive = true;
        this.aiThinking = false;
        this.nodesEvaluated = 0;
        
        this.difficulty = {
            'easy': 3,
            'medium': 5,
            'hard': 7,
            'expert': 9
        };
        this.currentDifficulty = 'medium';
        
        this.stats = {
            playerWins: 0,
            aiWins: 0,
            draws: 0,
            gamesPlayed: 0
        };

        this.initializeBoard();
        this.initializeEventListeners();
        this.updateStatus();
    }

    initializeBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }

    initializeEventListeners() {
        document.getElementById('board').addEventListener('click', (e) => this.handleCellClick(e));
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        document.querySelectorAll('.difficulty').forEach(btn => {
            btn.addEventListener('click', (e) => this.setDifficulty(e.target.id));
        });
    }

    setDifficulty(level) {
        this.currentDifficulty = level;
        document.querySelectorAll('.difficulty').forEach(btn => btn.classList.remove('active'));
        document.getElementById(level).classList.add('active');
        document.getElementById('currentDepth').textContent = this.difficulty[level];
    }

    handleCellClick(e) {
        if (!e.target.classList.contains('cell') || !this.gameActive || this.aiThinking) return;
        
        const col = parseInt(e.target.dataset.col);
        
        if (this.currentPlayer === this.PLAYER1) {
            if (this.makeMove(col, this.PLAYER1)) {
                if (this.gameActive) {
                    setTimeout(() => this.aiMove(), 500);
                }
            }
        }
    }

    makeMove(col, player) {
        // Trouve la première case vide dans la colonne (de bas en haut)
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] === this.EMPTY) {
                this.board[row][col] = player;
                this.updateCellDisplay(row, col, player);
                
                const winner = this.checkWinner();
                if (winner) {
                    this.endGame(winner);
                } else if (this.isBoardFull()) {
                    this.endGame('draw');
                } else {
                    this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
                    this.updateStatus();
                }
                return true;
            }
        }
        return false; // Colonne pleine
    }

    aiMove() {
        if (!this.gameActive || this.currentPlayer !== this.PLAYER2) return;
        
        this.aiThinking = true;
        this.nodesEvaluated = 0;
        this.updateStatus();
        
        setTimeout(() => {
            const depth = this.difficulty[this.currentDifficulty];
            const bestMove = this.minimax(this.board, depth, -Infinity, Infinity, true);
            
            this.makeMove(bestMove.col, this.PLAYER2);
            this.aiThinking = false;
            this.updateStatus();
            document.getElementById('nodesEvaluated').textContent = this.nodesEvaluated.toLocaleString();
        }, 800);
    }

    minimax(board, depth, alpha, beta, maximizingPlayer) {
        this.nodesEvaluated++;
        
        const winner = this.checkWinnerForBoard(board);
        
        // Cas terminaux
        if (winner === this.PLAYER2) return { score: 1000000 + depth };
        if (winner === this.PLAYER1) return { score: -1000000 - depth };
        if (depth === 0 || this.isBoardFullForBoard(board)) {
            return { score: this.evaluateBoard(board) };
        }

        const validMoves = this.getValidMoves(board);
        
        if (maximizingPlayer) {
            let maxEval = { score: -Infinity, col: validMoves[0] };
            
            for (let col of validMoves) {
                const newBoard = this.simulateMove(board, col, this.PLAYER2);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false);
                
                if (result.score > maxEval.score) {
                    maxEval = { score: result.score, col: col };
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break; // Élagage alpha-beta
            }
            return maxEval;
        } else {
            let minEval = { score: Infinity, col: validMoves[0] };
            
            for (let col of validMoves) {
                const newBoard = this.simulateMove(board, col, this.PLAYER1);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true);
                
                if (result.score < minEval.score) {
                    minEval = { score: result.score, col: col };
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break; // Élagage alpha-beta
            }
            return minEval;
        }
    }

    evaluateBoard(board) {
        let score = 0;
        
        // Évaluation basée sur les positions centrales
        for (let row = 0; row < this.ROWS; row++) {
            if (board[row][3] === this.PLAYER2) score += 3;
            if (board[row][3] === this.PLAYER1) score -= 3;
        }
        
        // Évaluation des alignements partiels
        score += this.evaluateWindow(board, this.PLAYER2) - this.evaluateWindow(board, this.PLAYER1);
        
        return score;
    }

    evaluateWindow(board, player) {
        let score = 0;
        
        // Vérification horizontale
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                const window = [board[row][col], board[row][col+1], board[row][col+2], board[row][col+3]];
                score += this.scoreWindow(window, player);
            }
        }
        
        // Vérification verticale
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const window = [board[row][col], board[row+1][col], board[row+2][col], board[row+3][col]];
                score += this.scoreWindow(window, player);
            }
        }
        
        // Vérification diagonale (haut-gauche vers bas-droite)
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                const window = [board[row][col], board[row+1][col+1], board[row+2][col+2], board[row+3][col+3]];
                score += this.scoreWindow(window, player);
            }
        }
        
        // Vérification diagonale (bas-gauche vers haut-droite)
        for (let row = 3; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                const window = [board[row][col], board[row-1][col+1], board[row-2][col+2], board[row-3][col+3]];
                score += this.scoreWindow(window, player);
            }
        }
        
        return score;
    }

    scoreWindow(window, player) {
        let score = 0;
        const opponent = player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        
        const playerCount = window.filter(cell => cell === player).length;
        const emptyCount = window.filter(cell => cell === this.EMPTY).length;
        const opponentCount = window.filter(cell => cell === opponent).length;
        
        if (playerCount === 4) score += 100;
        else if (playerCount === 3 && emptyCount === 1) score += 10;
        else if (playerCount === 2 && emptyCount === 2) score += 2;
        
        if (opponentCount === 3 && emptyCount === 1) score -= 80;
        
        return score;
    }

    simulateMove(board, col, player) {
        const newBoard = board.map(row => [...row]);
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (newBoard[row][col] === this.EMPTY) {
                newBoard[row][col] = player;
                break;
            }
        }
        return newBoard;
    }

    getValidMoves(board) {
        const moves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (board[0][col] === this.EMPTY) {
                moves.push(col);
            }
        }
        // Priorise les colonnes centrales
        moves.sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
        return moves;
    }

    checkWinner() {
        return this.checkWinnerForBoard(this.board);
    }

    checkWinnerForBoard(board) {
        // Vérification horizontale
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (board[row][col] !== this.EMPTY &&
                    board[row][col] === board[row][col + 1] &&
                    board[row][col] === board[row][col + 2] &&
                    board[row][col] === board[row][col + 3]) {
                    return board[row][col];
                }
            }
        }

        // Vérification verticale
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (board[row][col] !== this.EMPTY &&
                    board[row][col] === board[row + 1][col] &&
                    board[row][col] === board[row + 2][col] &&
                    board[row][col] === board[row + 3][col]) {
                    return board[row][col];
                }
            }
        }

        // Vérification diagonale (haut-gauche vers bas-droite)
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (board[row][col] !== this.EMPTY &&
                    board[row][col] === board[row + 1][col + 1] &&
                    board[row][col] === board[row + 2][col + 2] &&
                    board[row][col] === board[row + 3][col + 3]) {
                    return board[row][col];
                }
            }
        }

        // Vérification diagonale (bas-gauche vers haut-droite)
        for (let row = 3; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (board[row][col] !== this.EMPTY &&
                    board[row][col] === board[row - 1][col + 1] &&
                    board[row][col] === board[row - 2][col + 2] &&
                    board[row][col] === board[row - 3][col + 3]) {
                    return board[row][col];
                }
            }
        }

        return null;
    }

    isBoardFull() {
        return this.isBoardFullForBoard(this.board);
    }

    isBoardFullForBoard(board) {
        return board[0].every(cell => cell !== this.EMPTY);
    }

    endGame(result) {
        this.gameActive = false;
        this.stats.gamesPlayed++;
        
        if (result === 'draw') {
            this.stats.draws++;
            document.getElementById('status').textContent = '🤝 Match nul !';
        } else if (result === this.PLAYER1) {
            this.stats.playerWins++;
            document.getElementById('status').textContent = '🎉 Félicitations ! Vous avez gagné !';
        } else {
            this.stats.aiWins++;
            document.getElementById('status').textContent = '🤖 L\'IA a gagné ! Bel essai !';
        }
        
        this.updateStats();
        this.highlightWinningCells(result);
    }

    highlightWinningCells(winner) {
        if (winner === 'draw') return;
        
        // Trouve les cellules gagnantes et les met en évidence
        const winningCells = this.findWinningCells(winner);
        winningCells.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('winning');
            }
        });
    }

    findWinningCells(winner) {
        // Vérification horizontale
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] === winner &&
                    this.board[row][col + 1] === winner &&
                    this.board[row][col + 2] === winner &&
                    this.board[row][col + 3] === winner) {
                    return [[row, col], [row, col + 1], [row, col + 2], [row, col + 3]];
                }
            }
        }
        
        // Vérification verticale
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] === winner &&
                    this.board[row + 1][col] === winner &&
                    this.board[row + 2][col] === winner &&
                    this.board[row + 3][col] === winner) {
                    return [[row, col], [row + 1, col], [row + 2, col], [row + 3, col]];
                }
            }
        }
        
        // Vérification diagonale (haut-gauche vers bas-droite)
        for (let row = 0; row < this.ROWS - 3; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] === winner &&
                    this.board[row + 1][col + 1] === winner &&
                    this.board[row + 2][col + 2] === winner &&
                    this.board[row + 3][col + 3] === winner) {
                    return [[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]];
                }
            }
        }
        
        // Vérification diagonale (bas-gauche vers haut-droite)
        for (let row = 3; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS - 3; col++) {
                if (this.board[row][col] === winner &&
                    this.board[row - 1][col + 1] === winner &&
                    this.board[row - 2][col + 2] === winner &&
                    this.board[row - 3][col + 3] === winner) {
                    return [[row, col], [row - 1, col + 1], [row - 2, col + 2], [row - 3, col + 3]];
                }
            }
        }
        
        return [];
    }

    resetGame() {
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(this.EMPTY));
        this.currentPlayer = this.PLAYER1;
        this.gameActive = true;
        this.aiThinking = false;
        this.nodesEvaluated = 0;
        
        this.initializeBoard();
        this.updateStatus();
        document.getElementById('nodesEvaluated').textContent = '0';
    }

    updateCellDisplay(row, col, player) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add(player === this.PLAYER1 ? 'player1' : 'player2');
            cell.classList.add('dropping');
        }
    }

    updateStatus() {
        const statusEl = document.getElementById('status');
        
        if (!this.gameActive) return;
        
        if (this.aiThinking) {
            statusEl.innerHTML = '<span class="ai-thinking">🤖 L\'IA analyse les possibilités...</span>';
        } else if (this.currentPlayer === this.PLAYER1) {
            statusEl.textContent = '🔴 À vous de jouer ! Choisissez une colonne';
        } else {
            statusEl.textContent = '🟡 Tour de l\'IA';
        }
    }

    updateStats() {
        document.getElementById('playerWins').textContent = this.stats.playerWins;
        document.getElementById('aiWins').textContent = this.stats.aiWins;
        document.getElementById('draws').textContent = this.stats.draws;
        document.getElementById('gamesPlayed').textContent = this.stats.gamesPlayed;
    }
}

// Initialisation du jeu
const game = new Connect4AI();