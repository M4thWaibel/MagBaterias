let db;

    //Manipulação do Banco de Dados

async function initDatabase(){
    //Carrega a biblioteca SQL.js
    const SQL = await initSqlJs({locateFile: () => 'src/libs/sql-wasm.wasm'});
    
    //Verifica se há um Banco salvo no local
    const saveDB = localStorage.getItem("savedDatabase");

    if(saveDB){
        //Carrega banco existente
        const binaryData = new Uint8Array(JSON.parse(saveDB));
        db = new SQL.Database(binaryData);
        console.log("Banco carregado");
    }else{
       //Cria um novo banco
        db = new SQL.Database();
        console.log("Banco criado");

        //Cria tableas
        db.run(`
        CREATE TABLE produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marca TEXT,
            modelo TEXT,
            amperagem TEXT,
            quantidade INTEGER NOT NULL,
            precoC REAL NOT NULL,
            valorV REAL NOT NULL,
            valorP REAL NOT NULL
        );
        

        CREATE TABLE vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            produto_id INTEGER,
            quantidade INTEGER,
            data TEXT NOT NULL,
            valor REAL NOT NULL
        );
        

        CREATE TABLE clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL,
            telefone TEXT NOT NULL,
            email TEXT,
            endereco TEXT
        );
        
        `);

        salvarBanco();

    }

    adicionarColunaDesconto();
    renderProdutos();
    renderVendas();
    renderClientes();
    iniciarAutoSave();

}
//Salvar banco no localstorage
function salvarBanco(){
    if(!db){
        console.error("Banco de dados não inicializado");
        return;
    }

    //Exporta o banco como um Uint8Array
    const data = db.export();

    //Salva o banco como string JSON
    localStorage.setItem("savedDatabase", JSON.stringify(Array.from(data)));
    console.log("Banco salvo");
}
function iniciarAutoSave(){
    setInterval(() =>{
        salvarBanco();
    }, 3600000);//1 hora em ms
    console.log("AutoSave iniciado");
}

    //Renderização das tabelas

//Renderiza a tabela de produtos
function renderProdutos(){
    const produtos = db.exec(`SELECT * FROM produtos`);
    const tabela = document.querySelector("#tabela-produtos tbody");
    tabela.innerHTML = "";

    produtos[0]?.values.forEach(produto => {

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${produto[1]}</td>
            <td>${produto[2]}</td>
            <td>${produto[3]}</td>
            <td>${produto[4]}</td>
            <td>R$ ${produto[5].toFixed(2)}</td>
            <td>R$ ${produto[6].toFixed(2)}</td>
            <td>R$ ${produto[7].toFixed(2)}</td>
            <td>
                <button class="btn-icon" onClick="editarProduto(${produto[0]})">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon btn-delete" onClick="deletarProduto(${produto[0]})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tabela.appendChild(row);
    });

}
//Renderiza a tabela de vendas
function renderVendas(){
    const vendas = db.exec(`SELECT * FROM vendas`);
    const tabela = document.querySelector("#tabela-vendas tbody");
    tabela.innerHTML = "";

    vendas[0]?.values.forEach(venda => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${venda[1]}</td>
            <td>${venda[2]}</td>
            <td>${venda[3]}</td>
            <td>${venda[4]}</td>
            <td>R$ ${venda[5].toFixed(2)}</td>
            <td>R$ ${venda[6].toFixed(2)}</td>
            <td>
                <button class="btn-icon" onClick="editarVenda(${venda[0]})">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon btn-delete" onClick="deletarVenda(${venda[0]})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tabela.appendChild(row);

    });

}
//Renderiza a tabela de clientes
function renderClientes(){
    const clientes = db.exec(`SELECT * FROM clientes`);
    const tabela = document.querySelector("#tabela-clientes tbody");
    tabela.innerHTML = "";

    clientes[0]?.values.forEach(cliente => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cliente[1]}</td>
            <td>${cliente[2]}</td>
            <td>${cliente[3]}</td>
            <td>${cliente[4]}</td>
            <td>${cliente[5]}</td>
            <td>
                <button class="btn-icon" onClick="editarCliente(${cliente[0]})">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon btn-delete" onClick="deletarCliente(${cliente[0]})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tabela.appendChild(row);

    });

}
    //Seções e Modais

