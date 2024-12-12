let db;

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
            nome TEXT,
            marca TEXT,
            modelo TEXT,
            quantidade INTEGER NOT NULL,
            valor REAL NOT NULL
        );

        CREATE TABLE vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            data TEXT NOT NULL,
            valor REAL NOT NULL
        );

        CREATE TABLE clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL,
            email TEXT,
            endereco TEXT NOT NULL
        );
        `);

        salvarBanco();

    }
    
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

//Renderiza a tabela de produtos
function renderProdutos(){
    const produtos = db.exec("SELECT * FROM produtos");
    const tabela = document.querySelector("#tabela-produtos tbody");
    tabela.innerHTML = "";

    produtos[0]?.values.forEach(produto => {

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${produto[0]}</td>
            <td>${produto[1]}</td>
            <td>${produto[2]}</td>
            <td>${produto[3]}</td>
            <td>${produto[4].toFixed(2)}</td>
        `;
        tabela.appendChild(row);
    });

}

//Renderiza a tabela de vendas
function renderVendas(){
    const vendas = db.exec("SELECT * FROM vendas");
    const tabela = document.querySelector("#tabela-vendas tbody");
    tabela.innerHTML = "";

    vendas[0]?.values.forEach(venda => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${venda[0]}</td>
            <td>${venda[1]}</td>
            <td>${venda[2]}</td>
            <td>${venda[3]}</td>
            <td>${venda[4]}</td>
            <td>${venda[5].toFixed(2)}</td>
        `;
        table.appendChild(row);

    });

}

//Renderiza a tabela de clientes
function renderClientes(){
    const vendas = db.exec("SELECT * FROM clientes");
    const tabela = document.querySelector("#tabela-clientes tbody");
    tabela.innerHTML = "";

    vendas[0]?.values.forEach(venda => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${venda[0]}</td>
            <td>${venda[1]}</td>
            <td>${venda[2]}</td>
            <td>${venda[3]}</td>
        `;
        tabela.appendChild(row);//erro1

    });

}

function mostrarSecao(secaoId) {
    console.log(`Tentando exibir a seção: ${secaoId}`);
    // Obtém todas as seções
    const secoes = document.querySelectorAll("main section");

    // Oculta todas as seções
    secoes.forEach(secao => {
        console.log(`Escondendo seção: ${secao.id}`);
        secao.classList.remove("active"); // Remove a classe active
        secao.style.display = "none"; // Oculta usando display: none
    });

    // Mostra a seção selecionada
    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) {
        console.log(`Exibindo seção: ${secaoId}`);
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
    }else{
        console.error("Modal ${modalId} não encontrado");
    }
}

// Salva um produto
function salvarProduto() {
    const nome = document.getElementById("nome-produto").value;
    const marca = document.getElementById("marca-produto").value;
    const modelo = document.getElementById("modelo-produto").value;
    const quantidade = parseInt(document.getElementById("quantidade-produto").value, 10);
    const valor = parseFloat(document.getElementById("valor-produto").value);

    if (!nome || isNaN(quantidade) || isNaN(valor)) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    db.run(
        "INSERT INTO produtos (nome, marca, modelo, quantidade, valor) VALUES (?, ?, ?, ?, ?)",
        [nome, marca, modelo, quantidade, valor]
    );

    salvarBanco();
    renderProdutos();
    fecharModal("modal-produto");
    alert("Produto cadastrado com sucesso!");
}

// Salva uma venda
function salvarVenda() {
    const cliente = document.getElementById("cliente-venda").value || document.getElementById("novo-cliente").value;
    const produtoId = document.getElementById("produto-venda").value;
    const quantidade = parseInt(document.getElementById("quantidade-venda").value, 10);
    const data = document.getElementById("data-venda").value || new Date().toISOString().slice(0, 10);
    const valor = parseFloat(document.getElementById("valor-venda").value);

    if (!cliente || !produtoId || isNaN(quantidade) || isNaN(valor)) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    //Verifica Cliente
    const clienteExistente = db.exec(`SELECT * FROM clientes WHERE nome='${cliente}'`)[0];
    if(!clienteExistente[0]){
        //Insere o cliente no banco com informações incompletas
        db.run("INSERT INTO clientes (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)", [
            cliente, 
            "", 
            "", 
            ""
        ]);
        salvarBanco();
        renderClientes();
        alert("Cliente cadastrado automaticamente, verifique as informações!");
    }

    // Verifica estoque
    const produto = db.exec(`SELECT * FROM produtos WHERE id=${produtoId}`)[0];
    if (!produto || produto.value[0][3] < quantidade) {
        alert("Quantidade em estoque insuficiente.");
        return;
    }

    //Salva a venda
    db.run(
        "INSERT INTO vendas (cliente, produto_id, quantidade, data, valor) VALUES (?, ?, ?, ?, ?)",
        [cliente, produtoId, quantidade, data, valor]
    );

    salvarBanco();
    renderVendas();
    renderProdutos();
    fecharModal("modal-venda");
    alert("Venda registrada com sucesso!");
}

// Salva um cliente
function salvarCliente() {
    const nome = document.getElementById("nome-cliente").value;
    const telefone = document.getElementById("telefone-cliente").value;
    const email = document.getElementById("email-cliente").value;
    const endereco = document.getElementById("endereco-cliente").value;

    if (!nome || !telefone || !endereco) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    db.run(
        "INSERT INTO clientes (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)",
        [nome, telefone, email, endereco]
    );

    salvarBanco();
    renderClientes();
    fecharModal("modal-cliente");
    alert("Cliente cadastrado com sucesso!");
}

function popularClienteseProdutos(){
    
    //Lista Clientes
    const clientes = db.exec("SELECT nome FROM clientes");
    const clienteSelect = document.getElementById("cliente-venda");
    clienteSelect.innerHTML = "<option value=''>Selecione um cliente</option>";
    clientes[0]?.values.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente[0];
        option.textContent = cliente[0];
        clienteSelect.appendChild(option);
    });

    //Lista Produtos
}

initDatabase().catch(err => console.error("Erro ao inicializar o banco de dados", err));