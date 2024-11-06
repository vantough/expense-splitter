function exportToCSV() {
    let csvContent = 'Description,Payer,Amount';

    // Retrieve names from chips
    const chipContainer = document.getElementById('chipContainer');
    const names = Array.from(chipContainer.querySelectorAll('.chip')).map(chip => 
        chip.textContent.replace('×', '').trim()
    );

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

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Add Balance Table
    pdf.setFontSize(16);
    pdf.text("Balances", 10, 10);

    const balanceTable = document.getElementById("balancesTable");
    let yPosition = 20;

    Array.from(balanceTable.rows).forEach((row, rowIndex) => {
        let rowData = "";
        Array.from(row.cells).forEach((cell) => {
            rowData += `${cell.innerText}    `;
        });
        pdf.text(rowData, 10, yPosition);
        yPosition += 10;
    });

    // Add Settlement Details
    pdf.setFontSize(16);
    pdf.text("Settlement Details", 10, yPosition + 10);
    const settlementDetails = document.getElementById("settlementDetails").innerText;
    const lines = pdf.splitTextToSize(settlementDetails, 180); // Wrap text to fit within the page width
    pdf.text(lines, 10, yPosition + 20);

    pdf.save("balances_and_settlement.pdf");
}


// Expose the function to be accessible globally
window.exportToCSV = exportToCSV;
