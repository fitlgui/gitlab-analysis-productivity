// --- 1. LÓGICA DO MODAL DE ONBOARDING ---
document.addEventListener("DOMContentLoaded", () => {
    localStorage.clear(); // Limpa o localStorage para testes frequentes do modal (remover em produção)
    const modalSeen = localStorage.getItem('gitlabDashboardModalSeen');
    if (!modalSeen) {
        document.getElementById('instructionsModal').classList.remove('hidden');
    }
});

function closeModal() {
    document.getElementById('instructionsModal').classList.add('hidden');
    localStorage.setItem('gitlabDashboardModalSeen', 'true');
}

// Variáveis Globais para os Gráficos
let chartCommitsInstance = null;
let chartLinesInstance = null;
let chartTypesInstance = null;
let chartDaysInstance = null;

// --- 2. COMUNICAÇÃO COM API DO GITLAB (PAGINAÇÃO) ---
async function fetchAllCommits(projectId, token, since, until) {
    let allCommits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits?since=${since}&until=${until}&per_page=100&page=${page}&with_stats=true`;
        try {
            const response = await fetch(url, { headers: { 'PRIVATE-TOKEN': token } });

            if (!response.ok) {
                if (response.status === 401) throw new Error("Acesso Negado: Verifique seu Token de Acesso.");
                if (response.status === 404) throw new Error("Projeto não encontrado ou você não tem permissão.");
                throw new Error(`Erro na API do GitLab: Status ${response.status}`);
            }

            const data = await response.json();

            if (data.length === 0) {
                hasMore = false;
            } else {
                allCommits = allCommits.concat(data);
                page++;
                const nextPage = response.headers.get('x-next-page');
                if (!nextPage) hasMore = false; // Se não tem header de próxima página, finaliza
            }
        } catch (error) {
            throw error;
        }
    }
    return allCommits;
}

// --- 3. PROCESSAMENTO E REGRAS DE NEGÓCIO ---
function processData(commits) {
    const authorData = {};
    const globalStats = {
        commits: 0, additions: 0, deletions: 0,
        types: { feat: 0, fix: 0, chore: 0, outros: 0 },
        daysOfWeek: [0, 0, 0, 0, 0, 0, 0] // Posições de 0 (Domingo) a 6 (Sábado)
    };

    commits.forEach(commit => {
        const author = commit.author_name;
        const commitDate = new Date(commit.created_at);
        const dayOfWeek = commitDate.getDay();

        // Identifica padrão de desenvolvimento baseado no Conventional Commits
        const msg = commit.title.toLowerCase();
        let type = 'outros';
        if (msg.startsWith('feat')) type = 'feat';
        else if (msg.startsWith('fix') || msg.startsWith('hotfix')) type = 'fix';
        else if (msg.match(/^(chore|refactor|style|docs|test)/)) type = 'chore';

        if (!authorData[author]) {
            authorData[author] = {
                name: author, commits: 0, additions: 0, deletions: 0,
                types: { feat: 0, fix: 0, chore: 0, outros: 0 },
                firstCommit: commitDate, lastCommit: commitDate
            };
        }

        // Ajusta datas limite para cálculo de tempo na plataforma
        if (commitDate < authorData[author].firstCommit) authorData[author].firstCommit = commitDate;
        if (commitDate > authorData[author].lastCommit) authorData[author].lastCommit = commitDate;

        // Consolida dados
        authorData[author].commits += 1;
        authorData[author].types[type] += 1;
        globalStats.commits += 1;
        globalStats.types[type] += 1;
        globalStats.daysOfWeek[dayOfWeek] += 1;

        const add = (commit.stats && commit.stats.additions) || 0;
        const del = (commit.stats && commit.stats.deletions) || 0;

        authorData[author].additions += add;
        authorData[author].deletions += del;
        globalStats.additions += add;
        globalStats.deletions += del;
    });

    // Estruturação final com os cálculos complexos
    const authorsArray = Object.values(authorData).map(author => {
        const diffTime = Math.abs(author.lastCommit - author.firstCommit);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 inclui o dia atual
        const totalLines = author.additions + author.deletions;
        const refactorRatio = totalLines > 0 ? ((author.deletions / totalLines) * 100).toFixed(1) : 0;

        return {
            ...author,
            totalLines,
            totalDays: diffDays,
            refactorRatio: parseFloat(refactorRatio),
            linesPerDay: diffDays > 0 ? Math.round(totalLines / diffDays) : 0
        };
    }).sort((a, b) => b.linesPerDay - a.linesPerDay); // Ordena quem coda mais por dia

    return { authors: authorsArray, global: globalStats };
}

// --- 4. RENDERIZAÇÃO DA VIEW ---
function renderSummary(global, totalDevs) {
    const div = document.getElementById('summaryCards');
    const totalLines = global.additions + global.deletions;
    const refactorHealth = totalLines > 0 ? ((global.deletions / totalLines) * 100).toFixed(1) : 0;

    div.innerHTML = `
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Commits</p>
                    <p class="text-3xl font-black text-gray-800">${global.commits}</p>
                </div>
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Taxa de Refatoração</p>
                    <p class="text-3xl font-black text-purple-600">${refactorHealth}%</p>
                    <p class="text-[10px] text-gray-400 mt-1">Deleções / Total Mudanças</p>
                </div>
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Linhas Modificadas</p>
                    <p class="text-3xl font-black text-blue-600">${totalLines.toLocaleString('pt-BR')}</p>
                    <p class="text-[10px] text-green-500 font-bold mt-1">+${global.additions.toLocaleString('pt-BR')} / <span class="text-red-500">-${global.deletions.toLocaleString('pt-BR')}</span></p>
                </div>
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Devs Ativos</p>
                    <p class="text-3xl font-black text-gray-800">${totalDevs}</p>
                </div>
            `;
}

function renderTable(authors) {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';

    authors.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50/50 transition-colors";

        let refactorColor = a.refactorRatio >= 30 ? 'text-green-600 font-bold' : (a.refactorRatio <= 10 ? 'text-red-500' : 'text-gray-600');

        tr.innerHTML = `
                    <td class="px-6 py-3 font-semibold text-gray-900">${a.name}</td>
                    <td class="px-6 py-3 text-center"><span class="bg-gray-100 text-gray-700 py-1 px-3 rounded-md text-xs font-bold border border-gray-200">${a.commits}</span></td>
                    <td class="px-6 py-3 text-center text-xs">
                        <span class="text-blue-600 font-bold" title="Features">${a.types.feat}</span> / 
                        <span class="text-red-500 font-bold" title="Fixes">${a.types.fix}</span> / 
                        <span class="text-gray-500 font-bold" title="Chores/Refactors">${a.types.chore}</span>
                    </td>
                    <td class="px-6 py-3 text-center font-mono text-green-600 text-xs">+${a.additions.toLocaleString('pt-BR')}</td>
                    <td class="px-6 py-3 text-center font-mono text-red-500 text-xs">-${a.deletions.toLocaleString('pt-BR')}</td>
                    <td class="px-6 py-3 text-center ${refactorColor}">${a.refactorRatio}%</td>
                    <td class="px-6 py-3 text-right font-black text-[#e24329] bg-orange-50/30">${a.linesPerDay} <span class="text-[10px] font-normal text-gray-400">/dia</span></td>
                `;
        tbody.appendChild(tr);
    });
}

function renderCharts(authors, global) {
    // Destroi instâncias antigas para evitar sobreposição ao buscar novamente
    if (chartCommitsInstance) chartCommitsInstance.destroy();
    if (chartLinesInstance) chartLinesInstance.destroy();
    if (chartTypesInstance) chartTypesInstance.destroy();
    if (chartDaysInstance) chartDaysInstance.destroy();

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6b7280';

    const labels = authors.map(a => a.name);
    const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    // Gráfico 1: Commits Chart
    chartCommitsInstance = new Chart(document.getElementById('commitsChart'), {
        type: 'bar',
        data: { labels, datasets: [{ data: authors.map(a => a.commits), backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: { ...commonOptions, scales: { y: { grid: { borderDash: [4, 4] } }, x: { grid: { display: false } } } }
    });

    // Gráfico 2: Lines Chart (Stacked)
    chartLinesInstance = new Chart(document.getElementById('linesChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Adições', data: authors.map(a => a.additions), backgroundColor: '#10b981', borderRadius: 2 },
                { label: 'Deleções', data: authors.map(a => a.deletions), backgroundColor: '#ef4444', borderRadius: 2 }
            ]
        },
        options: { ...commonOptions, plugins: { legend: { display: true, position: 'bottom' } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { borderDash: [4, 4] } } } }
    });

    // Gráfico 3: Types Chart (Doughnut)
    chartTypesInstance = new Chart(document.getElementById('typesChart'), {
        type: 'doughnut',
        data: {
            labels: ['Feat (Novas Funcionalidades)', 'Fix (Correções)', 'Chore/Refactor (Manutenção)', 'Outros'],
            datasets: [{
                data: [global.types.feat, global.types.fix, global.types.chore, global.types.outros],
                backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6', '#9ca3af'],
                borderWidth: 0, hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }, cutout: '70%' }
    });

    // Gráfico 4: Days of Week Chart
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    chartDaysInstance = new Chart(document.getElementById('daysChart'), {
        type: 'line',
        data: {
            labels: diasSemana,
            datasets: [{
                data: global.daysOfWeek,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#f97316',
                pointRadius: 4
            }]
        },
        options: { ...commonOptions, scales: { y: { beginAtZero: true, grid: { borderDash: [4, 4] } }, x: { grid: { display: false } } } }
    });
}

// --- 5. FUNÇÃO PRINCIPAL (CONTROLLER) ---
async function gerarDashboard() {
    const token = document.getElementById('apiToken').value.trim();
    const projectId = document.getElementById('projectId').value.trim();
    const months = parseInt(document.getElementById('monthsAgo').value);

    if (!token || !projectId) {
        return alert("⚠️ Por favor, preencha o Token de Acesso e o Project ID.");
    }

    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - months);

    const loadingEl = document.getElementById('loading');
    const dashboardEl = document.getElementById('dashboardContent');

    // Gerencia os estados visuais
    loadingEl.classList.remove('hidden');
    dashboardEl.classList.add('hidden');

    try {
        // Dispara requisições
        const allCommits = await fetchAllCommits(projectId, token, dataInicio.toISOString(), hoje.toISOString());

        if (allCommits.length === 0) {
            alert("Nenhum commit encontrado neste período para este projeto.");
            loadingEl.classList.add('hidden');
            return;
        }

        // Computa lógica pesada
        const processed = processData(allCommits);

        // Pinta os componentes em tela
        renderSummary(processed.global, processed.authors.length);
        renderCharts(processed.authors, processed.global);
        renderTable(processed.authors);

        // Exibe tudo pronto
        loadingEl.classList.add('hidden');
        dashboardEl.classList.remove('hidden');

    } catch (error) {
        console.error("Erro na execução:", error);
        alert(error.message);
        loadingEl.classList.add('hidden');
    }
}