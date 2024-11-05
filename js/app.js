let expenses = [];

function showSplitDetails() {
    const splitType = document.getElementById('splitType').value;
    const splitDetailsDiv = document.getElementById('splitDetails');
    splitDetailsDiv.innerHTML = '';
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
            html += `<div id="remainingAmount" class="remaining">Remaining: ₹0.00</div>`;
            html += '</div>';
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
            html += '</div>';
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
            html += '</div>';
        }
        splitDetailsDiv.innerHTML = html;
        splitDetailsDiv.style.display = 'block';
    } else {
        splitDetailsDiv.style.display = 'none';
    }
}

function addExpense() {
    const description = document.getElementById('description').value;
    const payer = document.getElementById('payer').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const splitType = document.getElementById('splitType').value;
    const namesInput = document.getElementById('names').value;
    const names = namesInput.split(',').map(name => name.trim()).filter(name => name !== "");

    if (!description || !payer || isNaN(amount) || !splitType) {
        alert('Please fill in all fields.');
        return;
    }

    let splitDetails = {};
    // ... existing logic for calculating splitDetails ...

    expenses.push({ description, payer, amount, splitDetails });

    const tableBody = document.getElementById('expensesTable').getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    row.insertCell(0).innerText = description;
    row.insertCell(1).innerText = payer;
    row.insertCell(2).innerText = amount.toFixed(2);
    names.forEach(name => {
        const cell = row.insertCell();
        cell.innerText = splitDetails[name] ? splitDetails[name].toFixed(2) : '0.00';
    });
    const actionCell = row.insertCell();
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.innerText = 'Delete';
    deleteButton.onclick = function() {
        const index = Array.from(tableBody.rows).indexOf(row);
        expenses.splice(index, 1);
        tableBody.deleteRow(index);
    };
    actionCell.appendChild(deleteButton);

    // Reset form fields
    document.getElementById('description').value = '';
    document.getElementById('payer').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('splitType').value = 'equal';
    document.getElementById('splitDetails').style.display = 'none';
    document.getElementById('splitDetails').innerHTML = '';
}
