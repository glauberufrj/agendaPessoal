document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api/compromissos';
    let todosOsCompromissos = []; 
    let dataExibida = new Date(); 

    const listaCompromissos = document.getElementById('lista-compromissos');
    const formCompromisso = document.getElementById('form-compromisso');
    const isPaginaVisualizacao = !formCompromisso;
    
    const modal = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const fecharModal = document.getElementsByClassName('fechar-modal')[0];

    const init = async () => {
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
            renderizarAgendaPaginada();
        }
    };

    const renderizarProximoEvento = () => {
        const proximoEventoContainer = document.getElementById('proximo-evento-container');
        if (!proximoEventoContainer) return;

        const agora = new Date();
        const eventosFuturos = todosOsCompromissos
            .filter(comp => new Date(comp.dataInicio) > agora)
            .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

        if (eventosFuturos.length > 0) {
            const proximoEvento = eventosFuturos[0];
            const data = new Date(proximoEvento.dataInicio);
            const dataFormatada = data.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
            
            proximoEventoContainer.innerHTML = `
                <h3>Próximo Evento</h3>
                <p><strong>${proximoEvento.titulo}</strong></p>
                <small>${dataFormatada}</small>
            `;
        } else {
            proximoEventoContainer.innerHTML = `<h3>Nenhum evento futuro agendado.</h3>`;
        }
    };

    const renderizarAgendaPaginada = () => {
        renderizarProximoEvento();
        
        const mesAnoTitulo = document.getElementById('mes-ano-exibido');
        mesAnoTitulo.textContent = dataExibida.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const compromissosDoMes = todosOsCompromissos.filter(comp => {
            const dataComp = new Date(comp.dataInicio);
            return dataComp.getMonth() === dataExibida.getMonth() && dataComp.getFullYear() === dataExibida.getFullYear();
        }).sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

        listaCompromissos.innerHTML = '';
        if (compromissosDoMes.length === 0) {
            listaCompromissos.innerHTML = '<li>Nenhum compromisso para este mês.</li>';
            return;
        }

        compromissosDoMes.forEach(comp => {
            const item = document.createElement('li');
            item.className = 'compromisso-item-view';
            item.dataset.id = comp.id;
            const data = new Date(comp.dataInicio);
            const diaNumero = data.getDate();
            const diaSemana = data.toLocaleString('pt-BR', { weekday: 'long' });

            let participantesHTML = comp.participantes && comp.participantes.length > 0 ? `<div class="participantes-container">${comp.participantes.map(p => `<span class="participante-tag">${p}</span>`).join('')}</div>` : '';
            const acoesHTML = `<div class="compromisso-acoes"><button class="btn-editar">Editar</button><button class="btn-deletar">Deletar</button></div>`;

            item.innerHTML = `
                <div class="compromisso-dia">
                    <span class="dia-numero">${diaNumero}</span>
                    <span class="dia-semana">${diaSemana}</span>
                </div>
                <div class="compromisso-detalhes">
                    <strong>${comp.titulo}</strong>
                    <small>${data.toLocaleTimeString('pt-BR', {timeStyle: 'short'})}</small>
                    ${participantesHTML}
                </div>
                ${acoesHTML}
            `;
            listaCompromissos.appendChild(item);
        });
    };

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
                if (confirm('Tem certeza?')) {
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
    } else { 
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
    
    // Inicialização dos calendários Flatpickr
    const configCalendario = {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        locale: "pt"
    };

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        configCalendario.theme = "dark";
    }

    if (formCompromisso) {
        flatpickr("#dataInicio", configCalendario);
        flatpickr("#dataFim", configCalendario);
    }
    if (modal) {
        flatpickr("#edit-dataInicio", configCalendario);
        flatpickr("#edit-dataFim", configCalendario);
    }
    
    init();
});