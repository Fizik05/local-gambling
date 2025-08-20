document.addEventListener('DOMContentLoaded', function() {

    window.top.addEventListener('localStorageChanged', function(event) {
        if (event.detail.key === 'balance') {
            updateBalanceDisplay(event.detail.newValue);
        }
    });


    // function loopBalance() {
    //     oldBalance = window.parent.GeneralBalance;
    //     function checkBalance() {
    //         console.log("start loop")
    //         currentBalance = parseFloat(localStorage.getItem('balance') || '0')
    //         console.log(currentBalance)

    //         if (currentBalance != oldBalance) {
    //             updateBalanceDisplay(currentBalance);
    //             window.parent.GeneralBalance = currentBalance;
    //             oldBalance = currentBalance;
    //         }
    //     }

    //     setTimeout(checkBalance, 100);
    // }

    // Глобальные переменные игры
    window.gameState = {
        balance: window.parent.GeneralBalance, // Начальный баланс
        currentBet: 50, // Текущая ставка
        trapCount: 3, // Текущее количество ловушек
        isGameActive: false,
        gameField: new Array(25).fill(0),
        currentWinAmount: 0, // Текущая сумма выигрыша (немного не та переменная, она должна называться nextWinAmount) !!!!!!!!!
        openedCells: 0, // Количество открытых безопасных ячеек
        originalStatusBarHTML: '', // Сохраняем оригинальную структуру
        currentWin: 0, // А вот это РЕАЛЬНО ТЕКУЩАЯ сумма выйгрыша
        currentGame: 1,
    };
    
    // Коэффициенты выигрыша для разного количества ловушек
    const winMultipliers = {
        1: 23.88,
        3: 2196.5,
        5: 4000,
        7: 5000
    };
    
    // Множители для каждого шага (пока одинаковые для всех количеств ловушек)
    window.stepMultipliers = {
        1: [0.99, 1.04, 1.09, 1.14, 1.19, 1.26, 1.33, 1.4, 1.49, 1.59, 1.71, 1.84, 1.99, 2.17, 2.39, 2.65, 2.98, 3.41, 3.98, 4.78, 5.97, 7.96, 11.94, 23.88],
        3: [1.09, 1.24, 1.43, 1.65, 1.93, 2.27, 2.69, 3.23, 3.92, 4.83, 6.03, 7.68, 9.98, 13.31, 18.3, 26.15, 39.22, 62.76, 109.83, 219.65, 549.13, 2196.5],
        5: [1.19, 1.51, 1.93, 2.49, 3.27, 4.36, 5.92, 8.2, 11.62, 16.9, 25.34, 39.42, 64.06, 109.83, 201.35, 402.69, 906.06, 1937.37, 2968.69, 4000],
        7: [1.32, 1.86, 2.68, 3.93, 5.89, 9.11, 14.43, 23.6, 40.13, 71.34, 133.76, 267.52, 579.63, 1463.71, 2347.78, 3231.85, 4115.93, 5000],
    }
    
    // Находим элементы
    let decreaseBetBtn = document.getElementById('decrease_bet_btn');
    let increaseBetBtn = document.getElementById('increase_bet_btn');
    let amountField = document.getElementById('amount_field');
    let possibleMaxWinAmount = document.getElementById('possibleMaxWinAmount');
    const playBtn = document.getElementById('play_btn');
    const prevTrapsBtn = document.getElementById('prev_preset_btn');
    const nextTrapsBtn = document.getElementById('next_preset_btn');
    const statusBar = document.querySelector('.status-bar');
    
    // Сохраняем оригинальную структуру status-bar при загрузке
    if (statusBar) {
        window.gameState.originalStatusBarHTML = statusBar.innerHTML;
    }
    
    // Функция обновления максимального выигрыша
    function updateMaxWin() {
        const multiplier = winMultipliers[window.gameState.trapCount];
        const maxWin = window.gameState.currentBet * multiplier;
        possibleMaxWinAmount.textContent = maxWin.toLocaleString('ru-RU', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
    }
    
    // Функция обновления поля ввода
    function updateBetField() {

        amountField.value = window.gameState.currentBet;
        updateMaxWin();
        
        // Проверяем, можно ли уменьшить/увеличить ставку
        decreaseBetBtn.disabled = window.gameState.currentBet <= 1;
        increaseBetBtn.disabled = window.gameState.currentBet >= window.gameState.balance;
    }
    
    function init23handlers() {
        // Обработчик кнопки уменьшения ставки (деление на 2)
        decreaseBetBtn.addEventListener('click', function() {
            const newBet = Math.floor(window.gameState.currentBet / 2);
            if (newBet >= 5) {
                window.gameState.currentBet = newBet;
                updateBetField();
            }
        });
        
        // Обработчик кнопки увеличения ставки (умножение на 2)
        increaseBetBtn.addEventListener('click', function() {
            const newBet = window.gameState.currentBet * 2;
            if (newBet <= window.gameState.balance && newBet < 10000) {
                window.gameState.currentBet = newBet;
                updateBetField();
            }
        });
        
        // Обработчик прямого ввода в поле
        amountField.addEventListener('input', function() {
            let value = parseInt(this.value) || 1;
            // let value = parseInt(window.gameState.currentBet) || 1;
            
            // Ограничиваем значения
            if (value < 1) value = 5;
            if (value > window.gameState.balance) value = window.gameState.balance;
            
            window.gameState.currentBet = value;
            this.value = value;
            updateMaxWin();
        });
    }
    
    // Обработчик изменения количества ловушек (будет вызываться из селектора ловушек)
    window.updateTrapCount = function(newTrapCount) {
        window.gameState.trapCount = newTrapCount;
        updateMaxWin();
    };

    // Функция смены кнопки на "Забрать"
    function updatePlayButtonToCashout() {
        const playBtn = document.getElementById('play_btn');
        if (!playBtn) return;
        
        // Меняем классы
        playBtn.className = "app-button big games-orange-bg main-light-text cashout cursor-pointer block h-full w-full";
        playBtn.disabled = false;
        
        // Меняем содержимое кнопки
        playBtn.innerHTML = `
            <span>
                <div>
                    <div class="cashout-amount">
                        <span class="font-bold" id="prizeValue">${window.gameState.currentWin.toLocaleString('ru-RU', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}&nbsp;</span>
                        <span class="font-normal" id="prizeCurrency">₽</span>
                    </div>
                    <div>
                        <span>Забрать</span>
                    </div>
                </div>
            </span>
        `;
        
        // Удаляем старый обработчик и добавляем новый для "Забрать"
        playBtn.removeEventListener('click', startGameHandler);
        playBtn.addEventListener('click', cashoutHandler);
    }

    // Функция обновления суммы в кнопке "Забрать"
    function updateCashoutAmount() {
        const prizeValue = document.getElementById('prizeValue');
        if (prizeValue) {
            prizeValue.innerHTML = `${window.gameState.currentWin.toLocaleString('ru-RU', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })}&nbsp;`;
        }
    }

    // Функция показа сообщения о состоянии игры
    window.showGameStateMessage = function(isWin, duration = 3000) {
        // Находим панель состояния или создаем её
        let statePanel = document.querySelector('.input-state-panel');

        const oldStatePanel = statePanel.innerHTML;

        // Определяем классы и текст в зависимости от результата
        const resultClass = isWin ? 'win' : 'lose';
        const messageText = isWin ? 'Вы выиграли' : 'Попробуй снова';
        
        // Обновляем содержимое панели
        statePanel.innerHTML = `
            <div class="state win-lose w-full ${resultClass}" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                <div class="round-result-state-animate game-state-animate" id="loseMessage" style="display: flex; justify-content: center; align-items: center; width: 100%; text-align: center;">
                    ${messageText}
                </div>
            </div>
        `;
        
        // Показываем панель
        statePanel.style.display = 'block';
        
        // Скрываем через заданное время
        setTimeout(() => {
            if (statePanel) {
                // statePanel.style.display = 'none';
                statePanel.innerHTML = oldStatePanel;

                decreaseBetBtn = document.getElementById('decrease_bet_btn');
                increaseBetBtn = document.getElementById('increase_bet_btn');
                amountField = document.getElementById('amount_field');

                init23handlers();
                updateBetField();
            }
        }, duration);
    };

    // Функция показа popup выигрыша
    window.showWinPopup = function(winAmount, multiplier) {
        // Создаем контейнер для popup если его нет

        let popupContainer = document.querySelector('.Toastify__toast-container');
        if (!popupContainer) {
            popupContainer = document.createElement('div');
            popupContainer.className = 'Toastify__toast-container Toastify__toast-container--top-center app-popup';
            document.body.appendChild(popupContainer);
        }
        
        // Создаем уникальный ID для toast
        const toastId = Date.now().toString();
        
        // HTML для popup
        const popupHTML = `
           <div id="${toastId}" class="Toastify__toast Toastify__toast-theme--dark Toastify__toast--default Toastify__toast--close-on-click app-popup__toast win Toastify--animate Toastify__bounce-enter--top-center" style="--nth: 1;--len: 1; background: #151b2e; border-radius: 16px; box-shadow: 0 4px 24px #0a0f1e; min-height: 56px; padding: 0; max-height: 64px;">
                <div role="alert" class="Toastify__toast-body app-popup__toast-body" style="height: 100%; padding: 0; margin: 0; display: flex; align-items: center;">
                    <div class="app-popup__toast-body__win" style="align-items: center; display: flex; justify-content: space-between; padding: 4px; position: relative; width: 100%; min-height: 56px;">
                        <div class="left-side" style="font-family: 'FS Elliot Pro', sans-serif; padding: 0 20px; text-align: left;">
                            <div class="left-side__label" style="color: #97a3cb; font-size: 12px; font-weight: 400; line-height: 16px;">Ваш выигрыш</div>
                            <p class="left-side__lightgreen" style="color: #13f36c; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; line-height: 24px; margin: 0;">
                                ${winAmount.toLocaleString('ru-RU', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                })}&nbsp;
                                <span class="left-side__small-gray" style="color: rgba(255, 255, 255, 0.188); font-size: 10px; font-weight: 700;">₽</span>
                            </p>
                        </div>
                        <div class="right-side" style="align-items: center; background: rgba(42, 49, 69, 0.7); border-radius: 20px 12px 12px 20px; color: #fff; display: flex; flex-direction: column; font-family: 'Halvar Breit XBd', sans-serif; font-size: 18px; font-weight: 700; justify-content: center; line-height: 22px; padding: 16px; text-align: center; position: absolute; right: 0; top: 50%; transform: translateY(-50%); height: calc(100% - 8px);">x${multiplier}</div>
                        <div style="background: linear-gradient(180deg, #108de7, #0855c4); border-radius: 0 7px 7px 0; box-shadow: 0 2px 66px rgba(10, 98, 204, 0.5); content: ''; height: 30px; position: absolute; right: 0; top: 50%; transform: rotate(180deg) translateY(50%); width: 8px;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем popup в контейнер
        popupContainer.innerHTML = popupHTML;

        // Показываем сообщение о выигрыше
        showGameStateMessage(true, 3000);
        
        // Автоматически удаляем popup через 3 секунды
        setTimeout(() => {
            const popup = document.getElementById(toastId);
            if (popup) {
                popup.classList.add('Toastify__toast--close');
                setTimeout(() => {
                    popup.remove();
                }, 100); // Время анимации исчезновения
            }
        }, 5000);
        
        // Добавляем возможность закрытия по клику
        const popup = document.getElementById(toastId);
        if (popup) {
            popup.addEventListener('click', () => {
                popup.classList.add('Toastify__toast--close');
                setTimeout(() => {
                    popup.remove();
                }, 300);
            });
        }
    };

    // Обработчик для кнопки "Забрать"
    function cashoutHandler() {

        // Вычисляем множитель
        const multiplier = (window.gameState.currentWin / window.gameState.currentBet).toFixed(2);
        
        // Показываем popup выигрыша
        showWinPopup(window.gameState.currentWin, multiplier);

        revealAllTraps()
        
        // Заканчиваем игру как победу
        setTimeout(() => {
            if (window.endGame) {
                window.endGame(true);

                // Сбрасываем поле
                resetGameField();
            }
        }, 3000);
    }

    // Сохраняем оригинальный обработчик для кнопки "Играть"
    function startGameHandler() {
        if (window.gameState.currentBet > window.gameState.balance) {
            alert('Недостаточно средств!');
            return;
        }
        
        // Здесь будет логика начала игры
        startGame();
    }
    
    // Обработчик кнопки "Играть"
    playBtn.addEventListener('click', startGameHandler);

    // Функция начала игры
    function startGame() {
        window.gameState.isGameActive = true;
        window.gameState.openedCells = 0;
        const multiplier = window.stepMultipliers[window.gameState.trapCount][window.gameState.openedCells];
        window.gameState.currentWinAmount = window.gameState.currentBet * multiplier;
        
        // Вычитаем ставку из баланса
        window.gameState.balance = parseFloat(localStorage.getItem('balance'))

        window.gameState.balance -= window.gameState.currentBet;
        updateBalanceDisplay(window.gameState.balance);
        
        // Генерируем поле
        if (typeof generateField === 'function') {
            generateField();
        }

        // Обновляем status-bar для игры
        updateStatusBarForGame();
        
        // Блокируем изменение ставки во время игры
        decreaseBetBtn.disabled = true;
        increaseBetBtn.disabled = true;
        amountField.disabled = true;
        playBtn.textContent = 'Ожидание';
        playBtn.disabled = true;
        prevTrapsBtn.disabled = true;
        nextTrapsBtn.disabled = true;
        
        console.log(`Game started! Balance: ${window.gameState.balance}, Field generated`);
    }
    
    // Функция обновления выигрыша при успешном клике
    window.updateWinAmount = function() {
        if (window.gameState.openedCells < window.stepMultipliers[window.gameState.trapCount].length) {
            const multiplier = window.stepMultipliers[window.gameState.trapCount][window.gameState.openedCells];
            window.gameState.currentWinAmount = window.gameState.currentBet * multiplier;

            const prevMultiplier = window.stepMultipliers[window.gameState.trapCount][window.gameState.openedCells-1];
            window.gameState.currentWin = window.gameState.currentBet * prevMultiplier;
            
            // Обновляем отображение суммы
            const statusAmount = document.querySelector('.status-bar__status-text-amount');
            if (statusAmount) {
                statusAmount.textContent = window.gameState.currentWinAmount.toLocaleString('ru-RU', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                });
            }

            // Если это первая открытая ячейка, меняем кнопку на "Забрать"
            if (window.gameState.openedCells === 1) {
                updatePlayButtonToCashout();
            } else {
                // Обновляем сумму в кнопке "Забрать"
                updateCashoutAmount();
            }
            
            // Обновляем активный множитель
            shiftMultipliersLeft();
        }
    };

    // Функция сдвига множителей влево
    function shiftMultipliersLeft() {
        const multiplierItems = document.querySelectorAll('.multiplier-list__item-text');
        
        // Сбрасываем все стили
        multiplierItems.forEach(item => {
            item.classList.remove('multiplier-list__item-text_active');
        });
        
        // Сдвигаем текст множителей влево (удаляем первый)
        for (let i = 0; i < multiplierItems.length - 1; i++) {
            if (i < window.stepMultipliers[window.gameState.trapCount].length - window.gameState.openedCells) {
                // Берем следующий множитель из массива
                const nextMultiplierIndex = window.gameState.openedCells + i;
                multiplierItems[i].textContent = `X${window.stepMultipliers[window.gameState.trapCount][nextMultiplierIndex]}`;
            } else {
                // Очищаем остальные элементы
                multiplierItems[i].textContent = '';
            }
        }
        
        // Активным всегда остается первый элемент (индекс 0)
        if (multiplierItems[0] && multiplierItems[0].textContent) {
            multiplierItems[0].classList.add('multiplier-list__item-text_active');
        }
    }
    
    // Функция окончания игры (победа или поражение)
    window.endGame = function(isWin) {
        window.gameState.currentGame++;
        window.gameState.isGameActive = false;
        
        if (isWin) {
            // Добавляем выигрыш к балансу
            window.gameState.balance = parseFloat(localStorage.getItem('balance'))

            window.gameState.balance += window.gameState.currentWin;
            updateBalanceDisplay(window.gameState.balance);
        }
        
        // Восстанавливаем оригинальную структуру status-bar
        restoreOriginalStatusBar();

        // Восстанавливаем кнопку "Играть"
        restorePlayButton();
        
        // Разблокируем интерфейс
        decreaseBetBtn.disabled = window.gameState.currentBet <= 1;
        increaseBetBtn.disabled = window.gameState.currentBet >= window.gameState.balance;
        amountField.disabled = false;
        playBtn.textContent = 'Играть';
        playBtn.disabled = false;
        prevTrapsBtn.disabled = false;
        nextTrapsBtn.disabled = false;
        
        // Обновляем максимальный выигрыш
        possibleMaxWinAmount = document.getElementById('possibleMaxWinAmount');
        updateMaxWin();
    };

    // Функция восстановления кнопки "Играть"
    function restorePlayButton() {
        const playBtn = document.getElementById('play_btn');
        if (!playBtn) return;
        
        // Восстанавливаем классы и содержимое
        playBtn.className = "app-button big games-blue-bg text-white cursor-pointer block h-full w-full";
        playBtn.disabled = false;
        playBtn.textContent = "Играть";

        amountField.value = window.gameState.currentBet
        
        // Удаляем обработчик "Забрать" и возвращаем обработчик "Играть"
        playBtn.removeEventListener('click', cashoutHandler);
        playBtn.addEventListener('click', startGameHandler);
    }
    
    // Функция восстановления оригинальной структуры status-bar
    function restoreOriginalStatusBar() {
        if (statusBar && window.gameState.originalStatusBarHTML) {
            statusBar.innerHTML = window.gameState.originalStatusBarHTML;
            
            // Переназначаем обработчики событий для кнопок селектора ловушек
            const newPrevBtn = document.getElementById('prev_preset_btn');
            const newNextBtn = document.getElementById('next_preset_btn');
            
            if (newPrevBtn && newNextBtn && window.reinitializeTrapSelector) {
                window.reinitializeTrapSelector();
            }
        }
    }

    init23handlers();
    updateBetField();
    updateBalanceDisplay(window.gameState.balance);
    // loopBalance();
});

function updateStatusBarForGame() {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    
    // Создаем новую структуру для игрового режима
    const gameStatusHTML = `
        <style>
            .overflow-visible {
                overflow: visible !important;
            }
			.multiplier-list {
				--tw-border-opacity: 1;
				align-items: center;
				border-color: rgb(42 49 69 / var(--tw-border-opacity));
				border-left-width: 2px;
				-webkit-column-gap: .5rem;
				column-gap: .5rem;
				display: flex;
				flex: 0 1 auto;
				overflow: hidden;
				padding-left: .5rem;
				position: relative;
				width: 18rem;
			}
			.multiplier-list-inner {
				align-items: center;
				-webkit-column-gap: .5rem;
				column-gap: .5rem;
				display: flex;
				overflow: visible;
			}
			.multiplier-list__item {
				--tw-bg-opacity: 1;
				background-color: rgb(29 36 57 / var(--tw-bg-opacity));
				border-radius: .5rem;
				height: 32px;
				min-width: 55px;
				padding: .25rem .5rem;
				text-align: center;
			}
			.multiplier-list__item-text_active {
				opacity: 1 !important;
			}
			.multiplier-list__item-text {
				--tw-text-opacity: 1;
				color: rgb(255 255 255 / var(--tw-text-opacity));
				font-family: FS Elliot Pro, serif;
				font-size: .875rem;
				font-weight: 900;
				line-height: 1rem;
				opacity: .3;
				text-align: center;
			}
        </style>
        <div class="status-bar__status">
            <div class="status-bar__icon">
                <svg width="32" height="32" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.2752 2.2285C12.6529 1.48818 13.7108 1.48818 14.0885 2.2285L16.735 7.41481C16.8829 7.70466 17.1604 7.90633 17.4818 7.95743L23.2321 8.87169C24.0529 9.0022 24.3798 10.0082 23.7924 10.5963L19.6778 14.7159C19.4478 14.9461 19.3418 15.2724 19.3925 15.5938L20.2999 21.3452C20.4294 22.1662 19.5736 22.7879 18.8329 22.4111L13.6434 19.7708C13.3534 19.6232 13.0103 19.6232 12.7203 19.7708L7.53081 22.4111C6.79004 22.7879 5.93424 22.1662 6.06377 21.3452L6.97119 15.5938C7.0219 15.2724 6.91588 14.9461 6.68592 14.7159L2.57124 10.5963C1.98389 10.0082 2.31077 9.0022 3.1316 8.87169L8.88187 7.95743C9.20324 7.90633 9.48081 7.70466 9.62872 7.41481L12.2752 2.2285Z" fill="#C22A20"></path><path d="M12.2752 2.2285C12.6529 1.48818 13.7108 1.48818 14.0885 2.2285L16.735 7.41481C16.8829 7.70466 17.1604 7.90633 17.4818 7.95743L23.2321 8.87169C24.0529 9.0022 24.3798 10.0082 23.7924 10.5963L19.6778 14.7159C19.4478 14.9461 19.3418 15.2724 19.3925 15.5938L20.2999 21.3452C20.4294 22.1662 19.5736 22.7879 18.8329 22.4111L13.6434 19.7708C13.3534 19.6232 13.0103 19.6232 12.7203 19.7708L7.53081 22.4111C6.79004 22.7879 5.93424 22.1662 6.06377 21.3452L6.97119 15.5938C7.0219 15.2724 6.91588 14.9461 6.68592 14.7159L2.57124 10.5963C1.98389 10.0082 2.31077 9.0022 3.1316 8.87169L8.88187 7.95743C9.20324 7.90633 9.48081 7.70466 9.62872 7.41481L12.2752 2.2285Z" fill="url(#paint0_linear_448_8887status)"></path><path d="M12.2754 2.22809C12.6531 1.48777 13.711 1.48777 14.0887 2.22809L16.7352 7.4144C16.8831 7.70426 17.1607 7.90592 17.482 7.95702L23.2323 8.87128C24.0531 9.00179 24.38 10.0078 23.7927 10.5959L19.678 14.7155C19.448 14.9457 19.342 15.272 19.3927 15.5934L20.3001 21.3448C20.4297 22.1658 19.5739 22.7875 18.8331 22.4107L13.6436 19.7704C13.3536 19.6228 13.0105 19.6228 12.7205 19.7704L7.53102 22.4107C6.79025 22.7875 5.93445 22.1658 6.06398 21.3448L6.9714 15.5934C7.02211 15.272 6.91609 14.9457 6.68613 14.7155L2.57145 10.5959C1.9841 10.0078 2.31098 9.00179 3.13181 8.87128L8.88208 7.95702C9.20345 7.90592 9.48102 7.70426 9.62893 7.4144L12.2754 2.22809Z" fill="url(#paint1_linear_448_8887status)"></path><path d="M12.2754 2.22809C12.6531 1.48777 13.711 1.48777 14.0887 2.22809L16.7352 7.4144C16.8831 7.70426 17.1607 7.90592 17.482 7.95702L23.2323 8.87128C24.0531 9.00179 24.38 10.0078 23.7927 10.5959L19.678 14.7155C19.448 14.9457 19.342 15.272 19.3927 15.5934L20.3001 21.3448C20.4297 22.1658 19.5739 22.7875 18.8331 22.4107L13.6436 19.7704C13.3536 19.6228 13.0105 19.6228 12.7205 19.7704L7.53102 22.4107C6.79025 22.7875 5.93445 22.1658 6.06398 21.3448L6.9714 15.5934C7.02211 15.272 6.91609 14.9457 6.68613 14.7155L2.57145 10.5959C1.9841 10.0078 2.31098 9.00179 3.13181 8.87128L8.88208 7.95702C9.20345 7.90592 9.48102 7.70426 9.62893 7.4144L12.2754 2.22809Z" fill="url(#paint2_radial_448_8887status)"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M16.433 7.56862L13.7865 2.38231C13.5347 1.88876 12.8294 1.88876 12.5776 2.38231L9.93115 7.56862C9.73395 7.95509 9.36385 8.22398 8.93536 8.29211L3.18509 9.20637C2.63787 9.29338 2.41995 9.96407 2.81151 10.3561L6.92619 14.4757C7.23281 14.7827 7.37417 15.2177 7.30655 15.6463L6.39914 21.3977C6.31278 21.945 6.88331 22.3595 7.37716 22.1082L12.5666 19.468C12.9533 19.2712 13.4108 19.2712 13.7975 19.468L18.9869 22.1082C19.4808 22.3595 20.0513 21.945 19.965 21.3977L19.0576 15.6463C18.9899 15.2177 19.1313 14.7827 19.4379 14.4757L23.5526 10.3561C23.9442 9.96407 23.7262 9.29338 23.179 9.20637L17.4287 8.29211C17.0003 8.22398 16.6302 7.95509 16.433 7.56862ZM14.0887 2.22809C13.711 1.48777 12.6531 1.48777 12.2754 2.22809L9.62893 7.4144C9.48102 7.70426 9.20345 7.90592 8.88208 7.95702L3.13181 8.87128C2.31098 9.00179 1.9841 10.0078 2.57145 10.5959L6.68613 14.7155C6.91609 14.9457 7.02211 15.272 6.9714 15.5934L6.06398 21.3448C5.93445 22.1658 6.79025 22.7875 7.53102 22.4107L12.7205 19.7704C13.0105 19.6228 13.3536 19.6228 13.6436 19.7704L18.8331 22.4107C19.5739 22.7875 20.4297 22.1658 20.3001 21.3448L19.3927 15.5934C19.342 15.272 19.448 14.9457 19.678 14.7155L23.7927 10.5959C24.38 10.0078 24.0531 9.00179 23.2323 8.87128L17.482 7.95702C17.1607 7.90592 16.8831 7.70426 16.7352 7.4144L14.0887 2.22809Z" fill="url(#paint3_linear_448_8887status)"></path><path d="M12.741 7.3195C12.937 6.98075 13.4261 6.98075 13.6221 7.3195L15.1721 9.99846C15.2442 10.123 15.3656 10.2113 15.5063 10.2413L18.5331 10.8876C18.9159 10.9693 19.067 11.4344 18.8054 11.7255L16.7365 14.0275C16.6403 14.1345 16.594 14.2773 16.6089 14.4204L16.9296 17.4988C16.9701 17.8881 16.5745 18.1755 16.2168 18.0167L13.3882 16.7604C13.2566 16.702 13.1065 16.702 12.975 16.7604L10.1464 18.0167C9.7887 18.1755 9.39305 17.8881 9.4336 17.4988L9.75428 14.4204C9.7692 14.2773 9.72281 14.1345 9.62661 14.0275L7.55775 11.7255C7.29613 11.4344 7.44726 10.9693 7.83001 10.8876L10.8568 10.2413C10.9976 10.2113 11.119 10.123 11.1911 9.99846L12.741 7.3195Z" fill="url(#paint4_linear_448_8887status)"></path><path d="M19.6431 11.3076C13.5027 17.1102 8.01855 14.5437 6.04404 12.5351C3.04056 8.07161 9.63153 11.6424 15.4716 10.0802C20.1437 8.83037 20.1993 10.3777 19.6431 11.3076Z" fill="url(#paint5_linear_448_8887status)"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.486 3.38311C12.6114 3.44656 12.6616 3.59966 12.5981 3.72506L11.8786 5.14712C11.8152 5.27252 11.6621 5.32275 11.5367 5.2593C11.4113 5.19585 11.3611 5.04275 11.4245 4.91735L12.144 3.49529C12.2075 3.36989 12.3606 3.31966 12.486 3.38311Z" fill="#F9BE76"></path><circle cx="3.68131" cy="9.52742" r="0.254474" fill="#F9BE76"></circle><circle cx="11.3155" cy="5.62557" r="0.254474" fill="#F9BE76"></circle><path d="M10.7514 8.25268C8.82111 10.9869 9.51093 12.4755 10.0971 12.8781C11.8774 13.6816 15.1214 8.94033 15.3409 7.68564C15.5604 6.43095 13.1642 4.83492 10.7514 8.25268Z" fill="url(#paint6_linear_448_8887status)" fill-opacity="0.6"></path><defs><linearGradient id="paint0_linear_448_8887status" x1="13.1818" y1="0.45166" x2="18.8651" y2="22.4213" gradientUnits="userSpaceOnUse"><stop stop-color="#FBA416" stop-opacity="0"></stop><stop offset="1" stop-color="#FDBB4E" stop-opacity="0.63"></stop></linearGradient><linearGradient id="paint1_linear_448_8887status" x1="13.182" y1="0.451259" x2="18.8653" y2="22.4209" gradientUnits="userSpaceOnUse"><stop stop-color="#FDBB4E" stop-opacity="0"></stop><stop offset="1" stop-color="#FDBB4E" stop-opacity="0.63"></stop></linearGradient><radialGradient id="paint2_radial_448_8887status" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(10.2132 9.86681) rotate(52.6712) scale(14.8278)"><stop offset="0.738765" stop-color="#9CB6DD" stop-opacity="0"></stop><stop offset="0.89825" stop-color="#C6F1FF" stop-opacity="0.37"></stop><stop offset="1" stop-color="#EFFBFF" stop-opacity="0.7"></stop></radialGradient><linearGradient id="paint3_linear_448_8887status" x1="20.3073" y1="17.4162" x2="8.6015" y2="6.81312" gradientUnits="userSpaceOnUse"><stop stop-color="#FEFFD3" stop-opacity="0.63"></stop><stop offset="0.218803" stop-color="#FAFD4E" stop-opacity="0"></stop><stop offset="0.491108" stop-color="#FDFF8B" stop-opacity="0.56"></stop><stop offset="0.733041" stop-color="#F7F990"></stop><stop offset="1" stop-color="white" stop-opacity="0"></stop><stop offset="1" stop-color="#FEFFB7" stop-opacity="0"></stop></linearGradient><linearGradient id="paint4_linear_448_8887status" x1="13.1816" y1="6.55811" x2="13.0119" y2="17.8398" gradientUnits="userSpaceOnUse"><stop stop-color="#FEFFB0"></stop><stop offset="0.277442" stop-color="white" stop-opacity="0.51"></stop><stop offset="1" stop-color="#FAFD4E" stop-opacity="0.15"></stop></linearGradient><linearGradient id="paint5_linear_448_8887status" x1="12.635" y1="10.8612" x2="12.551" y2="14.8707" gradientUnits="userSpaceOnUse"><stop stop-color="#FAFD4E" stop-opacity="0"></stop><stop offset="0.731853" stop-color="#FAFD4E" stop-opacity="0.46"></stop></linearGradient><linearGradient id="paint6_linear_448_8887status" x1="11.5105" y1="8.61842" x2="13.7636" y2="10.7449" gradientUnits="userSpaceOnUse"><stop offset="0.223958" stop-color="#FAFD4E" stop-opacity="0.35"></stop><stop offset="1" stop-color="#FAFD4E" stop-opacity="0"></stop></linearGradient></defs></svg>
            </div>
            <div class="status-bar__status-content">
                <span class="status-bar__status-title">Следующий шаг</span>
                <div class="status-bar__status-text">
                    <span class="status-bar__status-text-amount">${window.gameState.currentWinAmount.toLocaleString('ru-RU', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })}</span>
                    <span class="text-sm leading-4">&nbsp;</span>
                    <span class="status-bar__status-text-currency">₽</span>
                </div>
            </div>
        </div>
        <div class="multiplier-list">
            <div class="multiplier-list-inner overflow-visible" style="translate: none; rotate: none; scale: none; transform: translate(0px, 0px);">
                ${generateMultiplierListHTML()}
            </div>
        </div>
    `;
    
    statusBar.innerHTML = gameStatusHTML;
}

function generateMultiplierListHTML() {
    const localStepMultipliers = window.stepMultipliers[window.gameState.trapCount];
    
    let html = '';
    
    // Добавляем множители
    localStepMultipliers.forEach((multiplier, index) => {
        const isActive = index === 0 ? 'multiplier-list__item-text_active' : '';
        html += `
            <div class="multiplier-list__item">
                <span class="multiplier-list__item-text ${isActive}">X${multiplier}</span>
            </div>
        `;
    });
    
    // Добавляем пустые элементы для заполнения (как в оригинале)
    for (let i = 0; i < 9; i++) {
        html += `
            <div class="multiplier-list__item">
                <span class="multiplier-list__item-text"></span>
            </div>
        `;
    }
    
    return html;
}

function updateBalanceDisplay(newBalance) {
    localStorage.setItem('balance', newBalance.toFixed(2))

    const walletValue = document.getElementById('walletValue');
    if (walletValue) {
        walletValue.textContent = `${newBalance.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ₽`;
    }

    // Обновляем значение в кошельке на основной странице
    window.parent.updateHeaderBalance(newBalance);
}