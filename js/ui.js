/* Name chips component */
document.addEventListener("DOMContentLoaded", () => {
    const chipInput = document.getElementById("chipInput");
    const chipContainer = document.getElementById("chipContainer");
    const names = [];

    chipInput.addEventListener("input", function (event) {
        if (event.inputType === "insertText" && (event.data === "," || event.data === "\n")) {
            addChip(this.value.trim());
            this.value = "";
        } else if (event.inputType === "deleteContentBackward" && this.value === "") {
            removeLastChip();
        }
    });

    function addChip(name) {
        if (name && !names.includes(name)) {
            names.push(name);

            const chip = document.createElement("div");
            chip.classList.add("chip");
            chip.innerText = name;

            const closeButton = document.createElement("button");
            closeButton.classList.add("close-btn");
            closeButton.innerHTML = "&times;";
            closeButton.onclick = () => removeChip(name, chip);

            chip.appendChild(closeButton);
            chipContainer.insertBefore(chip, chipInput);
        }
    }

    function removeChip(name, chipElement) {
        const index = names.indexOf(name);
        if (index > -1) {
            names.splice(index, 1);
            chipElement.style.animation = "fadeOut 0.3s ease";
            chipElement.addEventListener("animationend", () => {
                chipElement.remove();
            });
        }
    }

    function removeLastChip() {
        const lastChip = chipContainer.querySelector(".chip:last-child");
        if (lastChip) {
            const name = lastChip.innerText.trim();
            removeChip(name, lastChip);
        }
    }
});

/* Payer dropdown */
function updatePayerOptions() {
    const chipContainer = document.getElementById('chipContainer');
    const payerSelect = document.getElementById('payer');

    // Clear existing options in the payer dropdown
    payerSelect.innerHTML = '<option value="">Select Payer</option>';

    // Get all chips (names) in the chip container
    const chips = chipContainer.querySelectorAll('.chip');
    chips.forEach(chip => {
        const name = chip.textContent.replace('×', '').trim(); // Remove the "×" close button from the text

        // Add each name as an option in the dropdown
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        payerSelect.add(option);
    });
}


/* Split details */
function showSplitDetails() {
    const splitType = document.getElementById('splitType').value;
    const splitDetailsDiv = document.getElementById('splitDetails');
    splitDetailsDiv.innerHTML = ''; // Clear previous details
    if (splitType !== 'equal') {
        const chipContainer = document.getElementById('chipContainer');
        const chips = chipContainer.querySelectorAll('.chip');
        let html = '';
        if (splitType === 'unequal') {
            html += '<div class="form-group"><label>Enter amounts for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace('×', '').trim();
                html += `
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text name-label">${name}</div>
                        </div>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Amount for ${name}" oninput="updateRemainingAmount()">
                    </div>
                `;
            });
            html += `
                <div id="remainingAmount" class="remaining">Remaining: ₹0.00</div>
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="splitRemaining">
                    <label class="form-check-label" for="splitRemaining">Split remaining balance equally among the rest</label>
                </div>
            `;
        } else if (splitType === 'percentages') {
            html += '<div class="form-group"><label>Enter percentages for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace('×', '').trim();
                html += `
                    <div class="input-group mb-2">
                        <div class="prepend">
                            <div class="input-group-text name-label">${name}</div>
                        </div>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Percentage for ${name}" oninput="updateRemainingPercentage()">
                    </div>
                `;
            });
            html += `<div id="remainingPercentage" class="remaining">Remaining: 100%</div>`;
        } else if (splitType === 'shares') {
            html += '<div class="form-group"><label>Enter shares for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace('×', '').trim();
                html += `
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text name-label">${name}</div>
                        </div>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Shares for ${name}">
                    </div>
                `;
            });
        }
        splitDetailsDiv.innerHTML = html;
        splitDetailsDiv.style.display = 'block';
    } else {
        splitDetailsDiv.style.display = 'none';
    }
}

/* remaining amount */
function updateRemainingAmount() {
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const inputs = document.querySelectorAll('.split-value');
    let sum = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    const remaining = amount - sum;
    document.getElementById('remainingAmount').innerText = `Remaining: ₹${remaining.toFixed(2)}`;
}

function updateRemainingPercentage() {
    const inputs = document.querySelectorAll('.split-value');
    let sum = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    const remaining = 100 - sum;
    document.getElementById('remainingPercentage').innerText = `Remaining: ${remaining.toFixed(2)}%`;
}

/* calculate balances */
function addExpenseToTable(description, payer, amount, splitDetails) {
    const tableBody = document.getElementById('expensesTable').getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    const rowIndex = expenses.length - 1; // Index of the current expense

    // Action cell with Edit and Delete buttons
    const actionCell = row.insertCell(0);
    actionCell.className = 'sticky-action';

    // Edit Button
    const editButton = document.createElement('button');
    editButton.className = 'icon-btn';
    editButton.innerHTML = '<img src="assets/icons/edit.png" alt="Edit" width="20">';
    editButton.onclick = function () {
        editExpense(rowIndex);
    };

    // Delete Button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-btn';
    deleteButton.innerHTML = '<img src="assets/icons/delete.png" alt="Delete" width="20">';
    deleteButton.onclick = function () {
        deleteExpense(rowIndex, row);
    };

    actionCell.appendChild(editButton);
    actionCell.appendChild(deleteButton);

    // Insert other cells
    row.insertCell(1).innerText = description;
    row.insertCell(2).innerText = payer;
    row.insertCell(3).innerText = amount.toFixed(2);
    row.insertCell(4).innerText = JSON.stringify(splitDetails);

    // Reset form fields after adding the expense
    clearExpenseForm();
}

function editExpense(index) {
    const expense = expenses[index];

    // Fill form fields with expense data
    document.getElementById('description').value = expense.description;
    document.getElementById('payer').value = expense.payer;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('splitType').value = 'equal'; // Set this as per your application logic
    showSplitDetails();

    const chipContainer = document.getElementById('chipContainer');
    const chips = Array.from(chipContainer.querySelectorAll('.chip')).map(chip =>
        chip.textContent.replace('×', '').trim()
    );

    // Fill split details based on the split type
    const splitDetailsDiv = document.getElementById('splitDetails');
    const splitDetails = expense.splitDetails;
    chips.forEach(name => {
        const inputField = splitDetailsDiv.querySelector(`[data-name="${name}"]`);
        if (inputField) {
            inputField.value = splitDetails[name] || 0;
        }
    });

    // Remove the expense from the list and table
    expenses.splice(index, 1);
    document.getElementById('expensesTable').deleteRow(index + 1); // Adjust index due to header row

    // Clear balances and settlement details
    clearBalancesAndSettlement();
}

function deleteExpense(index, row) {
    expenses.splice(index, 1);
    row.remove();
    clearBalancesAndSettlement();
}

function clearExpenseForm() {
    document.getElementById('description').value = '';
    document.getElementById('payer').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('splitType').value = 'equal';
    document.getElementById('splitDetails').style.display = 'none';
    document.getElementById('splitDetails').innerHTML = '';
}

function clearBalancesAndSettlement() {
    // Clear the balances and settlement details table
    const balancesTableBody = document.getElementById('balancesTable').getElementsByTagName('tbody')[0];
    balancesTableBody.innerHTML = '';

    // Clear the settlement details section
    document.getElementById('settlementDetails').innerHTML = '';
}
