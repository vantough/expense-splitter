document.addEventListener("DOMContentLoaded", () => {
    const chipInput = document.getElementById("chipInput");
    const chipContainer = document.getElementById("chipContainer");
    const names = [];
    
    // Use both `input` and `keydown` events to handle chip creation on both mobile and desktop
    chipInput.addEventListener("input", function () {
        if (this.value.includes(",")) {
            addChip(this.value.replace(",", "").trim());
            this.value = "";
        }
    });

    chipInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addChip(this.value.trim());
            this.value = "";
        } else if ((event.key === "Backspace" || event.key === "Delete") && this.value === "") {
            removeLastChip();
        }
    });

    function addChip(name) {
        if (name && !names.includes(name)) {
            names.push(name);

            // Create a chip element
            const chip = document.createElement("div");
            chip.classList.add("chip");
            chip.innerText = name;

            // Create a close button for each chip
            const closeButton = document.createElement("button");
            closeButton.classList.add("close-btn");
            closeButton.innerHTML = "&times;";
            closeButton.onclick = () => removeChip(name, chip);

            chip.appendChild(closeButton);
            chipContainer.insertBefore(chip, chipInput);

            updatePayerOptions(); // Refresh the "payer" dropdown when a chip is added
            updatePayerAndPayeeOptions(); // Refresh the "payer" and "payee" dropdowns when a chip is added

        }
    }

    function removeChip(name, chipElement) {
        const index = names.indexOf(name);
        if (index > -1) {
            names.splice(index, 1);
            chipElement.style.animation = "fadeOut 0.3s ease";
            chipElement.addEventListener("animationend", () => {
                chipElement.remove();
                updatePayerOptions(); // Refresh the "payer" dropdown when a chip is removed
                updatePayerAndPayeeOptions(); // Refresh the "payer" and "payee" dropdowns when a chip is added
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

/* Update the "Payer" dropdown with the list of names in the chips */
function updatePayerOptions() {
    const chipContainer = document.getElementById("chipContainer");
    const payerSelect = document.getElementById("payer");

    // Clear existing options in the "payer" dropdown
    payerSelect.innerHTML = '<option value="">Select Payer</option>';

    // Populate dropdown with names from chips
    const chips = chipContainer.querySelectorAll(".chip");
    chips.forEach(chip => {
        const name = chip.textContent.replace("×", "").trim();

        // Add each name as an option in the dropdown
        const option = document.createElement("option");
        option.value = name;
        option.text = name;
        payerSelect.add(option);
        
    });
}

function updatePayerAndPayeeOptions() {
    const chipContainer = document.getElementById("chipContainer");
    const payerSelect = document.getElementById("paymentPayer");
    const payeeSelect = document.getElementById("paymentPayee");

    // Clear existing options in the "payer" and "payee" dropdowns
    payerSelect.innerHTML = '<option value="">Select Payer</option>';
    payeeSelect.innerHTML = '<option value="">Select Payee</option>';

    // Populate dropdown with names from chips
    const chips = chipContainer.querySelectorAll(".chip");
    chips.forEach(chip => {
        const name = chip.textContent.replace("×", "").trim();

        // Add each name as an option in the dropdown
        const payerOption = document.createElement("option");
        payerOption.value = name;
        payerOption.text = name;
        payerSelect.add(payerOption);

        const payeeOption = document.createElement("option");
        payeeOption.value = name;
        payeeOption.text = name;
        payeeSelect.add(payeeOption);
    });
}


function updateBalances(payer, payee, amount) {
    let balances = {};

    // Update balances based on the payer and payee
    expenses.forEach(expense => {
        const splitDetails = expense.splitDetails;

        // If payer is making a payment, adjust their balance
        if (splitDetails[payer]) {
            balances[payer] = (balances[payer] || 0) - amount;
        }

        // If payee is receiving the payment, adjust their balance
        if (splitDetails[payee]) {
            balances[payee] = (balances[payee] || 0) + amount;
        }
    });

    // After payment, update the balance for each user (either reduce or increase)
    const tableBody = document.getElementById('balancesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    // Recalculate balances and display them
    for (const [name, balance] of Object.entries(balances)) {
        const row = tableBody.insertRow();
        row.insertCell(0).innerText = name;
        const balanceCell = row.insertCell(1);
        balanceCell.innerText = `₹${balance.toFixed(2)}`;
        balanceCell.classList.add(balance > 0 ? 'balance-positive' : (balance < 0 ? 'balance-negative' : 'balance-zero'));
    }
}


/* Show split details input fields based on the selected split type */
function showSplitDetails() {
    const splitType = document.getElementById("splitType").value;
    const splitDetailsDiv = document.getElementById("splitDetails");
    splitDetailsDiv.innerHTML = ""; // Clear previous details

    if (splitType !== "equal") {
        const chipContainer = document.getElementById("chipContainer");
        const chips = chipContainer.querySelectorAll(".chip");
        let html = "";

        if (splitType === "unequal") {
            html += '<div class="form-group"><label>Enter amounts for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace("×", "").trim();
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
                <div class="remaining-container">
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
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text name-label">${name}</div>
                        </div>
                        <input type="number" class="form-control split-value" data-name="${name}" placeholder="Percentage for ${name}" oninput="updateRemainingPercentage()">
                    </div>
                `;
            });
            html += `<div id="remainingPercentage" class="remaining">Remaining: 100%</div>`;
        } else if (splitType === "shares") {
            html += '<div class="form-group"><label>Enter shares for each person:</label>';
            chips.forEach(chip => {
                const name = chip.textContent.replace("×", "").trim();
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
        splitDetailsDiv.style.display = "block";
    } else {
        splitDetailsDiv.style.display = "none";
    }
}


/* Update the remaining amount in unequal split */
function updateRemainingAmount() {
    const amount = parseFloat(document.getElementById("amount").value) || 0;
    const inputs = document.querySelectorAll(".split-value");
    let sum = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    const remaining = amount - sum;
    document.getElementById("remainingAmount").innerText = `Remaining: ₹${remaining.toFixed(2)}`;
}

/* Update the remaining percentage in percentage-based split */
function updateRemainingPercentage() {
    const inputs = document.querySelectorAll(".split-value");
    let sum = 0;
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    const remaining = 100 - sum;
    document.getElementById("remainingPercentage").innerText = `Remaining: ${remaining.toFixed(2)}%`;
}

/* Add the expense details to the table */
function addExpenseToTable(description, payer, amount, splitDetails) {
    const tableBody = document.getElementById("expensesTable").getElementsByTagName("tbody")[0];
    const row = tableBody.insertRow();
    const rowIndex = expenses.length - 1; // Index of the current expense

    const actionCell = row.insertCell(0);
    actionCell.className = "sticky-action";

    // Edit and Delete buttons
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

/* Edit an existing expense */
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
}

/* Delete an expense */
function deleteExpense(index, row) {
    expenses.splice(index, 1);
    row.remove();
    clearBalancesAndSettlement();
}

/* Clear form fields after adding or editing an expense */
function clearExpenseForm() {
    document.getElementById("description").value = "";
    document.getElementById("payer").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("splitType").value = "equal";
    document.getElementById("splitDetails").style.display = "none";
    document.getElementById("splitDetails").innerHTML = "";
}

/* Clear balances and settlement information */
function clearBalancesAndSettlement() {
    const balancesTableBody = document.getElementById("balancesTable").getElementsByTagName("tbody")[0];
    balancesTableBody.innerHTML = "";
    document.getElementById("settlementDetails").innerHTML = "";
}
