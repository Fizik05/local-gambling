console.log("WORKING!!!")

document.addEventListener('DOMContentLoaded', function() {
    const cellButtons = document.querySelectorAll('[id^="cellButton"]');
    
    cellButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            if (!window.gameState.isGameActive) {
                return;
            }

            if (button.classList.contains('opened')) {
                return; // Уже открыта
            }
            
            button.classList.add('opened');
            
            if (window.gameState.gameField[index]) {
                // Попали на ловушку - игра окончена
                button.innerHTML = '<img width="60" height="60" src="./../images/cross.svg">';

                // Показываем сообщение о проигрыше
                if (window.showGameStateMessage) {
                    window.showGameStateMessage(false, 3000);
                }
                
                // Показываем все ловушки
                revealAllTraps();
                
                // Заканчиваем игру (поражение)
                setTimeout(() => {
                    if (window.endGame) {
                        window.endGame(false);
                    }
                    
                    // Сбрасываем поле
                    resetGameField();
                }, 3000);
                
            } else {
                // Безопасная ячейка
                button.innerHTML = '<img width="60" height="60" src="./../images/star.svg">';
                window.gameState.openedCells++
                
                // Обновляем сумму выигрыша
                if (window.updateWinAmount) {
                    window.updateWinAmount();
                }
                
                // Проверяем, не выиграна ли игра (открыты все безопасные ячейки)
                checkWinCondition();
            }
        });
    });
});

// Функция показа всех ячеек при завершении
function revealAllTraps() {
    const cellButtons = document.querySelectorAll('[id^="cellButton"]');
    
    cellButtons.forEach((button, index) => {
        if (!button.classList.contains('opened')) {
            button.classList.add('opened');

            if (window.gameState.gameField[index]) {
                button.innerHTML = '<img width="60" height="60" src="./../images/cross.svg">';
            } else {
                button.innerHTML = '<img width="60" height="60" src="./../images/star.svg">';
            }
        }
    });
}

// Функция проверки условия победы
function checkWinCondition() {
    const totalCells = 25;
    const safeOcellsCount = totalCells - window.gameState.trapCount;
    
    if (window.gameState.openedCells >= safeOcellsCount) {
        // Игра выиграна!

        // Вычисляем множитель для popup
        curMults = window.stepMultipliers[window.gameState.trapCount]
        curMult = curMults[curMults.length-1]
        window.gameState.currentWin = curMult * window.gameState.currentBet
        
        // Показываем popup выигрыша
        if (window.showWinPopup) {
            window.showWinPopup(window.gameState.currentWin, curMult);
        }

        revealAllTraps();
        
        setTimeout(() => {
            if (window.endGame) {
                window.endGame(true);
            }
            
            // Сбрасываем поле
            resetGameField();
        }, 3000);
    }
}

// Функция сброса игрового поля
function resetGameField() {
    const cellButtons = document.querySelectorAll('[id^="cellButton"]');
    
    cellButtons.forEach(button => {
        button.classList.remove('opened');
        button.innerHTML = '<img width="56" height="56" src="./../images/square.svg">';
        // button.innerHTML = '';
        // button.style.opacity = '';
    });
}

function generateField() {
    uniqIndexes = new Set();

    window.gameState.gameField = new Array(25).fill(0);
    window.gameState.openedCells = 0; // Сбрасываем счетчик открытых ячеек

    i = 0;
    while (i < window.gameState.trapCount) {
        randomInd = Math.floor(Math.random() * 25);

        if (uniqIndexes.has(randomInd + 1)) {
            continue;
        }

        window.gameState.gameField[randomInd] = 1;
        uniqIndexes.add(randomInd + 1);
        i++;
    }

    // Печатает координаты мин
    console.log("Mines coordinates: ", uniqIndexes);
}
