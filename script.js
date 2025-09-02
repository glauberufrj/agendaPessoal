document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api/compromissos';

    let todosOsCompromissos = []; 
    let dataExibida = new Date(); 

    const listaCompromissos = document.getElementById('lista-compromissos');
    const btnAtualizar = document.getElementById('btn-atualizar');
    
    const formCompromisso = document.getElementById('form-compromisso');
    const isPaginaVisualizacao = !formCompromisso;

    const modal = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const fecharModal = document.getElementsByClassName('fechar-modal')[0];

    const configCalendario = {
        enableTime: true,        // Permite a seleção de hora
        dateFormat: "Y-m-d H:i", // Formato que o banco de dados entende
        time_24hr: true,         // Formato 24h
        locale: "pt"             // Usa a tradução para português que importamos
    };

    // Aplica a configuração aos campos de data no formulário de ADIÇÃO
    if (formCompromisso) {
        flatpickr("#dataInicio", configCalendario);
        flatpickr("#dataFim", configCalendario);
    }
    // Aplica a configuração aos campos de data no formulário de EDIÇÃO (modal)
    if (modal) {
        flatpickr("#edit-dataInicio", configCalendario);
        flatpickr("#edit-dataFim", configCalendario);
    }
    // --- FIM DO BLOCO A SER ADICIONADO ---

    const init = async () => {
        // Na página de cadastro, não precisamos mais buscar todos os compromissos
        if (isPaginaVisualizacao) {
            todosOsCompromissos = await getCompromissosDaAPI();
        }
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
    
    const renderizarAgenda = () => {
        if (isPaginaVisualizacao) {
            if (!listaCompromissos) return;
            listaCompromissos.innerHTML = '';
            renderizarAgendaPaginada();
        }
        // Na página de cadastro, esta função não faz mais nada
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

    // --- FUNÇÕES DE AÇÃO E EVENTOS (Agora só se aplicam à página de visualização) ---

    if (isPaginaVisualizacao) {
        const manipularAcoesCompromisso = async (e) => {
            const alvo = e.target;
            const btnDeletar = alvo.closest('.btn-deletar');
            const btnEditar = alvo.closest('.btn-editar');
            if (!btnDeletar && !btnEditar) return;
            const item = alvo.closest('.compromisso-item-view');
            if (!item) return;
            const id = Number(item.dataset.id);

            if (btnDeletar) {
                if (confirm('Tem certeza que deseja deletar este compromisso?')) {
                    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    await init();
                }
            }
            if (btnEditar) {
                const compParaEditar = todosOsCompromissos.find(comp => Number(comp.id) === id);
                if (compParaEditar) {
                    document.getElementById('edit-id').value = compParaEditar.id;
                    document.getElementById('edit-titulo').value = compParaEditar.titulo;
                    document.getElementById('edit-dataInicio').value = compParaEditar.dataInicio;
                    document.getElementById('edit-dataFim').value = compParaEditar.dataFim;
                    document.getElementById('edit-recorrencia').value = compParaEditar.recorrencia;
                    document.getElementById('edit-descricao').value = compParaEditar.descricao;
                    document.getElementById('edit-participantes').value = compParaEditar.participantes ? compParaEditar.participantes.join(', ') : '';
                    modal.style.display = "block";
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
    } else { // Lógica da página de Adicionar (index.html)
        const adicionarCompromisso = async (e) => {
            e.preventDefault();
            const participantesInput = document.getElementById('participantes').value;
            const participantes = participantesInput ? participantesInput.split(',').map(p => p.trim()).filter(p => p) : [];
            const novoCompromisso = {
                titulo: document.getElementById('titulo').value,
                dataInicio: document.getElementById('dataInicio').value,
                dataFim: document.getElementById('dataFim').value || null,
                recorrencia: document.getElementById('recorrencia').value,
                descricao: document.getElementById('descricao').value,
                participantes: participantes
            };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoCompromisso)
            });

            if (response.ok) {
                alert('Compromisso adicionado com sucesso!');
                formCompromisso.reset();
            } else {
                alert('Ocorreu um erro ao adicionar o compromisso.');
            }
        };
        formCompromisso.addEventListener('submit', adicionarCompromisso);
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', init);
    }
    
    init();
});