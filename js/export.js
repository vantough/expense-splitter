function exportToCSV() {
    const namesInput = document.getElementById('names').value;
    const names = namesInput.split(',').map(name => name.trim()).filter(name => name !== "");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Description,Payer,Amount," + names.join(',') + "\n";

    expenses.forEach(expense => {
        let row = `${expense.description},${expense.payer},${expense.amount.toFixed(2)}`;
        names.forEach(name => {
            row += `,${expense.splitDetails[name] ? expense.splitDetails[name].toFixed(2) : '0.00'}`;
        });
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Expense Report", 20, 20);

    let yPosition = 30;
    expenses.forEach(expense => {
        doc.text(`Description: ${expense.description}`, 20, yPosition);
        doc.text(`Payer: ${expense.payer} | Amount: ₹${expense.amount.toFixed(2)}`, 20, yPosition + 10);
        doc.text("Split Details:", 20, yPosition + 20);

        let splitText = '';
        for (const [name, amount] of Object.entries(expense.splitDetails)) {
            splitText += `${name}: ₹${amount.toFixed(2)}  `;
        }
        doc.text(splitText, 20, yPosition + 30);
        yPosition += 40;
    });

    doc.save('expenses.pdf');
}
