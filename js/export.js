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
    // Check for jsPDF in case it wasn't loaded
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error("jsPDF library is not loaded.");
        return;
    }

    // Create a container for the PDF content
    const pdfContent = document.createElement('div');
    pdfContent.classList.add('pdf-content');

    // Load PDF-specific styling if needed
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = 'css/pdfStyles.css';
    pdfContent.appendChild(styleLink);

    // Clone Balances Table and Settlement Details
    const balancesTable = document.getElementById('balancesTable').cloneNode(true);
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('table-container');
    tableContainer.appendChild(balancesTable);
    pdfContent.appendChild(tableContainer);

    const settlementDetails = document.getElementById('settlementDetails').cloneNode(true);
    settlementDetails.classList.add('settlement-details');
    pdfContent.appendChild(settlementDetails);

    // Access jsPDF using the UMD format
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.html(pdfContent, {
        callback: function (pdf) {
            pdf.save('balances_and_settlement.pdf');
        },
        x: 10,
        y: 10,
        margin: [10, 10, 10, 10]
    });
}
// Expose the function to be accessible globally
window.exportToCSV = exportToCSV;
window.exportToPDF = exportToPDF;