function mostrarSecao(secaoId) {
    // Obtém todas as seções
    const secoes = document.querySelectorAll("main section");

    // Oculta todas as seções
    secoes.forEach(secao => {
        secao.classList.remove("active"); // Remove a classe active
        secao.style.display = "none"; // Oculta usando display: none
    });

    // Mostra a seção selecionada
    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) {
        secaoAtiva.classList.add("active"); // Adiciona a classe active
        secaoAtiva.style.display = "block"; // Exibe a seção
    } else {
        console.error(`Seção com ID "${secaoId}" não encontrada.`);
    }
}
// Abre um modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal){
        modal.style.display = "flex"; //O torna visível
        document.body.style.overflow = "hidden"; //Remove a barra de rolagem do body
        if (modalId === "modal-venda") {
            popularClienteseProdutos();
        }
    }else{
        console.error("Modal ${modalId} não encontrado");
    }
}
// Fecha um modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal){
        modal.style.display = "none"; //Oculta o modal
        document.body.style.overflow = "auto"; //Restaura a barra de rolagem do body
        limparFormulario(modalId)

        if(modalId === "modal-venda"){
            produtoSelecionados.length = 0; //Limpa os produtos selecionados
            atualizarTabelaProdutosSelecionados();
            atualizarValorTotal();
        }

    }else{
        console.error("Modal ${modalId} não encontrado");
    }
}

    //Funções de Cadastro

function salvarProduto() {
    const marca = document.getElementById("marca-produto").value;
    const modelo = document.getElementById("modelo-produto").value;
    const amperagem = document.getElementById("amperagem-produto").value;
    const quantidade = parseInt(document.getElementById("quantidade-produto").value, 10);
    const precoC = parseFloat(document.getElementById("precoC-produto").value);
    const valorV = parseFloat(document.getElementById("valorV-produto").value);
    const valorP = parseFloat(document.getElementById("valorP-produto").value);
    const destaque = document.getElementById("checkbox-destaque").checked;

    if (!marca || isNaN(quantidade) || isNaN(precoC) || isNaN(valorV) || isNaN(valorP)) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    if(quantidade<0 || precoC<0 || valorV<0 || valorP<0){
        alert("Valores não podem ser negativos");
        return;
    }

    const marcaFinal = destaque ? `${marca} *` : marca;

    db.run(
        "INSERT INTO produtos (marca, modelo, amperagem, quantidade, precoC, valorV, valorP) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [marcaFinal, modelo, amperagem, quantidade, precoC, valorV, valorP]
    );

    salvarBanco();
    renderProdutos();
    fecharModal("modal-produto");
    alert("Produto cadastrado com sucesso!");
    limparFormulario("modal-produto");
}
function salvarVenda() {
    const cliente = document.getElementById("cliente-venda").value;
    const dataVenda = document.getElementById("data-venda").value || new Date().toISOString().slice(0, 10);
    const clienteNovo = document.getElementById("novo-cliente").value;

    if (!cliente && !clienteNovo || produtoSelecionados.length === 0) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    };

    if(!cliente){
        
        cliente = clienteNovo;

    };

    // Registrar cada produto na venda
    produtoSelecionados.forEach(produto => {
        db.run(
            "INSERT INTO vendas (cliente, produto_id, quantidade, data, valor) VALUES (?, ?, ?, ?, ?)",
            [cliente, produto.produto, produto.quantidade, dataVenda, produto.valor]
        );

        // Atualizar o estoque
        const produtoInfo = db.exec(`SELECT * FROM produtos WHERE id=${produto.id}`)[0];
        const novoEstoque = produtoInfo.values[0][4] - produto.quantidade;
        db.run(`UPDATE produtos SET quantidade=${novoEstoque} WHERE id=${produto.id}`);
    });

    const vendaId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
    gerarPDFVenda(vendaId);

    salvarBanco();
    renderVendas();
    renderProdutos();
    fecharModal("modal-venda");
    alert("Venda registrada com sucesso!");
    limparFormulario("modal-venda");
    atualizarTabelaProdutosSelecionados.length = 0; // Limpar produtos selecionados
}
function salvarCliente() {
    const nome = document.getElementById("nome-cliente").value;
    const cpf = document.getElementById("cpf-cliente").value;
    const telefone = document.getElementById("telefone-cliente").value;
    const email = document.getElementById("email-cliente").value;
    const endereco = document.getElementById("endereco-cliente").value;

    if (!nome || !telefone) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    db.run(
        "INSERT INTO clientes (nome, cpf, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)",
        [nome, cpf, telefone, email, endereco]
    );

    salvarBanco();
    renderClientes();
    fecharModal("modal-cliente");
    alert("Cliente cadastrado com sucesso!");
    limparFormulario("modal-cliente");
}
function popularClienteseProdutos() {
    // Lista de Clientes
    const clientes = db.exec(`SELECT nome FROM clientes`);
    const clienteSelect = document.getElementById("cliente-venda");
    clienteSelect.innerHTML = "<option value=''>Selecione um cliente</option>";

    clientes[0]?.values.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente[0];
        option.textContent = cliente[0];
        clienteSelect.appendChild(option);
    });

    // Lista de Produtos
    const produtos = db.exec(`SELECT id, marca, modelo FROM produtos`);
    const produtoSelect = document.getElementById("produto-venda");
    produtoSelect.innerHTML = "<option value=''>Selecione um produto</option>";

    produtos[0]?.values.forEach(produto => {
        const option = document.createElement("option");
        option.value = produto[0];
        option.textContent = produto[1] + " - "+ produto[2];
        produtoSelect.appendChild(option);
    });

    //Lista de Quantidades
    produtoSelect.addEventListener("change", () => {
        const produtoId = produtoSelect.value;
        const quantidadeSelect = document.getElementById("quantidade-venda");
        quantidadeSelect.innerHTML = "<option value=''>Selecione a quantidade</option>";

        if (produtoId) {
            const produto = db.exec(`SELECT quantidade FROM produtos WHERE id=${produtoId}`)[0];
            const quantidadeDisponivel = produto.values[0][0];

            for (let i = 1; i <= quantidadeDisponivel; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i;
                quantidadeSelect.appendChild(option);
            }
        }
    });

    // Limpar a lista de quantidades sempre que os produtos forem atualizados
    document.getElementById("quantidade-venda").innerHTML = "";
}
//Adicionar produtos a tabela de venda
const produtoSelecionados=[];

