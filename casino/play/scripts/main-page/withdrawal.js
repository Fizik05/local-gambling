document.addEventListener('DOMContentLoaded', function() {

    let closeButton = document.querySelector('button[data-testid="modal-header-button-close"]');
    let payButton = document.querySelector('button[data-testid="payment-method-3-card_rub-caption"]')

    closeButton.addEventListener('click', function(event) {
        window.parent.modalContainer.innerHTML = "";
    })

    payButton.addEventListener('click', function(event) {
        loadPaymentContent().then(content => {
            window.parent.modalContainer.innerHTML = content;
            window.parent.modalContainer.style.display = 'block';
        })
    })
});

function loadPaymentContent() {
    const htmlFilePath = 'payment.html';

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