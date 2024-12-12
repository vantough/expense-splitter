let expenses = [];
let payments = [];  
let hasCalculated = false; // Track if "calculate" has been clicked at least once.

document.addEventListener("DOMContentLoaded", () => {
    attachFocusListeners();
});

function attachFocusListeners() {
    const descriptionInput = document.getElementById('description');
    const payerSelect = document.getElementById('payer');
    const amountInput = document.getElementById('amount');
    const splitTypeSelect = document.getElementById('splitType');
    const chipInput = document.getElementById('chipInput');

    // Payment form fields
    const paymentPayerSelect = document.getElementById('paymentPayer');
    const paymentPayeeSelect = document.getElementById('paymentPayee');
    const paymentAmountInput = document.getElementById('paymentAmount');

    [descriptionInput, payerSelect, amountInput, splitTypeSelect, chipInput, paymentPayerSelect, paymentPayeeSelect, paymentAmountInput].forEach(field => {
        field.addEventListener('focus', () => {
            removeError(field);
        });
    });
}

function attachSplitFieldFocusListeners() {
    const splitFields = document.querySelectorAll('.split-value');
    splitFields.forEach(field => {
        field.addEventListener('focus', () => {
            removeError(field);
        });
    });
}

function showError(field) {
    field.classList.add('error-field');
    const parent = field.closest('.form-group') || field.parentNode;
    parent.classList.add('has-error');
}

function removeError(field) {
    field.classList.remove('error-field');
    const parent = field.closest('.form-group') || field.parentNode;
    parent.classList.remove('has-error');
}

