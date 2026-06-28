(function () {
    // Verificar se já existe um ID de sessão para este utilizador no browser
    let sessionId = sessionStorage.getItem("tracker_session_id");

    // Se não existir criamos um ID
    if (!sessionId) {
        sessionId = genId();
        sessionStorage.setItem("tracker_session_id", sessionId);
    }

    /**
     * Informação global da página atual:
     * 1) ID da sessão(feito)
     * 2) Título da página(feito)
     * 3) Data e hora de entrada na página(feito)
     * 4) Elemento clicado(feito)
     * 5) Tipo de evento(feito)
     * 6) Data e hora do evento(feito)
     * 7) Tempo até fazer o clique(feito)
     * 8) Coordenadas do clique(feito)
     * 9) Duração na página(feito)
     * 10) Sistema operativo(feito)
     * 11) Browser e Versão(feito)
     */
    const pageData = {
        session_id: sessionId,
        page_title: decodeURI(window.location.pathname.split('/').pop()) || 'index.html',
        time_enter: new Date().toISOString(),
        operative_system: getOS(),
        browser: getBrowser()
    };

    function genId() {
        return 'Sessao_' + Math.random().toString(36).substr(2, 9);
    }

    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes("Edg/")) return "Edge " + ua.split("Edg/")[1].split(" ")[0];
        if (ua.includes("OPR/")) return "Opera " + ua.split("OPR/")[1].split(" ")[0];
        if (ua.includes("Chrome/")) return "Chrome " + ua.split("Chrome/")[1].split(" ")[0];
        if (ua.includes("Firefox/")) return "Firefox " + ua.split("Firefox/")[1].split(" ")[0];
        if (ua.includes("Safari/") && ua.includes("Version/")) return "Safari " + ua.split("Version/")[1].split(" ")[0];
        return "Browser Desconhecido";
    }

    function getOS() {
        const agent = navigator.userAgent;
        if (agent.includes("Windows")) return "Windows";
        if (agent.includes("Mac")) return "MacOS";
        if (agent.includes("Android")) return "Android";
        if (agent.includes("iPad") || agent.includes("iPhone")) return "iOS";
        if (agent.includes("Linux")) return "Linux";
        return "Outro";
    }

    /**
     * @param {string} eventType 
     * @param {object} eventDetails 
     */

    // --- MONGODB BACKEND SETUP ---
    // Em vez de importar o Firebase, definimos a morada do nosso servidor local
    const BACKEND_URL = "http://localhost:3000/api/track";

    async function sendToMongoDB(data) {
        try {
            // O comando 'fetch' atira os dados para o servidor Node.js que criaste
            const response = await fetch(BACKEND_URL, {
                method: "POST", // POST significa "enviar dados"
                headers: {
                    "Content-Type": "application/json" // Avisamos que estamos a enviar JSON
                },
                body: JSON.stringify(data) // Convertemos a informação para texto JSON
            });

            if (response.ok) {
                console.log("Gravado no MongoDB com sucesso (via Backend)!");
            } else {
                console.error("Erro do servidor:", await response.text());
            }
        } catch (error) {
            console.error("Erro ao contactar o servidor local:", error);
        }
    }
    // ==========================================

    // função para registar os eventos
    function regEvent(eventType, eventDetails) {

        const dataAtual = new Date();

        // Construção estrita para garantir a ordem das colunas 
        const eventData = {
            session_id: pageData.session_id,
            page_title: pageData.page_title,
            time_enter: pageData.time_enter,
            event_Type: eventType,
            timestamp: dataAtual.toISOString(),
            click_x: eventDetails.click_x !== undefined ? eventDetails.click_x : "",
            click_y: eventDetails.click_y !== undefined ? eventDetails.click_y : "",
            eventInfo: eventDetails.eventInfo || "",
            eventValue: eventDetails.eventValue || "",
            elementType: eventDetails.elementType || eventDetails.eventType || "",
            operative_system: pageData.operative_system,
            browser: pageData.browser
        };

        console.log("DETETADO:", JSON.stringify(eventData, null, 2));
        sendToMongoDB(eventData); // Envia automaticamente para a base de dados
    }

    // Guarda o elemento clicado, no instante em que é feito o clique
    document.addEventListener('click', function (e) {
        const elementoClicado = e.target;

        // Ignora cliques em dropdowns, o evento 'change' já trata deles
        if (elementoClicado.tagName === 'SELECT' || elementoClicado.tagName === 'OPTION') return;
        let tipoElemento = '';
        const tag = elementoClicado.tagName;
        const tipoInput = elementoClicado.type;

        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            if (tipoInput === 'checkbox' || tipoInput === 'radio') {
                tipoElemento = 'Caixa de Seleção';
            } else {
                tipoElemento = 'Caixa de Texto';
            }
        } else if (tag === 'SELECT') {
            tipoElemento = 'Lista Dropdown';
        } else if (tag === 'IMG' || tag === 'SVG') {
            tipoElemento = 'Imagem / Ícone';
        } else if (tag === 'A') {
            tipoElemento = 'Link de Navegação';
        } else {
            tipoElemento = 'Botão / Área de Clique';
        }

        const label = elementoClicado.closest('[data-label]')?.getAttribute('data-label') || 'Sem label';

        const detalhesClique = {
            eventInfo: label, // Para mostrar a componente que está a ser interagida
            eventValue: (() => {
                // Lógica especial para os smiles
                const labelLimpa = label.toLowerCase();
                if (labelLimpa.includes('smile_negativo')) return '1';
                if (labelLimpa.includes('smile_neutro')) return '2';
                if (labelLimpa.includes('smile_positivo')) return '3';

                // Lógica normal
                const select = elementoClicado.tagName === 'SELECT' ? elementoClicado : elementoClicado.querySelector('select') || elementoClicado.closest('.droplist')?.querySelector('select');
                if (select) return select.options[select.selectedIndex]?.text || '';

                // 1. Tenta ler o texto original
                const textoOriginal = elementoClicado.innerText ? elementoClicado.innerText.substring(0, 50).trim() : '';
                if (textoOriginal !== '') return textoOriginal;

                // 2. Se apanhou vazio, procura no botão inteiro
                const widgetPai = elementoClicado.closest('[data-label]');
                return (widgetPai && widgetPai.innerText) ? widgetPai.innerText.substring(0, 50).trim() : '';
            })(),
            elementType: tipoElemento,
            click_x: e.clientX,
            click_y: e.clientY
        };

        regEvent('click', detalhesClique);
    }, true);

    // Guarda o valor de um input, no instante em que o valor é alterado
    document.addEventListener('change', function (e) {
        const elemInput = e.target;

        if (elemInput.tagName == 'INPUT' || elemInput.tagName == 'SELECT' || elemInput.tagName == 'TEXTAREA') {
            let inputName = elemInput.closest('[data-label]')?.getAttribute('data-label') || elemInput.name || elemInput.id || 'Sem Nome';
            let inputValue = elemInput.value;

            // Para radios e checkboxes, o .value do Axure é inútil
            if (elemInput.type === 'radio' || elemInput.type === 'checkbox') {
                const label = elemInput.closest('label') || elemInput.closest('[data-label]');
                inputValue = label ? label.innerText.trim() : inputValue;
            }

            const inputDetails = {
                eventInfo: inputName,
                eventValue: inputValue,
                eventType: elemInput.type
            };

            regEvent('input_change', inputDetails);
        }
    }, true); //Faltava o true para ativar o listener

})();