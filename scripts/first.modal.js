document.addEventListener('DOMContentLoaded', function() {
    window.GeneralBalance = parseFloat(localStorage.getItem('balance')) || 4000

    window.updateHeaderBalance(window.GeneralBalance)

    window.modalContainer = document.querySelector('.modal-layout_wrapper-C9j8A[data-testid="modal-layout"]');
    const profileButton = document.querySelector('button.view_root-NgI2O.view_compact-NgI2O[data-testid="sidebar-profile-button"]');
    let closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
    let historyButton = document.querySelector('button[data-testid="profile-transactionHistoryButton"]');

    window.installProfileButtons = function() {
        closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
        historyButton = document.querySelector('button[data-testid="profile-transactionHistoryButton"]');

        closeButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.modalContainer.innerHTML = "";
            window.modalContainer.style.display = 'none';
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
                balance = parseFloat(localStorage.getItem('balance')) || parseFloat(4000)
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
    date = localStorage.getItem('inputDate') || '';
    time = localStorage.getItem('inputTime') || '';

    const now = new Date();

    if (date == '') {
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        date = `${day}.${month}.${year}`;
        localStorage.setItem('inputDate', date)
    }

    if (time == '') {
        const hours = String(now.getHours()-1).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;
        localStorage.setItem('inputTime', time)
    }
    
    // Форматируем дату
    const formattedDate = formatDate(date);
    
    return {
        date: formattedDate,
        time: time
    };
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
