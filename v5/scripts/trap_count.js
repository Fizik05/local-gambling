document.addEventListener('DOMContentLoaded', function() {
    // Настройки
    const trapOptions = [1, 3, 5, 7];
    let currentTrapIndex = 1; // Начинаем с 3 ловушек (индекс 1)
    
    // Инициализация селектора ловушек
    initializeTrapSelector();
    
    // Функция инициализации (может быть вызвана повторно)
    function initializeTrapSelector() {
        // Находим элементы
        const prevBtn = document.getElementById('prev_preset_btn');
        const nextBtn = document.getElementById('next_preset_btn');
        const trapsAmountSpan = document.getElementById('trapsAmount');
        
        if (!prevBtn || !nextBtn || !trapsAmountSpan) {
            console.log('Trap selector elements not found');
            return;
        }
        
        // Функция обновления UI
        function updateTrapsSelector() {
            const currentTraps = trapOptions[currentTrapIndex];
            trapsAmountSpan.textContent = currentTraps;
            
            // Обновляем состояние кнопок
            prevBtn.classList.toggle('disabled:opacity-50', currentTrapIndex === 0);
            nextBtn.classList.toggle('disabled:opacity-50', currentTrapIndex === trapOptions.length - 1);
            
            // Отключаем кнопки на границах
            prevBtn.disabled = currentTrapIndex === 0;
            nextBtn.disabled = currentTrapIndex === trapOptions.length - 1;
        }
        
        // Удаляем старые обработчики событий
        prevBtn.removeEventListener('click', prevBtnHandler);
        nextBtn.removeEventListener('click', nextBtnHandler);
        
        // Обработчик для кнопки "назад"
        function prevBtnHandler() {
            if (currentTrapIndex > 0 && !window.gameState.isGameActive) {
                currentTrapIndex--;
                updateTrapsSelector();
                // Обновляем глобальное состояние и максимальный выигрыш
                if (window.updateTrapCount) {
                    window.updateTrapCount(trapOptions[currentTrapIndex]);
                }
            }
        }
        
        // Обработчик для кнопки "вперед"
        function nextBtnHandler() {
            if (currentTrapIndex < trapOptions.length - 1 && !window.gameState.isGameActive) {
                currentTrapIndex++;
                updateTrapsSelector();
                // Обновляем глобальное состояние и максимальный выигрыш
                if (window.updateTrapCount) {
                    window.updateTrapCount(trapOptions[currentTrapIndex]);
                }
            }
        }
        
        // Добавляем новые обработчики событий
        prevBtn.addEventListener('click', prevBtnHandler);
        nextBtn.addEventListener('click', nextBtnHandler);
        
        // Сохраняем ссылки на функции для возможности их удаления
        prevBtn._handler = prevBtnHandler;
        nextBtn._handler = nextBtnHandler;
        
        // Инициализация
        updateTrapsSelector();
    }
    
    // Глобальная функция для переинициализации селектора после восстановления DOM
    window.reinitializeTrapSelector = function() {
        // Небольшая задержка для того, чтобы DOM успел обновиться
        setTimeout(() => {
            initializeTrapSelector();
        }, 10);
    };
});