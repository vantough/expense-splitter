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

    // Update table headers for split columns
    const splitHeaders = document.getElementById('splitHeaders');
    splitHeaders.innerHTML = '';
    names.forEach(name => {
        const th = document.createElement('th');
        th.textContent = name;
        splitHeaders.appendChild(th);
    });
}
