Orders.forEach(order =>{
    const tr = document.createElement('tr');
    const trContent = `
        <td>${order.clientName}</td>
        <td>${order.saleNumber}</td>
        <td>${order.payment}</td>
        <td class="primary">Detalhes</td>
        `;
        tr.innerHTML = trContent;
        document.querySelector('table tbody').appendChild(tr);
})