function addExpense() {
    const descriptionInput = document.getElementById('description');
    const payerSelect = document.getElementById('payer');
    const amountInput = document.getElementById('amount');
    const splitTypeSelect = document.getElementById('splitType');
    const chipContainer = document.getElementById('chipContainer');
    const chipInput = document.getElementById('chipInput');

    const description = descriptionInput.value.trim();
    const payer = payerSelect.value.trim();
    const amount = parseFloat(amountInput.value.trim());
    const splitType = splitTypeSelect.value.trim();
    const names = Array.from(chipContainer.querySelectorAll('.chip'))
        .map(chip => chip.textContent.replace('×', '').trim())
        .filter(name => name !== '');

    let isValid = true;

    // Validate fields
    if (!description) { showError(descriptionInput); isValid = false; }
    if (!payer) { showError(payerSelect); isValid = false; }
    if (isNaN(amount) || amount <= 0) { showError(amountInput); isValid = false; }
    if (!splitType) { showError(splitTypeSelect); isValid = false; }
    if (names.length === 0) { showError(chipInput); isValid = false; }

    if (!isValid) return;

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
        let invalidNumbers = false;

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value;
            const amountValue = value === '' ? 0 : parseFloat(value);

            if (isNaN(amountValue)) {
                showError(input);
                invalidNumbers = true;
            }
            
            splitValues[name] = amountValue;
            if (amountValue === 0) {
                nullNames.push(name);
            }
            sum += amountValue;
        });

        if (invalidNumbers) return;

        const remaining = amount - sum;
        const splitRemaining = document.getElementById('splitRemaining').checked;

        if (remaining < 0) return;

        if (splitRemaining && nullNames.length > 0) {
            const perPerson = remaining / nullNames.length;
            nullNames.forEach(name => {
                splitValues[name] = perPerson;
            });
        } else {
            nullNames.forEach(name => {
                splitValues[name] = 0;
            });
            if (remaining !== 0) return;
        }

        splitDetails = splitValues;
    } else if (splitType === 'percentages') {
        const inputs = document.querySelectorAll('.split-value');
        let totalPercentage = 0;
        let splitValues = {};
        let invalidPercent = false;

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value === '' ? 0 : parseFloat(input.value);
            if (isNaN(value)) {
                showError(input);
                invalidPercent = true;
            }
            const percentageValue = isNaN(value) ? 0 : value;
            splitValues[name] = percentageValue;
            totalPercentage += percentageValue;
        });

        if (invalidPercent) return;
        if (Math.abs(totalPercentage - 100) > 0.01) return;

        for (const [name, percentage] of Object.entries(splitValues)) {
            splitDetails[name] = (percentage / 100) * amount;
        }
    } else if (splitType === 'shares') {
        const inputs = document.querySelectorAll('.split-value');
        let totalShares = 0;
        let splitValues = {};
        let invalidShares = false;

        inputs.forEach(input => {
            const name = input.getAttribute('data-name');
            const value = input.value === '' ? 0 : parseFloat(input.value);
            if (isNaN(value)) {
                showError(input);
                invalidShares = true;
            }
            const shareValue = isNaN(value) ? 0 : value;
            splitValues[name] = shareValue;
            totalShares += shareValue;
        });

        if (invalidShares) return;
        if (totalShares === 0) return;

        for (const [name, share] of Object.entries(splitValues)) {
            splitDetails[name] = (share / totalShares) * amount;
        }
    }

    expenses.push({ description, payer, amount, splitDetails });
    addExpenseToTable(description, payer, amount, splitDetails);
    updateTotalExpense(); 

    const elementIds = ["expenseTable", "calculateButton", "total-expense-summary", "table-header"];
    elementIds.forEach(id => {
        document.getElementById(id).style.display = "block";
    });

    // If already calculated once before, auto-update balances
    if (hasCalculated) {
        calculateBalances();
    }
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
    names.forEach(name => balances[name] = 0);

    // Calculate the net balance
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

    // Include payments
    payments.forEach(payment => {
        balances[payment.payer] += payment.amount;
        balances[payment.payee] -= payment.amount;
    });

    // Populate balance table
    const tableBody = document.getElementById('balancesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    for (const [name, balance] of Object.entries(balances)) {
        const row = tableBody.insertRow();
        row.insertCell(0).innerText = name;

        const balanceCell = row.insertCell(1);
        balanceCell.innerText = `₹${balance.toFixed(2)}`;
        
        // Color coding
        if (balance > 0) {
            balanceCell.classList.add('balance-positive');
        } else if (balance < 0) {
            balanceCell.classList.add('balance-negative');
        } else {
            balanceCell.classList.add('balance-zero');
        }
    }

    manageSettlement(balances);

    // Show the balances & split details section
    document.getElementById("balanceandsplit").style.display = "block";

    // Mark that calculation is done at least once
    hasCalculated = true;
}

function togglePaymentForm() {
    const paymentFormContent = document.getElementById("paymentFormContent");
    const toggleIcon = document.getElementById("togglePaymentForm");
    const iconPath = toggleIcon.querySelector('path');

    if (paymentFormContent.style.display === "none" || paymentFormContent.style.display === "") {
        paymentFormContent.style.display = "flex";
        paymentFormContent.classList.add("slide-in");
        iconPath.setAttribute('d', 'M480-530.26 287.33-337.59 224.93-400 480-655.07 735.07-400l-62.4 62.41L480-530.26Z'); 
    } else {
        paymentFormContent.classList.add("slide-out");
        iconPath.setAttribute('d', 'M480-328.93 224.93-584l62.4-62.41L480-453.74l192.67-192.67 62.4 62.41L480-328.93Z');

        setTimeout(() => {
            paymentFormContent.style.display = "none";
            paymentFormContent.classList.remove("slide-out");
        }, 300); 
    }
}

