// Создаем глобальную функцию
window.updateHeaderBalance = function(balance) {
    window.GeneralBalance = balance

    // Обновляем баланс в header (полная сумма)
    const headerBalanceSum = document.querySelector('[data-testid="header-balance-sum"]');
    if (headerBalanceSum) {
        headerBalanceSum.innerHTML = `${balance.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace(',', ',')}&nbsp;`;
    }

    // Обновляем баланс в header (сокращенная сумма)
    const headerBalanceSumShort = document.querySelector('[data-testid="header-balance-sum-short"]');
    if (headerBalanceSumShort) {
        // Для сокращенной версии убираем копейки
        const shortBalance = Math.floor(balance);
        headerBalanceSumShort.innerHTML = `${shortBalance.toLocaleString('ru-RU')}&nbsp;`;
    }
};