document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api/compromissos';

    let todosOsCompromissos = []; 
    let dataExibida = new Date(); 
    dataExibida.setDate(dataExibida.getDate() - dataExibida.getDay());
    dataExibida.setHours(0, 0, 0, 0);

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
            const data = await response.json();
            return data.map(item => ({ ...item, id: Number(item.id) }));
        } catch (error) { 
            console.error(error); 
            return []; 
        }
    };
    
    const renderizarAgenda = () => {
        if (isPaginaVisualizacao) {
            if (!listaCompromissos) return;
            renderizarAgendaSemanal();
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

    const renderizarAgendaSemanal = () => {
        renderizarProximoEvento();
        
        const mesAnoTitulo = document.getElementById('mes-ano-exibido');
        const semanaInicio = new Date(dataExibida);
        const semanaFim = new Date(dataExibida);
        semanaFim.setDate(semanaFim.getDate() + 6);
        mesAnoTitulo.textContent = `Semana de ${semanaInicio.getDate()}/${semanaInicio.getMonth() + 1} a ${semanaFim.getDate()}/${semanaFim.getMonth() + 1}`;

        const eventosDaSemana = gerarEventosDaSemana(semanaInicio);

        listaCompromissos.innerHTML = '';
        const diasDaSemanaNomes = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

        for (let i = 0; i < 7; i++) {
            const diaAtual = new Date(semanaInicio);
            diaAtual.setDate(diaAtual.getDate() + i);
            const eventosDoDia = eventosDaSemana.filter(e => new Date(e.dataInicio).getDay() === i);
            
            const diaContainer = document.createElement('div');
            diaContainer.className = 'dia-da-semana-container';
            
            let eventosHTML = '';
            if (eventosDoDia.length > 0) {
                eventosDoDia.sort((a,b) => new Date(a.dataInicio) - new Date(b.dataInicio));
                eventosDoDia.forEach(comp => {
                    let participantesHTML = comp.participantes && comp.participantes.length > 0 ? `<div class="participantes-container">${comp.participantes.map(p => `<span class="participante-tag">${p}</span>`).join('')}</div>` : '';
                    const idParaAcao = comp.originalId || comp.id;
                    const acoesHTML = `<div class="compromisso-acoes"><button class="btn-editar">Editar</button><button class="btn-deletar">Deletar</button></div>`;
                    
                    eventosHTML += `
                        <li class="compromisso-item-semanal" data-id="${idParaAcao}">
                            <div class="compromisso-detalhes">
                                <strong>${comp.titulo}</strong>
                                <small>${new Date(comp.dataInicio).toLocaleTimeString('pt-BR', {timeStyle: 'short'})}</small>
                                ${participantesHTML}
                            </div>
                            ${acoesHTML}
                        </li>
                    `;
                });
            } else {
                eventosHTML = '<li class="sem-compromissos">Nenhum compromisso</li>';
            }

            diaContainer.innerHTML = `
                <h3>${diasDaSemanaNomes[i]} <span class="data-dia">${diaAtual.getDate()}/${diaAtual.getMonth() + 1}</span></h3>
                <ul class="lista-dia">${eventosHTML}</ul>
            `;
            listaCompromissos.appendChild(diaContainer);
        }
    };

    const gerarEventosDaSemana = (inicioDaSemana) => {
        const fimDaSemana = new Date(inicioDaSemana);
        fimDaSemana.setDate(fimDaSemana.getDate() + 7);
        let eventos = [];

        todosOsCompromissos.forEach(comp => {
            const dataInicioOriginal = new Date(comp.dataInicio);
            
            if (comp.recorrencia === 'nenhuma' && dataInicioOriginal >= inicioDaSemana && dataInicioOriginal < fimDaSemana) {
                eventos.push({ ...comp });
            }
            
            if (comp.recorrencia === 'semanal') {
                const dataFimRecorrencia = comp.data_fim_recorrencia ? new Date(comp.data_fim_recorrencia) : null;
                const diaDaSemanaDoEvento = parseInt(comp.dia_da_semana);
                
                const dataOcorrencia = new Date(inicioDaSemana);
                dataOcorrencia.setDate(inicioDaSemana.getDate() + diaDaSemanaDoEvento);
                dataOcorrencia.setHours(dataInicioOriginal.getHours(), dataInicioOriginal.getMinutes(), dataInicioOriginal.getSeconds());

                if (dataOcorrencia >= inicioDaSemana && dataOcorrencia < fimDaSemana && dataOcorrencia >= dataInicioOriginal && (!dataFimRecorrencia || dataOcorrencia <= dataFimRecorrencia)) {
                    eventos.push({ ...comp, originalId: comp.id, dataInicio: dataOcorrencia.toISOString() });
                }
            }
        });
        return eventos;
    };
    
    const toggleRecorrencia = (selectElement, containerElement) => {
        if (selectElement.value === 'semanal') {
            containerElement.style.display = 'block';
        } else {
            containerElement.style.display = 'none';
        }
    };

    if (isPaginaVisualizacao) {
        const manipularAcoesCompromisso = async (e) => {
            const alvo = e.target;
            const btnDeletar = alvo.closest('.btn-deletar');
            const btnEditar = alvo.closest('.btn-editar');
            if (!btnDeletar && !btnEditar) return;
            const item = alvo.closest('.compromisso-item-semanal');
            if (!item) return;
            const id = Number(item.dataset.id);

            if (btnDeletar) {
                if (confirm('Deletar um evento recorrente irá remover todas as suas futuras ocorrências. Deseja continuar?')) {
                    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    await init();
                }
            }
            if (btnEditar) {
                const compParaEditar = todosOsCompromissos.find(comp => comp.id === id);
                if (compParaEditar) {
                    const recorrenciaSelect = document.getElementById('edit-recorrencia');
                    const opcoesRecorrencia = document.getElementById('edit-opcoes-recorrencia');
                    
                    document.getElementById('edit-id').value = compParaEditar.id;
                    document.getElementById('edit-titulo').value = compParaEditar.titulo;
                    document.getElementById('edit-dataInicio').value = compParaEditar.dataInicio.slice(0, 16);
                    document.getElementById('edit-dataFim').value = compParaEditar.dataFim ? compParaEditar.dataFim.slice(0, 16) : '';
                    recorrenciaSelect.value = compParaEditar.recorrencia || 'nenhuma';
                    document.getElementById('edit-descricao').value = compParaEditar.descricao;
                    document.getElementById('edit-participantes').value = compParaEditar.participantes ? compParaEditar.participantes.join(', ') : '';
                    document.getElementById('edit-dia_da_semana').value = compParaEditar.dia_da_semana || '1';
                    document.getElementById('edit-data_fim_recorrencia').value = compParaEditar.data_fim_recorrencia ? compParaEditar.data_fim_recorrencia.slice(0, 10) : '';
                    
                    toggleRecorrencia(recorrenciaSelect, opcoesRecorrencia);
                    modal.style.display = "block";
                }
            }
        };

        const salvarEdicao = async (e) => {
            e.preventDefault();
            const id = Number(document.getElementById('edit-id').value);
            const recorrencia = document.getElementById('edit-recorrencia').value;
            const participantesInput = document.getElementById('edit-participantes').value;
            const participantes = participantesInput ? participantesInput.split(',').map(p => p.trim()).filter(p => p) : [];

            // --- CORREÇÃO DE FUSO HORÁRIO APLICADA AQUI ---
            const dataInicioValue = document.getElementById('edit-dataInicio').value;
            const dataFimValue = document.getElementById('edit-dataFim').value;
            const dataFimRecorrenciaValue = document.getElementById('edit-data_fim_recorrencia').value;

            const compromissoEditado = {
                titulo: document.getElementById('edit-titulo').value,
                dataInicio: dataInicioValue ? new Date(dataInicioValue).toISOString() : null,
                dataFim: dataFimValue ? new Date(dataFimValue).toISOString() : null,
                recorrencia: recorrencia,
                descricao: document.getElementById('edit-descricao').value,
                participantes: participantes,
                dia_da_semana: recorrencia === 'semanal' ? document.getElementById('edit-dia_da_semana').value : null,
                data_fim_recorrencia: recorrencia === 'semanal' && dataFimRecorrenciaValue ? new Date(dataFimRecorrenciaValue).toISOString() : null
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
            const recorrenciaSelect = document.getElementById('edit-recorrencia');
            const opcoesRecorrencia = document.getElementById('edit-opcoes-recorrencia');
            recorrenciaSelect.addEventListener('change', () => toggleRecorrencia(recorrenciaSelect, opcoesRecorrencia));
            formEdicao.addEventListener('submit', salvarEdicao);
            fecharModal.onclick = () => { modal.style.display = "none"; }
            window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; }}
        }
        
        const btnMesAnterior = document.getElementById('btn-mes-anterior');
        const btnMesProximo = document.getElementById('btn-mes-proximo');
        btnMesAnterior.addEventListener('click', () => {
            dataExibida.setDate(dataExibida.getDate() - 7);
            renderizarAgenda();
        });
        btnMesProximo.addEventListener('click', () => {
            dataExibida.setDate(dataExibida.getDate() + 7);
            renderizarAgenda();
        });
    } else { 
        const recorrenciaSelect = document.getElementById('recorrencia');
        const opcoesRecorrencia = document.getElementById('opcoes-recorrencia');
        recorrenciaSelect.addEventListener('change', () => toggleRecorrencia(recorrenciaSelect, opcoesRecorrencia));
        
        const adicionarCompromisso = async (e) => {
            e.preventDefault();
            const recorrencia = document.getElementById('recorrencia').value;
            const participantesInput = document.getElementById('participantes').value;
            const participantes = participantesInput ? participantesInput.split(',').map(p => p.trim()).filter(p => p) : [];

            // --- CORREÇÃO DE FUSO HORÁRIO APLICADA AQUI ---
            const dataInicioValue = document.getElementById('dataInicio').value;
            const dataFimValue = document.getElementById('dataFim').value;
            const dataFimRecorrenciaValue = document.getElementById('data_fim_recorrencia').value;

            const novoCompromisso = {
                titulo: document.getElementById('titulo').value,
                dataInicio: dataInicioValue ? new Date(dataInicioValue).toISOString() : null,
                dataFim: dataFimValue ? new Date(dataFimValue).toISOString() : null,
                recorrencia: recorrencia,
                descricao: document.getElementById('descricao').value,
                participantes: participantes,
                dia_da_semana: recorrencia === 'semanal' ? document.getElementById('dia_da_semana').value : null,
                data_fim_recorrencia: recorrencia === 'semanal' && dataFimRecorrenciaValue ? new Date(dataFimRecorrenciaValue).toISOString() : null
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoCompromisso)
            });
            if (response.ok) {
                alert('Compromisso adicionado com sucesso!');
                formCompromisso.reset();
                toggleRecorrencia(recorrenciaSelect, opcoesRecorrencia);
            } else {
                alert('Ocorreu um erro ao adicionar o compromisso.');
            }
        };
        formCompromisso.addEventListener('submit', adicionarCompromisso);
    }
    
    // Inicialização dos calendários Flatpickr
    const configCalendarioHora = { enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true, locale: "pt" };
    const configCalendarioDia = { dateFormat: "Y-m-d", locale: "pt" };

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        configCalendarioHora.theme = "dark";
        configCalendarioDia.theme = "dark";
    }

    if (formCompromisso) {
        flatpickr("#dataInicio", configCalendarioHora);
        flatpickr("#dataFim", configCalendarioHora);
        flatpickr("#data_fim_recorrencia", configCalendarioDia);
    }
    if (modal) {
        flatpickr("#edit-dataInicio", configCalendarioHora);
        flatpickr("#edit-dataFim", configCalendarioHora);
        flatpickr("#edit-data_fim_recorrencia", configCalendarioDia);
    }
    
    init();
});