function recordPayment() {
    const paymentPayerSelect = document.getElementById('paymentPayer');
    const paymentPayeeSelect = document.getElementById('paymentPayee');
    const paymentAmountInput = document.getElementById('paymentAmount');

    const payer = paymentPayerSelect.value.trim();
    const payee = paymentPayeeSelect.value.trim();
    const amount = parseFloat(paymentAmountInput.value.trim());

    let isValid = true;
    if (!payer) {showError(paymentPayerSelect); isValid = false;}
    if (!payee) {showError(paymentPayeeSelect);isValid = false;}
    if (isNaN(amount) || amount <= 0) {
        showError(paymentAmountInput);
        isValid = false;
    }
    if (payer && payee && payer === payee) {
        showError(paymentPayerSelect);
        showError(paymentPayeeSelect);
        isValid = false;
    }

    if (!isValid) return;

    const payment = { payer, payee, amount };
    payments.push(payment);
    
    displayPayments();
    updateBalances(payer, payee, amount);
    resetPaymentForm();

    // If calculation done before, update automatically
    if (hasCalculated) {
        calculateBalances();
    }
}

function displayPayments() {
    const paymentsList = document.getElementById('paymentsList');
    paymentsList.innerHTML = ''; 
    payments.forEach((payment, index) => {
        const paymentText = `${payment.payer} paid ₹${payment.amount} to ${payment.payee}.`;
        
        const paymentRow = document.createElement('div');
        paymentRow.classList.add('payment-row');
        paymentRow.innerHTML = `${paymentText} <a href="#" onclick="removePayment(${index})">Remove</a>`;
        
        paymentsList.appendChild(paymentRow);
    });

    togglePaymentsVisibility();
}

function removePayment(index) {
    payments.splice(index, 1);
    displayPayments();

    // If calculation done before, update automatically
    if (hasCalculated) {
        calculateBalances();
    }
}

function togglePaymentsVisibility() {
    const paymentsSection = document.getElementById('paymentsList');
    const recordedPaymentsHeader = document.getElementById('recordedPaymentsHeader');
    
    if (payments.length > 0) {
        paymentsSection.style.display = 'block';
        recordedPaymentsHeader.style.display = 'block';
    } else {
        paymentsSection.style.display = 'none';
        recordedPaymentsHeader.style.display = 'none';
    }
}

function resetPaymentForm() {
    document.getElementById('paymentPayer').value = '';
    document.getElementById('paymentPayee').value = '';
    document.getElementById('paymentAmount').value = '';
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

        if (creditor.balance === 0) creditors.shift();
        if (debtor.balance === 0) debtors.shift();
    }

    document.getElementById('settlementDetails').innerHTML = settlementDetails || '<p>No settlements needed.</p>';
}

function editExpense(index) {
    const expense = expenses[index];
    document.getElementById("description").value = expense.description;
    document.getElementById("payer").value = expense.payer;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("splitType").value = "equal";
    showSplitDetails();

    const chips = Array.from(document.getElementById("chipContainer").querySelectorAll(".chip")).map(chip =>
        chip.textContent.replace("×", "").trim()
    );

    const splitDetailsDiv = document.getElementById("splitDetails");
    const splitDetails = expense.splitDetails;
    chips.forEach(name => {
        const inputField = splitDetailsDiv.querySelector(`[data-name="${name}"]`);
        if (inputField) {
            inputField.value = splitDetails[name] || 0;
        }
    });

    expenses.splice(index, 1);
    document.getElementById("expensesTable").deleteRow(index + 1);
    clearBalancesAndSettlement();
    
    updateTotalExpense();
    if (hasCalculated) {
        calculateBalances();
    }
}

function deleteExpense(index, row) {
    expenses.splice(index, 1);
    row.remove();
    clearBalancesAndSettlement();
    updateTotalExpense();

    if (hasCalculated) {
        calculateBalances();
    }
}

function clearExpenseForm() {
    document.getElementById("description").value = "";
    document.getElementById("payer").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("splitType").value = "equal";
    document.getElementById("splitDetails").style.display = "none";
    document.getElementById("splitDetails").innerHTML = "";
}

function clearBalancesAndSettlement() {
    const balancesTableBody = document.getElementById("balancesTable").getElementsByTagName("tbody")[0];
    balancesTableBody.innerHTML = "";
    document.getElementById("settlementDetails").innerHTML = "";
}

