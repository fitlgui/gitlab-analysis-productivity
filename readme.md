# 📊 GitLab Engineering Insights

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

Uma ferramenta de auditoria e dashboard de produtividade "Client-Side" para analisar o comportamento, volume e a qualidade das entregas de times de engenharia de software diretamente da API do GitLab.

Desenvolvido com foco em **Engenharia de Software de Alta Performance**, este painel vai além de contar "quem digitou mais linhas", oferecendo métricas reais sobre o ciclo de vida do código.

---

## 🚀 Funcionalidades (Nível Expert)

* **Auto-Paginação da API:** Contorna o limite nativo de 100 resultados do GitLab iterando automaticamente pelos *Headers* de paginação para buscar o histórico completo do período selecionado.
* **Índice de Refatoração (Add vs Del):** Mede a saúde do código separando inserções de deleções. Permite identificar se o time está pagando dívida técnica ou apenas acumulando código.
* **Análise de Padrão de Trabalho:** Lê mensagens de commit usando regex para classificar o esforço da equipe baseado no padrão *Conventional Commits* (`feat`, `fix`, `chore`, `refactor`).
* **Frequência Semanal:** Mapeia os dias de maior integração, facilitando a identificação de *burnout* (ex: excesso de commits em finais de semana).
* **Throughput Real (Código / Dia):** Calcula a média de linhas entregues com base no "tempo de vida" exato do desenvolvedor no projeto (diferença entre o primeiro e o último commit no período analisado).
* **Onboarding Inteligente:** Modal de instruções inicial com estado persistido via `localStorage`.

---

## 🛠 Tecnologias Utilizadas

A arquitetura foi pensada para ser **Zero-Setup** (não exige Node.js, NPM ou servidores para rodar).

* **HTML5 & CSS3**
* **Vanilla JavaScript (ES6+)**: Uso nativo de `async/await`, `Fetch API`, manipulação de Objetos e Arrays.
* **Tailwind CSS (via CDN)**: Para um design system moderno, limpo e responsivo.
* **Chart.js (v3)**: Para a renderização robusta de gráficos em Canvas.

---

## 🔒 Segurança e Privacidade

**Segurança em Primeiro Lugar:** Esta aplicação é 100% *Client-Side* (roda exclusivamente no seu navegador). 
Nenhum **Private Token** ou dado de repositório é enviado para servidores de terceiros ou armazenado em banco de dados. A comunicação ocorre diretamente entre o seu navegador e a API pública do GitLab (`https://gitlab.com/api/v4/...`).

---

## 📖 Como Utilizar

1. **Clone ou baixe** este arquivo `index.html`.
2. **Abra o arquivo** diretamente no seu navegador web preferido (Chrome, Firefox, Edge, Safari).
3. Siga as instruções do pop-up inicial para obter as credenciais:
   * **Token GitLab:** Gere um Personal Access Token com as permissões `api` e `read_repository`.
   * **Project ID:** Copie o ID numérico do seu projeto (encontrado na página inicial do repositório no GitLab).
4. Insira os dados no painel superior, defina o período em meses e clique em **Extrair & Analisar**.

---

## 🧠 Entendendo as Métricas

Este dashboard foi projetado para Tech Leads e Engenheiros. Aqui está como ler os dados:

* **Índice de Refatoração:** Calculado por `(Deleções / Total de Alterações) * 100`. 
    * *< 10% (Vermelho):* Sinal de alerta. O desenvolvedor está apenas adicionando código, o que pode aumentar a complexidade ciclomática.
    * *> 30% (Verde):* Saudável. O desenvolvedor refatora, limpa e otimiza o código enquanto programa.
* **Padrão de Trabalho:**
    * `Feat`: Foco em entrega de valor e novas regras de negócio.
    * `Fix`: Esforço gasto apagando incêndios ou corrigindo bugs.
    * `Chore`: Tempo investido em configurações, bibliotecas e manutenção.
* **Média (L/Dia):** Não é dividida por 30 dias corridos, mas sim pelo intervalo real (em dias) do primeiro ao último commit do desenvolvedor no recorte de tempo, trazendo uma métrica de cadência mais justa.

---

## 🔮 Roadmap / Próximos Passos

- [ ] Geração de exportação de dados em `.csv` ou `.pdf`.

---
*Desenvolvido com foco em código que resolvesse um único problema, sem exageros.*