function adicionarProdutoVenda(){
    const produtoId = document.getElementById("produto-venda").value;
    const quantidade = parseInt(document.getElementById("quantidade-venda").value, 10);

    if(!produtoId || isNaN(quantidade) || quantidade <=0){
        alert("Selecione um produto e informe uma quantidade válida");
        return;
    }

    const produto = db.exec(`SELECT * FROM produtos WHERE id=${produtoId}`)[0];
    if(!produto || produto.values[0][3] < quantidade){
        alert("Quantidade em estoque insuficiente.");
        return;
    }

    const valorUnitario = parseFloat(produto.values[0][6]); // Valor a vista (valorV)

    produtoSelecionados.push({
        id: produtoId,
        quantidade,
        produto: produto.values[0][1],
        modelo: produto.values[0][2],
        valor: valorUnitario * quantidade,
    });

    atualizarTabelaProdutosSelecionados();
    atualizarValorTotal();
    //Limpar campos após adicionar o produto
    document.getElementById("produto-venda").value = "";
    document.getElementById("quantidade-venda").innerHTML = "<option value=''>Selecione a quantidade</option>";

}

    //Funções de Edição e Atualização
//Deletar
function deletarProduto(productId){
    if(confirm("Tem certeza que deseja deletar este produto?")){
        db.run(`DELETE FROM produtos WHERE id=?`, [productId]);
        salvarBanco();
        renderProdutos();
    }
}

