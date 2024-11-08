let expenses = [];

function addExpense() {
    const description = document.getElementById('description').value;
    const payer = document.getElementById('payer').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const splitType = document.getElementById('splitType').value;

    // Retrieve names from chips
    const chipContainer = document.getElementById('chipContainer');
    const names = Array.from(chipContainer.querySelectorAll('.chip')).map(chip => 
        chip.textContent.replace('×', '').trim()
    );

    if (!description || !payer || isNaN(amount) || !splitType || names.length === 0) {
        alert('Please fill in all fields.');
        return;
    }

    let splitDetails = {};

    if (splitType === 'equal') {
        const perPerson = amount / names.length;
        names.forEach(name => {
            splitDetails[name] = perPerson;
        });
    } else if (splitType === 'unequal') {
        const inputs = document.querySelectorAll('.split-value');
        let sum = 0;
        let splitValues = {};
        let nullNames = [];

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value;
            const amountValue = value === '' ? 0 : parseFloat(value);
            
            if (isNaN(amountValue)) {
                alert('Please enter valid numbers for split amounts.');
                return;
            }
            splitValues[name] = amountValue;
            if (amountValue === 0) {
                nullNames.push(name);
            }
            sum += amountValue;
        });

        const remaining = amount - sum;
        const splitRemaining = document.getElementById('splitRemaining').checked;

        if (remaining < 0) {
            alert('The sum of split amounts exceeds the total amount.');
            return;
        }

        if (splitRemaining && nullNames.length > 0) {
            const perPerson = remaining / nullNames.length;
            nullNames.forEach(name => {
                splitValues[name] = perPerson;
            });
        } else {
            nullNames.forEach(name => {
                splitValues[name] = 0;
            });
            if (remaining !== 0) {
                alert('Remaining amount is not zero. Please adjust the split amounts or select "Split remaining balance equally among the rest".');
                return;
            }
        }

        splitDetails = splitValues;
    } else if (splitType === 'percentages') {
        const inputs = document.querySelectorAll('.split-value');
        let totalPercentage = 0;
        let splitValues = {};

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value === '' ? 0 : parseFloat(input.value);
            const percentageValue = isNaN(value) ? 0 : value;
            splitValues[name] = percentageValue;
            totalPercentage += percentageValue;
        });

        if (Math.abs(totalPercentage - 100) > 0.01) {
            alert('Total percentage must be 100%. Please adjust the percentages.');
            return;
        }

        for (const [name, percentage] of Object.entries(splitValues)) {
            splitDetails[name] = (percentage / 100) * amount;
        }
    } else if (splitType === 'shares') {
        const inputs = document.querySelectorAll('.split-value');
        let totalShares = 0;
        let splitValues = {};

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value === '' ? 0 : parseFloat(input.value);
            const shareValue = isNaN(value) ? 0 : value;
            splitValues[name] = shareValue;
            totalShares += shareValue;
        });

        if (totalShares === 0) {
            alert('Total shares cannot be zero.');
            return;
        }

        for (const [name, share] of Object.entries(splitValues)) {
            splitDetails[name] = (share / totalShares) * amount;
        }
    }

    expenses.push({ description, payer, amount, splitDetails });
    addExpenseToTable(description, payer, amount, splitDetails);
    updateTotalExpense(); // Update total expense dynamically
}

function updateTotalExpense() {
    const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
    document.getElementById('totalExpense').innerText = `₹${totalExpense.toFixed(2)}`;
}

function calculateBalances() {
    const chipContainer = document.getElementById('chipContainer');
    const names = Array.from(chipContainer.querySelectorAll('.chip')).map(chip => 
        chip.textContent.replace('×', '').trim()
    );

    let balances = {};

    // Initialize balances for each person
    names.forEach(name => balances[name] = 0);

    // Calculate the net balance for each person
    expenses.forEach(expense => {
        const payer = expense.payer;
        const amount = expense.amount;
        const splitDetails = expense.splitDetails;

        for (const [name, share] of Object.entries(splitDetails)) {
            if (name === payer) {
                balances[name] += amount - share;
            } else {
                balances[name] -= share;
            }
        }
    });

    // Update balances table with visual indicators
    const tableBody = document.getElementById('balancesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    for (const [name, balance] of Object.entries(balances)) {
        const row = tableBody.insertRow();
        row.insertCell(0).innerText = name;

        const balanceCell = row.insertCell(1);
        balanceCell.innerText = `₹${balance.toFixed(2)}`;
        
        // Apply color based on balance value
        if (balance > 0) {
            balanceCell.classList.add('balance-positive');
        } else if (balance < 0) {
            balanceCell.classList.add('balance-negative');
        } else {
            balanceCell.classList.add('balance-zero');
        }
    }

    manageSettlement(balances);
}

function manageSettlement(balances) {
    let creditors = [];
    let debtors = [];
    for (const [name, balance] of Object.entries(balances)) {
        if (balance > 0) {
            creditors.push({ name, balance });
        } else if (balance < 0) {
            debtors.push({ name, balance: -balance });
        }
    }

    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => b.balance - a.balance);

    let settlementDetails = '';
    while (creditors.length > 0 && debtors.length > 0) {
        let creditor = creditors[0];
        let debtor = debtors[0];
        let amount = Math.min(creditor.balance, debtor.balance);

        settlementDetails += `<p>${debtor.name} needs to pay ₹${amount.toFixed(2)} to ${creditor.name}</p>`;

        creditor.balance -= amount;
        debtor.balance -= amount;

        if (creditor.balance === 0) {
            creditors.shift();
        }
        if (debtor.balance === 0) {
            debtors.shift();
        }
    }

    document.getElementById('settlementDetails').innerHTML = settlementDetails || '<p>No settlements needed.</p>';
}

function deleteExpense(index, row) {
    expenses.splice(index, 1);
    row.remove();
    clearBalancesAndSettlement();
    updateTotalExpense(); // Update total expense dynamically after deletion
}

window.addExpense = addExpense;
window.calculateBalances = calculateBalances;
window.manageSettlement = manageSettlement;
window.updateTotalExpense = updateTotalExpense;
