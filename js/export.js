function exportToCSV() {
    let csvContent = 'Description,Payer,Amount';
    const names = document.getElementById('names').value.split(',').map(name => name.trim()).filter(name => name !== "");

    // Add headers for each person
    names.forEach(name => {
        csvContent += `,${name}`;
    });
    csvContent += '\n';

    // Add each expense row
    expenses.forEach(expense => {
        const { description, payer, amount, splitDetails } = expense;
        csvContent += `${description},${payer},${amount}`;

        names.forEach(name => {
            csvContent += `,${splitDetails[name] || 0}`;
        });
        csvContent += '\n';
    });

    // Append settlement details
    csvContent += '\nSettlement Details\n';
    const settlementDetailsDiv = document.getElementById('settlementDetails');
    const settlementDetails = settlementDetailsDiv.innerText.split('\n');
    settlementDetails.forEach(detail => {
        if (detail) {
            csvContent += `${detail}\n`;
        }
    });

    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense_settlement_details.csv';

    // Append the link, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Expose the function to be accessible globally
window.exportToCSV = exportToCSV;