function deletarCliente(clienteId){
    if(confirm("Tem certeza que deseja deletar este cliente?")){
        db.run(`DELETE FROM clientes WHERE id=?`, [clienteId]);
        salvarBanco();
        renderClientes();
    }
}
//Editar
function editarProduto(productId){
    const produto = db.exec(`SELECT * FROM produtos WHERE id=${productId}`)[0];

    if(!produto){
        alert("Produto não encontrado");
        return;
    }

    //Preenche os campos do modal com os dados salvos do produto
    document.getElementById("marca-produto").value = produto.values[0][1];
    document.getElementById("modelo-produto").value = produto.values[0][2];
    document.getElementById("amperagem-produto").value = produto.values[0][3];
    document.getElementById("quantidade-produto").value = produto.values[0][4];
    document.getElementById("precoC-produto").value = produto.values[0][5];
    document.getElementById("valorV-produto").value = produto.values[0][6];
    document.getElementById("valorP-produto").value = produto.values[0][7];

    abrirModal("modal-produto");

    //Substitui a função de salvar para a função de editar
    document.querySelector(".modal-actions .btn").onclick = function(){
        const marca = document.getElementById("marca-produto").value;
        const modelo = document.getElementById("modelo-produto").value;
        const amperagem = document.getElementById("amperagem-produto").value;
        const quantidade = parseInt(document.getElementById("quantidade-produto").value, 10);
        const precoC = parseFloat(document.getElementById("precoC-produto").value);
        const valorV = parseFloat(document.getElementById("valorV-produto").value);
        const valorP = parseFloat(document.getElementById("valorP-produto").value);

        if(quantidade<0 || precoC<0 || valorV<0 || valorP<0){
            alert("Valores não podem ser negativos");
            return;
        }

        db.run(
            "UPDATE produtos SET marca=?, modelo=?, amperagem=?, quantidade=?, precoC=?, valorV=?, valorP=? WHERE id=?",
            [marca, modelo, amperagem, quantidade, precoC, valorV, valorP, productId]
        );

        salvarBanco();
        renderProdutos();
        fecharModal("modal-produto");
        alert("Produto atualizado com sucesso!");
    };
}

function editarCliente(clienteId){
    const cliente = db.exec(`SELECT * FROM clientes WHERE id=${clienteId}`)[0];

    console.log("editando cliente");
    console.log(cliente);
    console.log(clienteId);
    
    if(!cliente){
        alert("Cliente não encontrado");
        return;
    }

    console.log(clienteId);

    //Preenche os campos do modal com os dados salvos do cliente
    document.getElementById("nome-cliente").value = cliente.values[0][1];
    document.getElementById("cpf-cliente").value = cliente.values[0][2];
    document.getElementById("telefone-cliente").value = cliente.values[0][3];
    document.getElementById("email-cliente").value = cliente.values[0][4];
    document.getElementById("endereco-cliente").value = cliente.values[0][5];

    abrirModal("modal-cliente");
    console.log(clienteId);

    document.querySelector("#modal-cliente .modal-actions .btn").onclick = function () {
        const nome = document.getElementById("nome-cliente").value;
        const cpf = document.getElementById("cpf-cliente").value;
        const telefone = document.getElementById("telefone-cliente").value;
        const email = document.getElementById("email-cliente").value;
        const endereco = document.getElementById("endereco-cliente").value;

        if (!nome || !telefone) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        console.log(clienteId);
        db.run(
            `UPDATE clientes SET nome=?, cpf=?, telefone=?, email=?, endereco=? WHERE id=?`,
            [nome, cpf, telefone, email, endereco, clienteId]
        );

        console.log("cliente editado")
        console.log(cliente);
        console.log(clienteId);

        salvarBanco();
        renderClientes();
        fecharModal("modal-cliente");
        alert("Cliente atualizado com sucesso!");
    };

}

function editarVenda(vendaId) {
    const venda = db.exec(`SELECT * FROM vendas WHERE id=${vendaId}`)[0];

    if (!venda) {
        alert("Venda não encontrada");
        return;
    }

    // Preenche os campos do novo modal com as informações editáveis
    document.getElementById("cliente-editar").value = venda.values[0][1]; // Cliente
    document.getElementById("data-editar").value = venda.values[0][4]; // Data
    document.getElementById("valor-editar").value = venda.values[0][5].toFixed(2); // Valor total
    document.getElementById("desconto-editar").value = venda.values[0][6] ? venda.values[0][6].toFixed(2) : ''; // Desconto

    abrirModal("modal-editar-venda");

    // Substitui a função de salvar para a função de editar
    document.querySelector("#modal-editar-venda .modal-actions .btn").onclick = function() {
        const cliente = document.getElementById("cliente-editar").value;
        const dataVenda = document.getElementById("data-editar").value || new Date().toISOString().slice(0, 10);
        const valorTotal = parseFloat(document.getElementById("valor-editar").value);
        const desconto = parseFloat(document.getElementById("desconto-editar").value) || 0;

        if (!cliente || isNaN(valorTotal)) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        db.run(
            "UPDATE vendas SET cliente=?, data=?, valor=?, desconto=? WHERE id=?",
            [cliente, dataVenda, valorTotal, desconto, vendaId]
        );

        salvarBanco();
        renderVendas();
        fecharModal("modal-editar-venda");
        alert("Venda editada com sucesso!");
    };
}


