document.addEventListener('DOMContentLoaded', function() {
    const cancelButton = document.getElementById("cancelButton")
    const totalSum = document.getElementById("totalSum")
    const time = document.getElementById("time")
    const date = document.getElementById("date")

    totalSum.textContent = window.parent.TotalWithdrawalSum.toLocaleString('ru-RU') + ' ₽';

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    time.textContent = `${hours}:${minutes}`;

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    date.textContent = `${day}.${month}.${year}`;


    // ГОВНОКОД И НИХУЯ НЕ РАБОТАЕТ, ПРОСТО ВЫЛЕТАЕТ И НЕ ВОЗВРАЩАЕТ ИЗНАЧАЛЬНОЕ ОКНО
    cancelButton.addEventListener('click', function(event) {
        localStorage.setItem('card', window.parent.WithdrawalCard)
        localStorage.setItem('amount', window.parent.TotalWithdrawalSum)
        localStorage.setItem('date', `${day}.${month}.${year}`)
        localStorage.setItem('time', `${hours}:${minutes}`)

        event.preventDefault();
        // console.log('Cancel button clicked');
        
        loadModalContent().then(content => {
            // console.log('Content loaded, length:', content.length);
            
            try {
                // console.log('modalContainer exists:', !!window.parent.modalContainer);
                // console.log('modalContainer type:', typeof window.parent.modalContainer);
                
                // Попробуем через другой способ
                if (window.parent.modalContainer) {
                    // console.log('Trying to clear innerHTML first...');
                    window.parent.modalContainer.innerHTML = "";
                    // console.log('Clear successful, now setting content...');
                    
                    window.parent.modalContainer.innerHTML = content;
                    // console.log('Content set, now setting display...');
                    
                    window.parent.modalContainer.style.display = 'block';
                    console.log('All operations completed successfully');
                } else {
                    console.error('modalContainer is null or undefined');
                    return;
                }
                
            } catch (error) {
                console.error('Error in DOM operations:', error);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                
                // Попробуем альтернативный способ
                try {
                    console.log('Trying alternative approach...');
                    const container = window.parent.document.querySelector('.modal-layout_wrapper-C9j8A[data-testid="modal-layout"]');
                    console.log('Container found via querySelector:', !!container);
                    
                    if (container) {
                        container.innerHTML = content;
                        container.style.display = 'block';
                        console.log('Alternative approach successful');
                    }
                } catch (altError) {
                    console.error('Alternative approach also failed:', altError);
                }
                
                return;
            }

            // Продолжаем только если DOM операции прошли успешно
            setTimeout(() => {
                try {
                    console.log('Looking for modal balance...');
                    const modalBalance = window.parent.document.querySelector(".variant-1_balanceValue-RYHEE");
                    console.log('Modal balance found:', !!modalBalance);
                    
                    if (modalBalance) {
                        let newAmount = window.parent.GeneralBalance.toFixed(2);
                        modalBalance.innerHTML = newAmount.replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;').replace('.', ',') + '&nbsp;₽';
                        console.log('Balance updated to:', newAmount);
                    }

                    // Проверяем наличие функции
                    console.log('installProfileButtons type:', typeof window.parent.installProfileButtons);
                    
                    if (window.parent.installProfileButtons) {
                        console.log('Calling installProfileButtons...');
                        window.parent.installProfileButtons();
                    } else {
                        console.log('installProfileButtons not found, trying manual setup...');
                        
                        const closeBtn = window.parent.document.querySelector('button[data-testid="modal-header-button-close"]');
                        const withdrawBtn = window.parent.document.querySelector('button[data-testid="profile-withdrawButton"]');
                        
                        console.log('Manual search - Close button:', !!closeBtn);
                        console.log('Manual search - Withdraw button:', !!withdrawBtn);
                        
                        if (closeBtn) {
                            closeBtn.addEventListener('click', function() {
                                console.log('Manual close clicked');
                                window.parent.modalContainer.innerHTML = "";
                                window.parent.modalContainer.style.display = 'none';
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error in setTimeout callback:', error);
                }
            }, 300);
        }).catch(error => {
            console.error('Error loading content:', error);
        });
    });
});

function loadModalContent() {
    const htmlFilePath = './../../modal-windows/personal.account.html';

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