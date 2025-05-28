 // script.js
    document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    const capturedPiecesP1 = document.getElementById('captured-p1');
    const capturedPiecesP2 = document.getElementById('captured-p2');
    const turnDisplay = document.createElement('div');
    const gameInfo = document.createElement('div');

    // 턴 표시 및 게임 정보 추가
    turnDisplay.className = 'turn-display turn-player1';
    turnDisplay.textContent = '현재 턴: 플레이어 1 (파란색)';

    gameInfo.className = 'game-info';
    gameInfo.innerHTML = `
    <h3>십이장기 게임 방법</h3>
    <p>1. 말은 규칙에 따라 한 칸씩 이동할 수 있습니다.</p>
    <p>2. 상대방의 말을 잡을 수 있습니다.</p>
    <p>3. 잡은 말은 턴을 소모하여 중앙 6칸에 배치할 수 있습니다.</p>
    <p>4. 자(子)가 상대 진영 끝에 도달하면 상(相)으로 승진합니다.</p>
    <p>5. 왕(王)을 잡으면 승리합니다!</p>
    <h4>잡은 말 내려놓기 (재활용)</h4>
    <p>- 자신의 턴에, 이미 잡은 상대방의 기물 중 하나를 게임판의 빈칸에 내려놓을 수 있습니다.</p>
    <p>- 내려놓을 수 있는 위치는 게임판 중앙의 6칸 (1행과 2행의 모든 칸)으로 제한됩니다.</p>
    <p>- 기물을 내려놓는 것은 턴을 소모하는 행동입니다.</p>
    <p>- 내려놓은 기물은 자신의 기물이 됩니다.</p>
`;

    document.body.insertBefore(turnDisplay, document.querySelector('.game-board'));

    let selectedCell = null;
    let currentPlayer = '1';
    let capturedPieces = {
    '1': [],
    '2': []
};
    let isCapturePlacing = false;
    let selectedCapturedPieceIndex = -1;

    // 보드 클릭 이벤트
    board.addEventListener('click', function(e) {
    const cell = e.target.closest('td');
    if (!cell) return;

    // 잡은 말을 놓는 중인 경우
    if (isCapturePlacing && selectedCell) {
    if (!cell.dataset.piece && isValidPlacementCell(cell)) {
    placeCapturedPiece(cell);
    return;
} else {
    showMessage("이 위치에는 말을 배치할 수 없습니다. 중앙 6칸에만 배치 가능합니다.");
    return;
}
}

    // 이미 선택된 말이 있고, 다른 셀을 클릭한 경우
    if (selectedCell && selectedCell !== cell && !isCapturePlacing) {
    // 빈 셀을 클릭한 경우 - 이동
    if (!cell.dataset.piece && isPossibleMove(selectedCell, cell)) {
    movePiece(selectedCell, cell);
    return;
}

    // 상대방 말을 클릭한 경우 - 잡기
    if (cell.dataset.player && cell.dataset.player !== currentPlayer && isPossibleMove(selectedCell, cell)) {
    capturePiece(selectedCell, cell);
    return;
}
}

    // 선택 취소 및 방향 표시 제거
    clearSelectionAndDirections();

    // 자신의 말 선택
    if (cell.dataset.piece && cell.dataset.player === currentPlayer) {
    cell.classList.add('selected');
    selectedCell = cell;
    isCapturePlacing = false;
    selectedCapturedPieceIndex = -1;
    showPossibleMoves(cell);
}
});

    // 잡은 말 영역 클릭 이벤트
    function addCapturedPieceListeners() {
    const allCapturedCells = document.querySelectorAll('.captured-piece-cell');
    allCapturedCells.forEach(cell => {
    cell.addEventListener('click', function(e) {
    e.stopPropagation();

    // 말이 있고 현재 플레이어의 소유인 경우에만 선택 가능
    if (cell.dataset.piece && cell.dataset.player === currentPlayer) {
    clearSelectionAndDirections();

    // 선택된 잡은 말의 인덱스 찾기
    const parentTable = cell.closest('table');
    const cellIndex = Array.from(parentTable.querySelectorAll('.captured-piece-cell')).indexOf(cell);

    selectedCell = cell;
    selectedCapturedPieceIndex = cellIndex;
    isCapturePlacing = true;

    cell.classList.add('selected');
    highlightValidPlacementCells();
    showMessage("말을 놓을 위치를 선택하세요 (중앙 6칸)");
}
});
});
}

    // 초기 이벤트 리스너 추가
    addCapturedPieceListeners();

    // 잡은 말을 보드에 놓을 수 있는 위치인지 확인
    function isValidPlacementCell(cell) {
    const row = cell.parentNode.rowIndex;
    return row === 1 || row === 2;
}

    // 메시지 표시
    function showMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
    messageBox.classList.add('fade-out');
    setTimeout(() => {
    messageBox.remove();
}, 500);
}, 2000);
}

    // 가능한 이동 방향 표시
    function showPossibleMoves(cell) {
    const piece = cell.dataset.piece;
    const player = cell.dataset.player;
    const row = cell.parentNode.rowIndex;
    const col = cell.cellIndex;

    const moves = {
    'wang': ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
    'jang': ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
    'sang': ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
    'ja': player === '1' ? ['down', 'down-left', 'down-right'] : ['up', 'up-left', 'up-right']
};

    if (moves[piece]) {
    moves[piece].forEach(direction => {
    const targetCell = getCellInDirection(row, col, direction);
    if (targetCell) {
    if (targetCell.dataset.player === player) return;

    const directionElement = document.createElement('div');
    directionElement.className = `direction ${direction}`;
    cell.appendChild(directionElement);
}
});
}
}

    // 방향과 위치를 기반으로 셀 가져오기
    function getCellInDirection(row, col, direction) {
    let targetRow = row;
    let targetCol = col;

    switch(direction) {
    case 'up': targetRow--; break;
    case 'down': targetRow++; break;
    case 'left': targetCol--; break;
    case 'right': targetCol++; break;
    case 'up-left': targetRow--; targetCol--; break;
    case 'up-right': targetRow--; targetCol++; break;
    case 'down-left': targetRow++; targetCol--; break;
    case 'down-right': targetRow++; targetCol++; break;
}

    if (targetRow < 0 || targetRow >= board.rows.length ||
    targetCol < 0 || targetCol >= board.rows[0].cells.length) {
    return null;
}

    return board.rows[targetRow].cells[targetCol];
}

    // 이동 가능한지 확인
    function isPossibleMove(fromCell, toCell) {
    const piece = fromCell.dataset.piece;
    const player = fromCell.dataset.player;
    const fromRow = fromCell.parentNode.rowIndex;
    const fromCol = fromCell.cellIndex;
    const toRow = toCell.parentNode.rowIndex;
    const toCol = toCell.cellIndex;

    let direction = '';
    if (toRow < fromRow) direction += 'up';
    else if (toRow > fromRow) direction += 'down';

    if (toCol < fromCol) direction += direction ? '-left' : 'left';
    else if (toCol > fromCol) direction += direction ? '-right' : 'right';

    const allowedMoves = {
    'wang': ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
    'jang': ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
    'sang': ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
    'ja': player === '1' ? ['down', 'down-left', 'down-right'] : ['up', 'up-left', 'up-right']
};

    if (Math.abs(toRow - fromRow) > 1 || Math.abs(toCol - fromCol) > 1) {
    return false;
}

    return allowedMoves[piece].includes(direction);
}

    // 말 이동
    function movePiece(fromCell, toCell) {
    const piece = fromCell.dataset.piece;
    const player = fromCell.dataset.player;

    toCell.dataset.piece = piece;
    toCell.dataset.player = player;
    toCell.textContent = getPieceDisplay(piece);

    fromCell.removeAttribute('data-piece');
    fromCell.removeAttribute('data-player');
    fromCell.textContent = '';

    checkPromotion(toCell);
    switchTurn();
}

    // 승진 확인
    function checkPromotion(cell) {
    const piece = cell.dataset.piece;
    const player = cell.dataset.player;
    const row = cell.parentNode.rowIndex;

    if (piece === 'ja') {
    if ((player === '1' && row === 3) || (player === '2' && row === 0)) {
    cell.dataset.piece = 'sang';
    cell.textContent = '상(相)';

    const promotionEffect = document.createElement('div');
    promotionEffect.className = 'promotion-effect';
    cell.appendChild(promotionEffect);

    setTimeout(() => {
    promotionEffect.remove();
}, 1000);

    showMessage("자(子)가 상(相)으로 승진했습니다!");
}
}
}

    // 말 잡기
    function capturePiece(fromCell, toCell) {
    const capturedPiece = toCell.dataset.piece;
    const capturedPlayer = toCell.dataset.player;
    const attackingPlayer = fromCell.dataset.player;

    if (capturedPiece === 'wang') {
    const winMessage = document.createElement('div');
    winMessage.className = 'win-message';
    winMessage.innerHTML = `
                <h2>플레이어 ${attackingPlayer}의 승리!</h2>
                <p>${attackingPlayer === '1' ? '파란색' : '빨간색'} 플레이어가 상대방의 왕을 잡았습니다!</p>
                <button id="restart-button">새 게임 시작</button>
            `;
    document.body.appendChild(winMessage);

    document.getElementById('restart-button').addEventListener('click', () => {
    winMessage.remove();
    resetGame();
});

    board.style.pointerEvents = 'none';
    return;
}

    // 잡은 말 목록에 추가 (소유권이 바뀜)
    capturedPieces[attackingPlayer].push({
    piece: capturedPiece,
    originalPlayer: capturedPlayer
});

    updateCapturedPiecesDisplay();
    movePiece(fromCell, toCell);
}

    // 잡은 말 영역 업데이트
    function updateCapturedPiecesDisplay() {
    // 플레이어 1이 잡은 말
    const cellsP1 = capturedPiecesP1.querySelectorAll('td');
    cellsP1.forEach(cell => {
    cell.textContent = '';
    cell.removeAttribute('data-piece');
    cell.removeAttribute('data-player');
    cell.classList.remove('selected');
});

    capturedPieces['1'].forEach((piece, index) => {
    if (index < cellsP1.length) {
    const cell = cellsP1[index];
    cell.textContent = getPieceDisplay(piece.piece);
    cell.dataset.piece = piece.piece;
    cell.dataset.player = '1';
}
});

    // 플레이어 2가 잡은 말
    const cellsP2 = capturedPiecesP2.querySelectorAll('td');
    cellsP2.forEach(cell => {
    cell.textContent = '';
    cell.removeAttribute('data-piece');
    cell.removeAttribute('data-player');
    cell.classList.remove('selected');
});

    capturedPieces['2'].forEach((piece, index) => {
    if (index < cellsP2.length) {
    const cell = cellsP2[index];
    cell.textContent = getPieceDisplay(piece.piece);
    cell.dataset.piece = piece.piece;
    cell.dataset.player = '2';
}
});

    // 이벤트 리스너 재설정
    addCapturedPieceListeners();
}

    // 중앙 6칸 강조 표시
    function highlightValidPlacementCells() {
    const rows = board.rows;
    for (let i = 1; i <= 2; i++) {
    for (let j = 0; j < rows[i].cells.length; j++) {
    const cell = rows[i].cells[j];
    if (!cell.dataset.piece) {
    const highlight = document.createElement('div');
    highlight.className = 'highlight';
    cell.appendChild(highlight);
}
}
}
}

    // 잡은 말 배치
    function placeCapturedPiece(toCell) {
    if (selectedCapturedPieceIndex < 0 || selectedCapturedPieceIndex >= capturedPieces[currentPlayer].length) {
    showMessage("선택된 말이 없습니다.");
    return;
}

    const piece = capturedPieces[currentPlayer][selectedCapturedPieceIndex];

    // 보드에 말 놓기
    toCell.dataset.piece = piece.piece;
    toCell.dataset.player = currentPlayer;
    toCell.textContent = getPieceDisplay(piece.piece);

    // 잡은 말 목록에서 제거
    capturedPieces[currentPlayer].splice(selectedCapturedPieceIndex, 1);

    updateCapturedPiecesDisplay();

    // 배치 효과 표시
    const placementEffect = document.createElement('div');
    placementEffect.className = 'placement-effect';
    toCell.appendChild(placementEffect);

    setTimeout(() => {
    placementEffect.remove();
}, 800);
        
        // 스타일 초기화 및 턴 전환
        clearSelectionAndDirections();
        switchTurn();
    }
    
    // 선택 및 방향 표시기 제거
    function clearSelectionAndDirections() {
        const directions = document.querySelectorAll('.direction');
        directions.forEach(dir => dir.remove());
        
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(h => h.remove());
        
        if (selectedCell) {
            selectedCell.classList.remove('selected');
            selectedCell = null;
        }
        
        isCapturePlacing = false;
    }
    
    // 턴 전환
    function switchTurn() {
        currentPlayer = currentPlayer === '1' ? '2' : '1';
        
        // 턴 표시 업데이트
        turnDisplay.textContent = `현재 턴: 플레이어 ${currentPlayer} (${currentPlayer === '1' ? '파란색' : '빨간색'})`;
        
        // 클래스 전환
        if (currentPlayer === '1') {
            turnDisplay.classList.remove('turn-player2');
            turnDisplay.classList.add('turn-player1');
        } else {
            turnDisplay.classList.remove('turn-player1');
            turnDisplay.classList.add('turn-player2');
        }
        
        clearSelectionAndDirections();
    }
    
    // 말 표시 텍스트 가져오기
    function getPieceDisplay(piece) {
        const displays = {
            'wang': '왕(王)',
            'jang': '장(將)',
            'sang': '상(相)',
            'ja': '자(子)'
        };
        return displays[piece] || '';
    }
    
    // 게임 초기화
    function resetGame() {
        location.reload();
    }
    
    // 게임 시작 버튼 추가
    const startButton = document.createElement('button');
    startButton.textContent = '게임 다시 시작';
    startButton.className = 'game-button';
    startButton.addEventListener('click', resetGame);
    document.body.appendChild(startButton);
    
    // 게임 정보 추가
    document.body.appendChild(gameInfo);
    
    // 게임 규칙 버튼 추가
    const rulesButton = document.createElement('button');
    rulesButton.textContent = '게임 규칙 보기';
    rulesButton.className = 'game-button rules-button';
    rulesButton.addEventListener('click', () => {
        if (gameInfo.style.display === 'none') {
            gameInfo.style.display = 'block';
            rulesButton.textContent = '게임 규칙 닫기';
        } else {
            gameInfo.style.display = 'none';
            rulesButton.textContent = '게임 규칙 보기';
        }
    });
    document.body.insertBefore(rulesButton, startButton);
    
    // 초기에는 게임 정보 숨기기
    gameInfo.style.display = 'none';
});