//Limpar Formulário
function limparFormulario(modalId){
    const modal = document.getElementById(modalId);
    if(modal){
        const form = modal.querySelector("form");
        if(form){
            form.reset();
        }
    }
}
//Parcelamento
function atualizarParcelamento(){
    const formaPagamento = document.getElementById("forma-pagamento").value;
    const campoParcelas = document.getElementById("campo-parcelas");
    if(formaPagamento === "credito"){
        campoParcelas.style.display = "block";
    }else{
        campoParcelas.style.display = "none";
        document.getElementById("parcelas").value = 1; //1 parcela por padrão
    }
}
//Atualizar tabela de produtos selecionados
function atualizarTabelaProdutosSelecionados(){
    const tabela = document.querySelector("#tabela-produtos-selecionados tbody");
    tabela.innerHTML = "";

    produtoSelecionados.forEach((produto, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${produto.quantidade}</td>
            <td>${produto.produto}</td>
            <td>${produto.modelo}</td>
            <td>${produto.valor.toFixed(2)}</td>
            <td><button onclick="removerProdutoVenda(${index})">Remover</button></td>
        `;
        tabela.appendChild(row);
    });
}

//Remover Produto da Venda
function removerProdutoVenda(index){
    produtoSelecionados.splice(index, 1);
    atualizarTabelaProdutosSelecionados();
    atualizarValorTotal();
}

//Atualizar valor total
function atualizarValorTotal() {
    let valorTotal = 0;

    produtoSelecionados.forEach(produto => {
        valorTotal += produto.valor;
    });

    document.getElementById("valor-venda").textContent = `R$ ${valorTotal.toFixed(2)}`;
}


//Mensagens
function mostarMensagem(mensagem){
    const mensagemDiv = document.createElement("div");
    mensagemDiv.textContent = mensagem;
    mensagemDiv.className = "mensagem-sucesso";
    document.body.appendChild(mensagemDiv);
    setTimeout(() => mensagemDiv.remove(), 30);
}
//Correção de dt
function adicionarColunaDesconto() {
    // Verifica se a coluna 'desconto' já existe na tabela de vendas
    const resultado = db.exec(`PRAGMA table_info(vendas)`);
    const colunaDescontoExiste = resultado[0].values.some(coluna => coluna[1] === 'desconto');

    if (!colunaDescontoExiste) {
        // Se a coluna 'desconto' não existir, a adiciona
        db.run("ALTER TABLE vendas ADD COLUMN desconto REAL DEFAULT 0");
        salvarBanco(); // Salvar alterações no banco
        console.log("Coluna 'desconto' adicionada com sucesso!");
    } else {
        console.log("A coluna 'desconto' já existe.");
    }
}


    //Relatórios
function gerarRelatorioPorData() {
const vendas = db.exec(`SELECT * FROM vendas ORDER BY data`);
atualizarTabelaRelatorios(vendas);
}

function gerarRelatorioPorCliente() {
    const vendas = db.exec(`SELECT * FROM vendas ORDER BY cliente`);
    atualizarTabelaRelatorios(vendas);
}

function gerarRelatorioPorProduto() {
    const vendas = db.exec(`SELECT * FROM vendas ORDER BY produto_id`);
    atualizarTabelaRelatorios(vendas);
}

function atualizarTabelaRelatorios(vendas) {
    const tabela = document.querySelector("#tabela-relatorios tbody");
    tabela.innerHTML = "";

    vendas[0]?.values.forEach(venda => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${venda[1]}</td>
            <td>${venda[2]}</td> 
            <td>${venda[3]}</td>
            <td>${venda[4]}</td>
            <td>${venda[5].toFixed(2)}</td>
        `;
        tabela.appendChild(row);
    });
}

//Formatar data
function formatarData(dataISO){
    const partesData = dataISO.split("-");
    return `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
}


//Exportar Relatório
function exportarTabela(){
    const tabela = document.getElementById("tabela-relatorios");
    let csvContent = "data:text/csv;charset=utf-8,";

    Array.from(tabela.rows).forEach(row => {
        const rowData = Array.from(row.cells).map(cell => cell.textContent);
        csvContent += rowData.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


initDatabase().catch(err => console.error("Erro ao inicializar o banco de dados", err));