function showSplitDetails() {
    const splitType = document.getElementById("splitType").value;
    const splitDetailsDiv = document.getElementById("splitDetails");
    splitDetailsDiv.innerHTML = "";

    if (splitType !== "equal") {
        const chipContainer = document.getElementById("chipContainer");
        const chips = chipContainer.querySelectorAll(".chip");
        let html = "";

        if (splitType === "unequal") {
            html += '<div class="form-group"><label>Enter amounts for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace("×", "").trim();
                html += `
                    <div class="form-group" id="not-equal-fields">
                        <label class="name-label">${name}</label>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Amount for ${name}" oninput="updateRemainingAmount()">
                    </div>
                `;
            });
            html += `
                <div class="remaining-container form-group">
                    <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="splitRemaining">
                            <label class="form-check-label" for="splitRemaining">Split remaining balance equally among the rest</label>
                    </div>
                    <div id="remainingAmount" class="remaining">Remaining: ₹0.00</div>
                </div>
            `;

        } else if (splitType === "percentages") {
            html += '<div class="form-group"><label>Enter percentages for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace("×", "").trim();
                html += `
                    <div class="form-group" id="not-equal-fields">
                        <label class="name-label">${name}</label>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Percentage for ${name}" oninput="updateRemainingPercentage()">
                    </div>
                `;
            });
            html += `<div id="remainingPercentage" class="remaining form-group">Remaining: 100%</div>`;
        } else if (splitType === "shares") {
            html += '<div class="form-group"><label>Enter shares for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace("×", "").trim();
                html += `
                    <div class="form-group" id="not-equal-fields">
                        <label class="name-label">${name}</label>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Shares for ${name}">
                    </div>
                `;
            });
        }
        splitDetailsDiv.innerHTML = html;
        splitDetailsDiv.style.display = "block";
        attachSplitFieldFocusListeners();
    } else {
        splitDetailsDiv.style.display = "none";
    }
}

function updateRemainingAmount() {
    const amount = parseFloat(document.getElementById("amount").value) || 0;
    const inputs = document.querySelectorAll(".split-value");
    let sum = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) sum += value;
    });
    const remaining = amount - sum;
    document.getElementById("remainingAmount").innerText = `Remaining: ₹${remaining.toFixed(2)}`;
}

function updateRemainingPercentage() {
    const inputs = document.querySelectorAll(".split-value");
    let sum = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) sum += value;
    });
    const remaining = 100 - sum;
    document.getElementById("remainingPercentage").innerText = `Remaining: ${remaining.toFixed(2)}%`;
}

function addExpenseToTable(description, payer, amount, splitDetails) {
    const tableBody = document.getElementById("expensesTable").getElementsByTagName("tbody")[0];
    const row = tableBody.insertRow();
    const rowIndex = expenses.length - 1; 

    const actionCell = row.insertCell(0);
    actionCell.className = "sticky-action";

    const editButton = document.createElement("button");
    editButton.className = "icon-btn";
    editButton.innerHTML = '<img src="assets/icons/edit.png" alt="Edit" width="20">';
    editButton.onclick = function () {
        editExpense(rowIndex);
    };

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-btn";
    deleteButton.innerHTML = '<img src="assets/icons/delete.png" alt="Delete" width="20">';
    deleteButton.onclick = function () {
        deleteExpense(rowIndex, row);
    };

    actionCell.appendChild(editButton);
    actionCell.appendChild(deleteButton);

    row.insertCell(1).innerText = description;
    row.insertCell(2).innerText = payer;
    row.insertCell(3).innerText = amount.toFixed(2);
    row.insertCell(4).innerText = JSON.stringify(splitDetails);

    clearExpenseForm();
}

// Export functions if needed
window.addExpense = addExpense;
window.calculateBalances = calculateBalances;
window.manageSettlement = manageSettlement;
window.updateTotalExpense = updateTotalExpense;
window.recordPayment = recordPayment;
