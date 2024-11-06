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
        // Split equally
        const perPerson = amount / names.length;
        names.forEach(name => {
            splitDetails[name] = perPerson;
        });
    } else if (splitType === 'unequal') {
        // Unequal split by specific amounts
        const inputs = document.querySelectorAll('.split-value');
        let sum = 0;
        let splitValues = {};
        let nullNames = [];

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value;
            if (value === '') {
                splitValues[name] = null;
                nullNames.push(name);
            } else {
                const amountValue = parseFloat(value);
                if (isNaN(amountValue)) {
                    alert('Please enter valid numbers for split amounts.');
                    return;
                }
                splitValues[name] = amountValue;
                sum += amountValue;
            }
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
        // Split by percentages
        const inputs = document.querySelectorAll('.split-value');
        let totalPercentage = 0;
        let splitValues = {};

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value;
            const percentageValue = parseFloat(value);
            if (isNaN(percentageValue)) {
                alert('Please enter valid numbers for percentages.');
                return;
            }
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
        // Split by shares
        const inputs = document.querySelectorAll('.split-value');
        let totalShares = 0;
        let splitValues = {};

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = parseFloat(input.value);
            if (isNaN(value) || value <= 0) {
                alert('Please enter valid numbers for shares.');
                return;
            }
            splitValues[name] = value;
            totalShares += value;
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
}

function calculateBalances() {
    // Retrieve names from chips
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

    // Update balances table
    const tableBody = document.getElementById('balancesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    for (const [name, balance] of Object.entries(balances)) {
        const row = tableBody.insertRow();
        row.insertCell(0).innerText = name;
        row.insertCell(1).innerText = `₹${balance.toFixed(2)}`;
    }

    // Calculate settlement details
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

// Expose functions to the global scope if needed
window.addExpense = addExpense;
window.calculateBalances = calculateBalances;
window.manageSettlement = manageSettlement;
