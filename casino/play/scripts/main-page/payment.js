document.addEventListener('DOMContentLoaded', function() {
    let closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
    let backButton = document.querySelector('button[data-testid="modal-header-button-back"]');
    let withdrawalButton = document.querySelector('button[data-testid="modal-header-button-withdrawal"]');

    closeButton.addEventListener('click', function(event) {
        window.parent.modalContainer.innerHTML = "";
    })

    backButton.addEventListener('click', function(event) {
        loadWithdrawalContent().then(content => {
            window.parent.modalContainer.innerHTML = content;
            window.parent.modalContainer.style.display = 'block';
        })
    })

    withdrawalButton.addEventListener('click', function(event) {
        saveWithdrawalData();

        // Обновление баланса
        window.parent.GeneralBalance = parseFloat(localStorage.getItem('balance'))
        a = window.parent.GeneralBalance - window.parent.TotalWithdrawalSum
        window.parent.GeneralBalance = a

        window.top.dispatchEvent(new CustomEvent('localStorageChanged', {
            detail: {
                key: 'balance',
                newValue: a,
            }
        }));

        loadWaitingContent().then(content => {
            window.parent.modalContainer.innerHTML = content;
            window.parent.modalContainer.style.display = 'block';
        })
    })

    function initWithdrawalForm() {
        const cardNumberInput = document.querySelector('._input_1oqmr_74[inputmode="text"]');
        const amountInput = document.querySelector('._input_1oqmr_74[data-testid="amount-input"]');
        
        if (cardNumberInput) {
            setupCardNumberInput(cardNumberInput);
        }
        
        if (amountInput) {
            setupAmountInput(amountInput);
        }
    }

    // Настройка поля номера карты
    function setupCardNumberInput(input) {
        const label = input.parentNode.querySelector('._label_1oqmr_48');
        
        // Убираем класс active при загрузке, если поле пустое
        if (!input.value.trim()) {
            label.classList.remove('_active_1oqmr_66');
            input.classList.remove('_active_1oqmr_66');
        }
        
        // Форматирование номера карты
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            
            if (formattedValue.length > 19) {
                formattedValue = formattedValue.substring(0, 19);
            }
            
            e.target.value = formattedValue;
            updateLabel(input, label);
        });
        
        input.addEventListener('focus', function() {
            updateLabel(input, label);
        });

        input.addEventListener('blur', function() {
            updateLabel(input, label);
        });
    }

    // Настройка поля суммы
    function setupAmountInput(input) {
        const label = input.parentNode.querySelector('._label_1oqmr_48');
        
        // Устанавливаем начальную сумму 2000 ₽
        input.value = '2 000 ₽';
        updateLabel(input, label);
        
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d]/g, '');
            
            if (value === '') {
                e.target.value = '';
            } else {
                let formattedValue = parseInt(value).toLocaleString('ru-RU') + ' ₽';
                e.target.value = formattedValue;
                
                // Устанавливаем курсор перед знаком рубля
                setTimeout(() => {
                    let cursorPos = formattedValue.length - 2; // перед " ₽"
                    input.setSelectionRange(cursorPos, cursorPos);
                }, 0);
            }
            
            updateLabel(input, label);
        });
        
        input.addEventListener('keydown', function(e) {
            let cursorPos = input.selectionStart;
            let value = input.value;
            
            // Обработка backspace
            if (e.key === 'Backspace') {
                e.preventDefault();
                
                let numbersOnly = value.replace(/[^\d]/g, '');
                if (numbersOnly.length > 0) {
                    // Удаляем последнюю цифру
                    numbersOnly = numbersOnly.slice(0, -1);
                    
                    if (numbersOnly === '') {
                        input.value = '';
                    } else {
                        let newValue = parseInt(numbersOnly).toLocaleString('ru-RU') + ' ₽';
                        input.value = newValue;
                        
                        // Курсор перед знаком рубля
                        setTimeout(() => {
                            let newCursorPos = newValue.length - 2;
                            input.setSelectionRange(newCursorPos, newCursorPos);
                        }, 0);
                    }
                    updateLabel(input, label);
                }
                return;
            }
            
            // Разрешаем только цифры
            if (!/\d/.test(e.key) && !['Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        input.addEventListener('click', function() {
            // При клике устанавливаем курсор перед знаком рубля
            if (input.value.includes('₽')) {
                let cursorPos = input.value.length - 2;
                input.setSelectionRange(cursorPos, cursorPos);
            }
        });
        
        input.addEventListener('focus', function() {
            updateLabel(input, label);
            // При фокусе устанавливаем курсор перед знаком рубля
            if (input.value.includes('₽')) {
                setTimeout(() => {
                    let cursorPos = input.value.length - 2;
                    input.setSelectionRange(cursorPos, cursorPos);
                }, 0);
            }
        });
        
        input.addEventListener('blur', function() {
            updateLabel(input, label);
        });
    }

    // Универсальная функция для управления label
    function updateLabel(input, label) {
        if (!label) return;
        
        const hasValue = input.value.trim().length > 0;
        const isFocused = document.activeElement === input;
        
        if (hasValue || isFocused) {
            label.classList.add('_active_1oqmr_66');
            input.classList.add('_active_1oqmr_66');
        } else {
            label.classList.remove('_active_1oqmr_66');
            input.classList.remove('_active_1oqmr_66');
        }
    }

    function saveWithdrawalData() {
        const cardNumberInput = document.querySelector('._input_1oqmr_74[inputmode="text"]');
        const amountInput = document.querySelector('._input_1oqmr_74[data-testid="amount-input"]');
        
        if (cardNumberInput && cardNumberInput.value.trim()) {
            // Убираем пробелы из номера карты для сохранения
            window.parent.WithdrawalCard = cardNumberInput.value.replace(/\s/g, '');
        }
        
        if (amountInput && amountInput.value.trim()) {
            // Извлекаем только числовое значение из суммы
            let numericValue = amountInput.value.replace(/[^\d]/g, '');
            window.parent.TotalWithdrawalSum = parseInt(numericValue) || 0;
        }
    }

    initWithdrawalForm();
});

function loadWithdrawalContent() {
    const htmlFilePath = 'withdrawal.html';

    return fetch(htmlFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text()
        })
        .catch(error => {
            console.error('Ошибка при загрузке содержимого:', error);
        });
}

function loadWaitingContent() {
    const htmlFilePath = 'waiting.html';

    return fetch(htmlFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text()
        })
        .catch(error => {
            console.error('Ошибка при загрузке содержимого:', error);
        });
}