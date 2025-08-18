document.addEventListener('DOMContentLoaded', function() {
    window.GeneralBalance = 1000

    // general blocks
    window.TotalWithdrawalSum = 0
    window.WithdrawalCard = 0

    window.modalContainer = document.querySelector('.modal-layout_wrapper-C9j8A[data-testid="modal-layout"]');
    const profileButton = document.querySelector('button.view_root-NgI2O.view_compact-NgI2O[data-testid="sidebar-profile-button"]');
    let closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
    let withdrawalButton = document.querySelector('button[data-testid="profile-withdrawButton"]');
    let historyButton = document.querySelector('button[data-testid="profile-transactionHistoryButton"]');

    window.installProfileButtons = function() {
        closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
        withdrawalButton = document.querySelector('button[data-testid="profile-withdrawButton"]');
        historyButton = document.querySelector('button[data-testid="profile-transactionHistoryButton"]');

        closeButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.modalContainer.innerHTML = "";
            window.modalContainer.style.display = 'none';
        });

        withdrawalButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            loadWithdrawalContent().then(content => {
                window.modalContainer.innerHTML = content;
                window.modalContainer.style.display = 'block';
            });
        });

        historyButton.addEventListener('click', function() {
            loadHistoryContent().then(content => {
                window.modalContainer.innerHTML = content;
                window.modalContainer.style.display = 'block';

                installHistoryButtons();
            })
        })
    };

    installHistoryButtons = function() {
        closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
        let backButton = document.querySelector('button[data-testid="modal-back-button"]');

        closeButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.modalContainer.innerHTML = "";
            window.modalContainer.style.display = 'none';
        });

        backButton.addEventListener('click', function(event) {
            loadModalContent().then(content => {
                window.modalContainer.innerHTML = content;
                window.modalContainer.style.display = 'block';

                window.installProfileButtons();
            })
        })

        const data = formatTransactionData();

        // Обновляем номер карты
        const cardElement = document.getElementById('card');
        if (cardElement) {
            cardElement.textContent = data.card;
        }
        
        // Обновляем сумму
        const amountElement = document.getElementById('amount');
        if (amountElement) {
            amountElement.innerHTML = data.amount;
        }
        
        // Обновляем дату
        const dateElement = document.getElementById('date');
        if (dateElement) {
            dateElement.textContent = data.date;
        }
        
        // Обновляем время
        const timeElement = document.getElementById('time');
        if (timeElement) {
            timeElement.textContent = data.time;
        }
    }

    profileButton.addEventListener('click', function(event) {
        event.preventDefault();
        
        loadModalContent().then(content => {
            window.modalContainer.innerHTML = content;
            window.modalContainer.style.display = 'block';

            const modalBalance = document.querySelector(".variant-1_balanceValue-RYHEE")
            if (modalBalance) {
                balance = parseFloat(localStorage.getItem('balance'))
                window.GeneralBalance = balance
                let newAmount = balance.toFixed(2);
                modalBalance.innerHTML = newAmount.replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;').replace('.', ',') + '&nbsp;₽';
            }

            window.installProfileButtons();
        });
    });
});

// Функции для загрузки HTML содержимого в модальное окно
function loadModalContent() {
    const htmlFilePath = 'modal-windows/personal.account.html';

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

function loadWithdrawalContent() {
    const htmlFilePath = 'modal-windows/withdrawal.html';

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

function loadHistoryContent() {
    const htmlFilePath = 'modal-windows/history.html';

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

function formatTransactionData() {
    // Получаем данные из localStorage
    const amount = localStorage.getItem('amount') || '0';
    const card = localStorage.getItem('card') || '0';
    const date = localStorage.getItem('date') || '';
    const time = localStorage.getItem('time') || '';
    
    // Форматируем сумму
    const formattedAmount = formatCurrency(amount);
    
    // Форматируем номер карты
    const formattedCard = formatCardNumber(card);
    
    // Форматируем дату
    const formattedDate = formatDate(date);
    
    return {
        amount: formattedAmount,
        card: formattedCard,
        date: formattedDate,
        time: time
    };
}

function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    
    // Добавляем знак минус если положительное число (для расходов)
    const sign = num > 0 ? '-' : '';
    const absNum = Math.abs(num);
    
    // Форматируем с пробелами между разрядами
    const formatted = absNum.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return `${sign}${formatted}&nbsp;₽`;
}

function formatCardNumber(cardNumber) {
    if (!cardNumber || cardNumber === '0') {
        return '402**********039'; // значение по умолчанию
    }
    
    // Если передан полный номер, маскируем его
    if (cardNumber.length === 16) {
        return cardNumber.substring(0, 3) + '**********' + cardNumber.substring(13);
    }
    
    return cardNumber;
}

function formatDate(dateString) {
    if (!dateString) {
        const now = new Date();
        return formatDateToRussian(now);
    }
    
    // Если дата в формате 18.08.2025, преобразуем
    if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.');
        const date = new Date(year, month - 1, day);
        return formatDateToRussian(date);
    }
    
    return dateString;
}

function formatDateToRussian(date) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year} г.`;
}
