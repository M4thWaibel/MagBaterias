const currentFilename = window.location.pathname.split("/").pop();

if (currentFilename === "index.html") {
  Orders.forEach((order) => {
    const tr = document.createElement("tr");
    const trContent = `
            <td>${order.clientName}</td>
            <td>${order.saleNumber}</td>
            <td>${order.payment}</td>
            <td class="primary">Detalhes</td>
            `;
    tr.innerHTML = trContent;

    const tableOrders = document.getElementById("orders");

    if (tableOrders) {
      document.querySelector("tbody").appendChild(tr);
    }
  });

  //Seleciona elementos com a classe primary
  const clickArea = document.querySelectorAll(".primary");
  //Adiciona o evento de clique a cada elemento com a classe primary
  clickArea.forEach((clickElement) => {
    clickElement.addEventListener("click", function () {
      window.location.href = "src/pages/estoque/estoque.html"; //Alterar caminho para página de vendas
    });
  });
} else if (currentFilename === "estoque.html") {
  Stock.forEach((stock) => {
    const tr = document.createElement("tr");
    const trContent = `
            <td>${stock.productName}</td>
            <td>${stock.brand}</td>
            <td>${stock.idNumber}</td>
            <td>${stock.quantity}</td>
            <td class="primary">Detalhes</td>
            `;
    tr.innerHTML = trContent;

    const tableStock = document.getElementById("stock");

    if (tableStock) {
      tableStock.querySelector("tbody").appendChild(tr);
    }

    //Adicona evento de clique a cada elemento com a classe primary
    tr.querySelector(".primary").addEventListener("click", function () {
      //Obtém o modal
      var modal = document.getElementById("meuModal");
      //Adiciona detalhes ao modal
      modal.innerHTML = `
                <div class="modal-conteudo">
                    <span class="fechar">&times;</span>
                    <h1>Produto: ${stock.productName}</h1>
                    <p>Id: ${stock.idNumber}</p>
                    <p>Marca: ${stock.brand}</p>
                    <p>Quantidade em Estoque: ${stock.quantity}</p>
                    <p>Preço de Compra: R$ ${stock.purchasePrice}</p>
                    <p>Preço de Venda: R$ ${stock.salePrice}</p>
                    <p>Tem Garantia? ${stock.warranty}</p>
                `;

      //Abre o modal
      modal.style.display = "block";
      // Obtém o elemento <span> que fecha o modal
      var span = document.getElementsByClassName("fechar")[0];

      // Quando o usuário clica em <span> (x), fecha o modal
      span.onclick = function () {
        modal.style.display = "none";
      };
    });
  });
}
