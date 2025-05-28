// script.js - 십이장기 규칙에 맞게 수정된 버전

document.addEventListener('DOMContentLoaded', function() {
    // ==== DOM 캐시 ====
    const board = document.getElementById('board');
    const capturedPiecesP1 = document.getElementById('captured-p1');
    const capturedPiecesP2 = document.getElementById('captured-p2');

    // ==== 게임 상태 변수 ====
    let selectedCell = null;
    let currentPlayer = '1'; // '1': 파란, '2': 빨간
    let capturedPieces = { '1': [], '2': [] };
    let isCapturePlacing = false;
    let selectedCapturedPieceIndex = -1;
    // 왕의 상대 진영 침입 체크를 위한 변수
    let wangInEnemyTerritory = { '1': false, '2': false };
    let wangSurvived = { '1': false, '2': false };

    // ==== 턴/게임 정보 UI ====
    const turnDisplay = createTurnDisplay();
    const gameInfo = createGameInfo();
    const startButton = createGameButton('게임 다시 시작', resetGame, 'game-button');
    const rulesButton = createGameButton('게임 규칙 보기', toggleRules, 'game-button rules-button');
    document.body.insertBefore(turnDisplay, document.querySelector('.game-board'));
    document.body.appendChild(startButton);
    document.body.insertBefore(rulesButton, startButton);
    document.body.appendChild(gameInfo);
    gameInfo.style.display = 'none';

    // ==== 이벤트 리스너 바인딩 ====
    board.addEventListener('click', handleBoardClick);
    addCapturedPieceListeners();

    // ==== 함수 정의 ====

    function createTurnDisplay() {
        const el = document.createElement('div');
        el.className = 'turn-display turn-player1';
        el.textContent = '현재 턴: 플레이어 1 (파란색)';
        return el;
    }

    function createGameInfo() {
        const el = document.createElement('div');
        el.className = 'game-info';
        el.innerHTML = `
            <h3>십이장기 게임 방법</h3>
            <p>1. 말은 규칙에 따라 한 칸씩 이동할 수 있습니다.</p>
            <p>2. 상대방의 말을 잡을 수 있습니다.</p>
            <p>3. 잡은 말은 턴을 소모하여 상대 진영을 제외한 빈 칸에 배치할 수 있습니다.</p>
            <p>4. 자(子)가 상대 진영에 들어가면 후(侯)로 승진합니다.</p>
            <p>5. 왕(王)을 잡거나, 왕(王)이 상대 진영에 들어가 한 턴을 버티면 승리합니다!</p>
            <h4>말의 이동 방향</h4>
            <p>- 왕(王): 모든 방향으로 한 칸 이동 가능</p>
            <p>- 장(將): 상하좌우 방향으로 한 칸 이동 가능</p>
            <p>- 상(相): 대각선 방향으로 한 칸 이동 가능</p>
            <p>- 자(子): 앞쪽 방향으로만 한 칸 이동 가능</p>
            <p>- 후(侯): 대각선 뒤쪽 방향을 제외한 모든 방향으로 한 칸 이동 가능</p>
            <h4>잡은 말 내려놓기 (재활용)</h4>
            <p>- 자신의 턴에, 이미 잡은 상대방의 기물 중 하나를 상대 진영을 제외한 게임판의 빈칸에 내려놓을 수 있습니다.</p>
            <p>- 기물을 내려놓는 것은 턴을 소모하는 행동입니다.</p>
            <p>- 내려놓은 기물은 자신의 기물이 됩니다.</p>
            <p>- 상대방의 후(侯)를 잡았을 경우, 자(子)로 뒤집어서 사용해야 합니다.</p>
        `;
        return el;
    }

    function createGameButton(text, handler, className = '') {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = className;
        btn.addEventListener('click', handler);
        return btn;
    }

    function toggleRules() {
        if (gameInfo.style.display === 'none') {
            gameInfo.style.display = 'block';
            rulesButton.textContent = '게임 규칙 닫기';
        } else {
            gameInfo.style.display = 'none';
            rulesButton.textContent = '게임 규칙 보기';
        }
    }

    // 게임 메시지 표시
    function showMessage(message) {
        const msgBox = document.createElement('div');
        msgBox.className = 'message-box';
        msgBox.textContent = message;
        document.body.appendChild(msgBox);
        setTimeout(() => {
            msgBox.classList.add('fade-out');
            setTimeout(() => msgBox.remove(), 500);
        }, 2000);
    }

    // 선택 및 방향/하이라이트 표시 제거
    function clearSelectionAndDirections() {
        document.querySelectorAll('.direction, .highlight').forEach(el => el.remove());
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        selectedCell = null;
        isCapturePlacing = false;
    }

    // 턴 전환 및 UI 업데이트
    function switchTurn() {
        // 왕이 상대 진영에서 살아남았는지 확인
        checkWangSurvival();
        
        currentPlayer = currentPlayer === '1' ? '2' : '1';
        turnDisplay.textContent = `현재 턴: 플레이어 ${currentPlayer} (${currentPlayer === '1' ? '파란색' : '빨간색'})`;
        turnDisplay.classList.toggle('turn-player1', currentPlayer === '1');
        turnDisplay.classList.toggle('turn-player2', currentPlayer === '2');
        clearSelectionAndDirections();

        // 왕 생존 플래그 초기화
        wangSurvived = { '1': false, '2': false };
    }

    // 왕이 상대 진영에서 살아남았는지 확인
    function checkWangSurvival() {
        // const opponent = currentPlayer === '1' ? '2' : '1';
        
        if (wangInEnemyTerritory[currentPlayer]) {
            showWin(currentPlayer, "상대 진영에 왕(王)이 침입하여 한 턴을 버텼습니다!");
            board.style.pointerEvents = 'none';
        }
    }

    // 말 표시 텍스트
    function getPieceDisplay(piece) {
        return { 
            'wang': '왕(王)', 
            'jang': '장(將)', 
            'sang': '상(相)', 
            'ja': '자(子)',
            'hu': '후(侯)'
        }[piece] || '';
    }

    // 이동 방향 정의
    function getMoves(piece, player) {
        if (piece === 'wang') return ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];
        if (piece === 'jang') return ['up', 'down', 'left', 'right'];
        if (piece === 'sang') return ['up-left', 'up-right', 'down-left', 'down-right'];
        if (piece === 'ja') {
            return player === '1' ? ['down'] : ['up']; // 자(子)는 앞으로만 이동 가능
        }
        if (piece === 'hu') {
            // 후(侯)는 대각선 뒤쪽 방향을 제외한 모든 방향으로 이동 가능
            return player === '1' 
                ? ['down', 'left', 'right', 'down-left', 'down-right', 'up'] 
                : ['up', 'left', 'right', 'up-left', 'up-right', 'down'];
        }
        return [];
    }

    // 방향 → 좌표 변환
    function getCellInDirection(row, col, direction) {
        const dirMap = {
            'up': [-1, 0], 'down': [1, 0], 'left': [0, -1], 'right': [0, 1],
            'up-left': [-1, -1], 'up-right': [-1, 1], 'down-left': [1, -1], 'down-right': [1, 1]
        };
        if (!dirMap[direction]) return null;
        const [dRow, dCol] = dirMap[direction];
        const targetRow = row + dRow;
        const targetCol = col + dCol;
        if (targetRow < 0 || targetRow >= board.rows.length ||
            targetCol < 0 || targetCol >= board.rows[0].cells.length) return null;
        return board.rows[targetRow].cells[targetCol];
    }

    // 이동 가능성 판단
    function isPossibleMove(fromCell, toCell) {
        const piece = fromCell.dataset.piece;
        const player = fromCell.dataset.player;
        const fromRow = fromCell.parentNode.rowIndex;
        const fromCol = fromCell.cellIndex;
        const toRow = toCell.parentNode.rowIndex;
        const toCol = toCell.cellIndex;
        if (Math.abs(toRow - fromRow) > 1 || Math.abs(toCol - fromCol) > 1) return false;
        let direction = '';
        if (toRow < fromRow) direction += 'up';
        else if (toRow > fromRow) direction += 'down';
        if (toCol < fromCol) direction += (direction ? '-' : '') + 'left';
        else if (toCol > fromCol) direction += (direction ? '-' : '') + 'right';
        return getMoves(piece, player).includes(direction);
    }

    // 이동 방향 표시
    function showPossibleMoves(cell) {
        const piece = cell.dataset.piece;
        const player = cell.dataset.player;
        const row = cell.parentNode.rowIndex;
        const col = cell.cellIndex;
        getMoves(piece, player).forEach(direction => {
            const target = getCellInDirection(row, col, direction);
            if (target && target.dataset.player !== player) {
                const dirEl = document.createElement('div');
                dirEl.className = `direction ${direction}`;
                cell.appendChild(dirEl);
            }
        });
    }

    // 보드 클릭 처리
    function handleBoardClick(e) {
        const cell = e.target.closest('td');
        if (!cell) return;

        // 잡은 말 배치
        if (isCapturePlacing && selectedCell) {
            if (!cell.dataset.piece && isValidPlacementCell(cell)) {
                placeCapturedPiece(cell);
            } else {
                showMessage("이 위치에는 말을 배치할 수 없습니다. 상대 진영이 아닌 빈 칸에만 배치 가능합니다.");
            }
            return;
        }

        // 기물 선택 후 이동/잡기
        if (selectedCell && selectedCell !== cell && !isCapturePlacing) {
            if (!cell.dataset.piece && isPossibleMove(selectedCell, cell)) {
                movePiece(selectedCell, cell);
                return;
            }
            if (cell.dataset.player && cell.dataset.player !== currentPlayer && isPossibleMove(selectedCell, cell)) {
                capturePiece(selectedCell, cell);
                return;
            }
        }

        clearSelectionAndDirections();

        // 내 말 선택
        if (cell.dataset.piece && cell.dataset.player === currentPlayer) {
            cell.classList.add('selected');
            selectedCell = cell;
            isCapturePlacing = false;
            selectedCapturedPieceIndex = -1;
            showPossibleMoves(cell);
        }
    }

    // 잡은 말 클릭 이벤트 바인딩
    function addCapturedPieceListeners() {
        document.querySelectorAll('.captured-piece-cell').forEach(cell => {
            cell.onclick = e => {
                e.stopPropagation();
                if (cell.dataset.piece && cell.dataset.player === currentPlayer) {
                    clearSelectionAndDirections();
                    const parentTable = cell.closest('table');
                    const idx = Array.from(parentTable.querySelectorAll('.captured-piece-cell')).indexOf(cell);
                    selectedCell = cell;
                    selectedCapturedPieceIndex = idx;
                    isCapturePlacing = true;
                    cell.classList.add('selected');
                    highlightValidPlacementCells();
                    showMessage("말을 놓을 위치를 선택하세요 (상대 진영을 제외한 빈 칸)");
                }
            }
        });
    }

    // 진영 확인 함수
    function isEnemyTerritory(row, player) {
        if (player === '1') {
            return row >= 3; // 플레이어 1에게 3행과 4행은 상대 진영
        } else {
            return row < 1; // 플레이어 2에게 0행은 상대 진영
        }
    }

    // 잡은 말 배치 가능 위치
    function isValidPlacementCell(cell) {
        const row = cell.parentNode.rowIndex;
        // 상대 진영이 아닌 빈 칸에만 배치 가능
        return !isEnemyTerritory(row, currentPlayer);
    }

    // 배치 가능한 위치 하이라이트
    function highlightValidPlacementCells() {
        for (let rowIdx = 0; rowIdx < board.rows.length; rowIdx++) {
            // 상대 진영을 제외한 빈 칸 하이라이트
            if (!isEnemyTerritory(rowIdx, currentPlayer)) {
                Array.from(board.rows[rowIdx].cells).forEach(cell => {
                    if (!cell.dataset.piece) {
                        const highlight = document.createElement('div');
                        highlight.className = 'highlight';
                        cell.appendChild(highlight);
                    }
                });
            }
        }
    }

    // 잡은 말 내려놓기
    function placeCapturedPiece(toCell) {
        if (selectedCapturedPieceIndex < 0 || selectedCapturedPieceIndex >= capturedPieces[currentPlayer].length) {
            showMessage("선택된 말이 없습니다.");
            return;
        }
        const piece = capturedPieces[currentPlayer][selectedCapturedPieceIndex];
        
        // 후(侯)를 잡았다면 자(子)로 변경
        let pieceType = piece.piece;
        if (pieceType === 'hu') {
            pieceType = 'ja';
        }
        
        toCell.dataset.piece = pieceType;
        toCell.dataset.player = currentPlayer;
        toCell.textContent = getPieceDisplay(pieceType);
        capturedPieces[currentPlayer].splice(selectedCapturedPieceIndex, 1);
        updateCapturedPiecesDisplay();
        const placementEffect = document.createElement('div');
        placementEffect.className = 'placement-effect';
        toCell.appendChild(placementEffect);
        setTimeout(() => placementEffect.remove(), 800);
        clearSelectionAndDirections();
        switchTurn();
    }

    // 말 이동
    function movePiece(fromCell, toCell) {
        const piece = fromCell.dataset.piece;
        const player = fromCell.dataset.player;
        
        // 말 이동
        toCell.dataset.piece = piece;
        toCell.dataset.player = player;
        toCell.textContent = getPieceDisplay(piece);
        fromCell.removeAttribute('data-piece');
        fromCell.removeAttribute('data-player');
        fromCell.textContent = '';
        
        // 왕이 상대 진영에 들어갔는지 확인
        checkWangInEnemyTerritory(toCell);
        
        // 자(子)가 상대 진영에 들어갔는지 확인 (승진)
        checkPromotion(toCell);
        
        switchTurn();
    }

    // 왕이 상대 진영에 들어갔는지 확인
    function checkWangInEnemyTerritory(cell) {
        const piece = cell.dataset.piece;
        const player = cell.dataset.player;
        const row = cell.parentNode.rowIndex;
        
        if (piece === 'wang') {
            // 왕이 상대 진영에 들어갔는지 확인
            if (isEnemyTerritory(row, player)) {
                wangInEnemyTerritory[player] = true;
                showMessage(`플레이어 ${player}의 왕(王)이 상대 진영에 들어갔습니다! 한 턴 버티면 승리합니다!`);
            } else {
                wangInEnemyTerritory[player] = false;
            }
        }
    }

    // 승진 체크
    function checkPromotion(cell) {
        const piece = cell.dataset.piece;
        const player = cell.dataset.player;
        const row = cell.parentNode.rowIndex;
        
        // 자(子)가 상대 진영에 들어가면 후(侯)로 승진
        if (piece === 'ja' && isEnemyTerritory(row, player)) {
            cell.dataset.piece = 'hu';
            cell.textContent = getPieceDisplay('hu');
            const effect = document.createElement('div');
            effect.className = 'promotion-effect';
            cell.appendChild(effect);
            setTimeout(() => effect.remove(), 1000);
            showMessage("자(子)가 후(侯)로 승진했습니다!");
        }
    }

    // 말 잡기
    function capturePiece(fromCell, toCell) {
        const capturedPiece = toCell.dataset.piece;
        const capturedPlayer = toCell.dataset.player;
        const attackingPlayer = fromCell.dataset.player;
        
        // 왕을 잡으면 승리
        if (capturedPiece === 'wang') {
            showWin(attackingPlayer, "상대방의 왕(王)을 잡았습니다!");
            board.style.pointerEvents = 'none';
            return;
        }
        
        // 잡은 말 저장
        capturedPieces[attackingPlayer].push({
            piece: capturedPiece,
            originalPlayer: capturedPlayer
        });
        
        updateCapturedPiecesDisplay();
        movePiece(fromCell, toCell);
    }

    // 잡은 말 영역 업데이트
    function updateCapturedPiecesDisplay() {
        function updateCells(cells, pieces, player) {
            cells.forEach((cell, i) => {
                cell.textContent = '';
                cell.removeAttribute('data-piece');
                cell.removeAttribute('data-player');
                cell.classList.remove('selected');
                if (i < pieces.length) {
                    cell.textContent = getPieceDisplay(pieces[i].piece);
                    cell.dataset.piece = pieces[i].piece;
                    cell.dataset.player = player;
                }
            });
        }
        updateCells(capturedPiecesP1.querySelectorAll('td'), capturedPieces['1'], '1');
        updateCells(capturedPiecesP2.querySelectorAll('td'), capturedPieces['2'], '2');
        addCapturedPieceListeners();
    }

    // 승리 메시지
    function showWin(winner, reason) {
        const winMsg = document.createElement('div');
        winMsg.className = 'win-message';
        winMsg.innerHTML = `
            <h2>플레이어 ${winner}의 승리!</h2>
            <p>${reason || (winner === '1' ? '파란색' : '빨간색') + ' 플레이어가 승리했습니다!'}</p>
            <button id="restart-button">새 게임 시작</button>
        `;
        document.body.appendChild(winMsg);
        document.getElementById('restart-button').onclick = function() {
            winMsg.remove();
            resetGame();
        };
    }

    // 게임 리셋
    function resetGame() {
        location.reload();
    }
});