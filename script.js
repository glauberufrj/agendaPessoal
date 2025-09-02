document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api/compromissos';

    // --- VARIÁVEIS DE ESTADO ---
    let todosOsCompromissos = []; 
    let dataExibida = new Date(); 

    // --- SELETORES DE ELEMENTOS ---
    const listaCompromissos = document.getElementById('lista-compromissos');
    const btnAtualizar = document.getElementById('btn-atualizar');
    
    const formCompromisso = document.getElementById('form-compromisso');
    const isPaginaVisualizacao = !formCompromisso;

    const modal = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const fecharModal = document.getElementsByClassName('fechar-modal')[0];

    // --- INICIALIZAÇÃO DA PÁGINA ---

    const init = async () => {
        todosOsCompromissos = await getCompromissosDaAPI();
        renderizarAgenda();
    };

    const getCompromissosDaAPI = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro ao buscar compromissos.');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    };
    
    // --- LÓGICA DE RENDERIZAÇÃO ---

    const renderizarAgenda = () => {
        if (!listaCompromissos) return;
        listaCompromissos.innerHTML = '';
        
        if (isPaginaVisualizacao) {
            renderizarAgendaPaginada();
        } else {
            renderizarAgendaGestao();
        }
    };

    const renderizarAgendaPaginada = () => {
        const mesAnoTitulo = document.getElementById('mes-ano-exibido');
        mesAnoTitulo.textContent = dataExibida.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const compromissosDoMes = todosOsCompromissos.filter(comp => {
            const dataComp = new Date(comp.dataInicio);
            return dataComp.getMonth() === dataExibida.getMonth() && dataComp.getFullYear() === dataExibida.getFullYear();
        }).sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
        if (compromissosDoMes.length === 0) {
            listaCompromissos.innerHTML = '<li>Nenhum compromisso para este mês.</li>';
            return;
        }
        compromissosDoMes.forEach(comp => {
            const item = document.createElement('li');
            item.className = 'compromisso-item-view';
            item.dataset.id = comp.id;
            const dia = new Date(comp.dataInicio).getDate();
            let participantesHTML = comp.participantes && comp.participantes.length > 0 ? `<div class="participantes-container">${comp.participantes.map(p => `<span class="participante-tag">${p}</span>`).join('')}</div>` : '';
            const acoesHTML = `<div class="compromisso-acoes"><button class="btn-editar">Editar</button><button class="btn-deletar">Deletar</button></div>`;
            item.innerHTML = `
                <div class="compromisso-dia">${dia}</div>
                <div class="compromisso-detalhes">
                    <strong>${comp.titulo}</strong>
                    <small>${new Date(comp.dataInicio).toLocaleTimeString('pt-BR', {timeStyle: 'short'})}</small>
                    ${participantesHTML}
                </div>
                ${acoesHTML}
            `;
            listaCompromissos.appendChild(item);
        });
    };

    const renderizarAgendaGestao = () => {
        const compromissosOrdenados = [...todosOsCompromissos].sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
        if (compromissosOrdenados.length === 0) {
             listaCompromissos.innerHTML = '<li>Nenhum compromisso cadastrado.</li>';
             return;
        }
        compromissosOrdenados.forEach(comp => {
            const item = document.createElement('li');
            item.className = 'compromisso-item';
            item.dataset.id = comp.id;
            let participantesHTML = comp.participantes && comp.participantes.length > 0 ? `<div class="participantes-container">${comp.participantes.map(p => `<span class="participante-tag">${p}</span>`).join('')}</div>` : '';
            const inicio = new Date(comp.dataInicio);
            let dataFormatada = inicio.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
            if (comp.dataFim) {
                const fim = new Date(comp.dataFim);
                dataFormatada += ` até ${fim.toLocaleTimeString('pt-BR', { timeStyle: 'short' })}`;
            }
            const tagRecorrencia = comp.recorrencia && comp.recorrencia !== 'nenhuma' ? `<span class="recorrencia-tag">${comp.recorrencia}</span>` : '';
            const acoesHTML = `<div class="compromisso-acoes"><button class="btn-editar">Editar</button><button class="btn-deletar">Deletar</button></div>`;
            item.innerHTML = `<div class="compromisso-info">
                <strong>${comp.titulo} ${tagRecorrencia}</strong>
                <small>${dataFormatada}</small>
                <p>${comp.descricao || ''}</p>
                ${participantesHTML}
            </div>${acoesHTML}`;
            listaCompromissos.appendChild(item);
        });
    };

    // --- FUNÇÕES DE AÇÃO E EVENTOS ---

    const manipularAcoesCompromisso = async (e) => {
        const alvo = e.target;
        const btnDeletar = alvo.closest('.btn-deletar');
        const btnEditar = alvo.closest('.btn-editar');

        if (!btnDeletar && !btnEditar) {
            return;
        }

        const item = alvo.closest('.compromisso-item-view, .compromisso-item');
        if (!item) return;
        const id = Number(item.dataset.id);

        if (btnDeletar) {
            if (confirm('Tem certeza que deseja deletar este compromisso?')) {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                await init();
            }
        }

        if (btnEditar) {
            // !! LOGS DE DIAGNÓSTICO ADICIONADOS AQUI !!
            console.log("Botão EDITAR clicado. Procurando pelo ID:", id, "(tipo:", typeof id, ")");
            const compParaEditar = todosOsCompromissos.find(comp => {
                // Adicionamos um log para cada item que está sendo comparado
                console.log(`Comparando ID do clique (${id}) com ID da lista (${comp.id}) (tipo: ${typeof comp.id})`);
                return comp.id === id;
            });

            if (compParaEditar) {
                console.log("✅ Compromisso encontrado:", compParaEditar);
                console.log("Tentando abrir o modal...");
                document.getElementById('edit-id').value = compParaEditar.id;
                document.getElementById('edit-titulo').value = compParaEditar.titulo;
                document.getElementById('edit-dataInicio').value = compParaEditar.dataInicio;
                document.getElementById('edit-dataFim').value = compParaEditar.dataFim;
                document.getElementById('edit-recorrencia').value = compParaEditar.recorrencia;
                document.getElementById('edit-descricao').value = compParaEditar.descricao;
                document.getElementById('edit-participantes').value = compParaEditar.participantes ? compParaEditar.participantes.join(', ') : '';
                modal.style.display = "block";
                console.log("✅ Modal deveria estar visível.");
            } else {
                console.error("❌ ERRO: Compromisso com ID", id, "não foi encontrado na lista 'todosOsCompromissos'.");
                console.log("Isso pode acontecer se o tipo do ID for diferente (ex: número vs texto). Verifique a comparação acima.");
                console.log("Lista completa de compromissos para depuração:", todosOsCompromissos);
            }
        }
    };

    const salvarEdicao = async (e) => {
        e.preventDefault();
        const id = Number(document.getElementById('edit-id').value);
        const participantesInput = document.getElementById('edit-participantes').value;
        const participantes = participantesInput ? participantesInput.split(',').map(p => p.trim()).filter(p => p) : [];
        const compromissoEditado = {
            titulo: document.getElementById('edit-titulo').value,
            dataInicio: document.getElementById('edit-dataInicio').value,
            dataFim: document.getElementById('edit-dataFim').value || null,
            recorrencia: document.getElementById('edit-recorrencia').value,
            descricao: document.getElementById('edit-descricao').value,
            participantes: participantes
        };
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(compromissoEditado)
        });
        modal.style.display = "none";
        await init();
    };

    if (listaCompromissos) {
        listaCompromissos.addEventListener('click', manipularAcoesCompromisso);
    }
    if (modal) {
        formEdicao.addEventListener('submit', salvarEdicao);
        fecharModal.onclick = () => { modal.style.display = "none"; }
        window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; }}
    }

    if (isPaginaVisualizacao) {
        const btnMesAnterior = document.getElementById('btn-mes-anterior');
        const btnMesProximo = document.getElementById('btn-mes-proximo');
        btnMesAnterior.addEventListener('click', () => {
            dataExibida.setMonth(dataExibida.getMonth() - 1);
            renderizarAgenda();
        });
        btnMesProximo.addEventListener('click', () => {
            dataExibida.setMonth(dataExibida.getMonth() + 1);
            renderizarAgenda();
        });
    } else {
        const adicionarCompromisso = async (e) => {
            e.preventDefault();
            const participantesInput = document.getElementById('participantes').value;
            const participantes = participantesInput ? participantesInput.split(',').map(p => p.trim()).filter(p => p) : [];
            const novoCompromisso = {
                titulo: document.getElementById('titulo').value,
                dataInicio: document.getElementById('dataInicio').value,
                dataFim: document.getElementById('edit-dataFim').value || null,
                recorrencia: document.getElementById('recorrencia').value,
                descricao: document.getElementById('descricao').value,
                participantes: participantes
            };
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoCompromisso)
            });
            formCompromisso.reset();
            await init();
        };
        formCompromisso.addEventListener('submit', adicionarCompromisso);
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', init);
    }
    
    init();
});