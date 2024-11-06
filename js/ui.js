function updatePayerOptions() {
    const namesInput = document.getElementById('names').value;
    const names = namesInput.split(',').map(name => name.trim()).filter(name => name !== "");
    const payerSelect = document.getElementById('payer');
    payerSelect.innerHTML = '<option value="">Select Payer</option>';
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        payerSelect.add(option);
    });
}

function showSplitDetails() {
    const splitType = document.getElementById('splitType').value;
    const splitDetailsDiv = document.getElementById('splitDetails');
    splitDetailsDiv.innerHTML = ''; // Clear previous details
    if (splitType !== 'equal') {
        const namesInput = document.getElementById('names').value;
        const names = namesInput.split(',').map(name => name.trim()).filter(name => name !== "");
        let html = '';
        if (splitType === 'unequal') {
            html += '<div class="form-group"><label>Enter amounts for each person:</label>';
            names.forEach(name => {
                html += `
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text">${name}</div>
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
            names.forEach(name => {
                html += `
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text">${name}</div>
                        </div>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Percentage for ${name}" oninput="updateRemainingPercentage()">
                    </div>
                `;
            });
            html += `<div id="remainingPercentage" class="remaining">Remaining: 100%</div>`;
        } else if (splitType === 'shares') {
            html += '<div class="form-group"><label>Enter shares for each person:</label>';
            names.forEach(name => {
                html += `
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text">${name}</div>
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

function addExpenseToTable(description, payer, amount, splitDetails) {
    const tableBody = document.getElementById('expensesTable').getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();

    // Action cell with Edit and Delete buttons
    const actionCell = row.insertCell(0);
    actionCell.className = 'sticky-action';

    // Edit Button
    const editButton = document.createElement('button');
    editButton.className = 'icon-btn';
    editButton.innerHTML = '<img src="assets/icons/edit.png" alt="Edit" width="20">';
    editButton.onclick = function () {
        alert('Edit functionality is not implemented yet.');
    };

    // Delete Button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-btn';
    deleteButton.innerHTML = '<img src="assets/icons/delete.png" alt="Delete" width="20">';
    deleteButton.onclick = function () {
        const index = Array.from(tableBody.rows).indexOf(row);
        expenses.splice(index, 1);
        tableBody.deleteRow(index);
    };

    actionCell.appendChild(editButton);
    actionCell.appendChild(deleteButton);

    // Insert other cells
    row.insertCell(1).innerText = description;
    row.insertCell(2).innerText = payer;
    row.insertCell(3).innerText = amount.toFixed(2);
    row.insertCell(4).innerText = JSON.stringify(splitDetails);

    // Reset form fields after adding the expense
    document.getElementById('description').value = '';
    document.getElementById('payer').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('splitType').value = 'equal';
    document.getElementById('splitDetails').style.display = 'none';
    document.getElementById('splitDetails').innerHTML = '';
}

