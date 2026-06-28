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

    // --- FIREBASE SETUP ---
    let firebaseInitialized = false;

    // --- QUEUE SYSTEM ---
    function getQueue() {
        try {
            const queueStr = sessionStorage.getItem("tracker_event_queue");
            return queueStr ? JSON.parse(queueStr) : [];
        } catch (e) {
            return [];
        }
    }

    function saveQueue(queue) {
        try {
            sessionStorage.setItem("tracker_event_queue", JSON.stringify(queue));
        } catch (e) {
            console.error("Erro ao gravar fila no sessionStorage:", e);
        }
    }

    let isFlushing = false;

    async function flushQueue() {
        if (!firebaseInitialized || isFlushing) return;
        isFlushing = true;

        let queue = getQueue();
        if (queue.length === 0) {
            isFlushing = false;
            return;
        }

        const { collection, addDoc, db } = window.firebaseDB;

        while (queue.length > 0) {
            const eventData = queue[0];
            try {
                await addDoc(collection(db, "interactions"), eventData);
                console.log("Gravado no Firebase:", eventData.eventInfo, eventData.event_Type);
                queue.shift();
                saveQueue(queue);
            } catch (error) {
                console.error("Erro ao gravar no Firebase, mantendo na fila:", error);
                break;
            }
        }

        isFlushing = false;
    }

    (async function initFirebase() {
        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
            const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

            const firebaseConfig = {
                apiKey: "SUBSTITUIR_API_KEY",
                authDomain: "SUBSTITUIR_PAUTH_DOMAIN",
                projectId: "SUBSTITUIR_PROJECT_ID",
                storageBucket: "SUBSTITUIR_STORAGE_BUCKET",
                messagingSenderId: "SUBSTITUIR_MESSAGING_SENDER_ID",
                appId: "SUBSTITUIR_APP_ID"
            };

            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);

            window.firebaseDB = { collection, addDoc, db };
            firebaseInitialized = true;

            console.log("Firebase Tracker Inicializado!");

            // Envia quaisquer logs pendentes na fila local
            flushQueue();
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
        }
    })();
    // ----------------------

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
        
        // Adiciona à fila local no sessionStorage
        const queue = getQueue();
        queue.push(eventData);
        saveQueue(queue);

        // Tenta enviar de imediato
        flushQueue();
    }

    function findCustomDataLabel(element) {
        if (!element) return null;
        // Padrão de nomes de labels genéricos do Axure
        const genericPattern = /^(Ellipse \d+|Rectangle\d*|Paragraph\d*|Shape\d*|Image\d*|Text\s*field\d*|Droplist\d*|Checkbox\d*|Radio\s*button\d*|Group \d+|Unnamed\s*\w*|home-icon-silhouette.*|audio-speaker-on.*|sound-off.*|State \d+|Estado \d+|back\s*\d*)$/i;
        let curr = element;
        while (curr) {
            const labelAttr = curr.getAttribute && curr.getAttribute('data-label');
            if (labelAttr) {
                if (!genericPattern.test(labelAttr.trim())) {
                    return labelAttr; // Encontrámos uma label personalizada!
                }
            }
            curr = curr.parentElement;
        }
        return null;
    }

    let draggedElem = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartRect = null;
    let isDragging = false;
    let ignorarProximoClique = false;

    // Guarda o elemento clicado, no instante em que é feito o clique
    document.addEventListener('click', function (e) {
        if (ignorarProximoClique) {
            ignorarProximoClique = false;
            return;
        }
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

        // Subir na hierarquia para encontrar a primeira label personalizada (não genérica)
        let label = findCustomDataLabel(elementoClicado);
        if (!label) {
            label = elementoClicado.closest('[data-label]')?.getAttribute('data-label') || 'Sem label';
        }

        const detalhesClique = {
            eventInfo: label, // Para mostrar a componente que está a ser interagida
            eventValue: (() => {
                // Lógica especial para os smiles
                const labelLimpa = label.toLowerCase();
                if (labelLimpa.includes('negativo')) return '1';
                if (labelLimpa.includes('neutro')) return '2';
                if (labelLimpa.includes('positivo')) return '3';

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
            let inputName = findCustomDataLabel(elemInput);
            if (!inputName) {
                inputName = elemInput.closest('[data-label]')?.getAttribute('data-label') || elemInput.name || elemInput.id || 'Sem Nome';
            }
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

    document.addEventListener('mousedown', function (e) {
        const elemDrag = e.target;
        const drag = elemDrag.closest('.ax_default[data-label]');

        if (drag) {
            draggedElem = drag;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartRect = drag.getBoundingClientRect(); // Guarda a posição original
            isDragging = false; // ainda não moveu o elemento, então não conta como drag
        }
    }, true);

    document.addEventListener('mousemove', function (e) {
        if (draggedElem != null) {
            const atualX = e.clientX;
            const atualY = e.clientY;

            if (Math.abs(atualX - dragStartX) > 5 || Math.abs(atualY - dragStartY) > 5) {  // verifica se o rato andou 5 pixeis no x ou y
                isDragging = true;
            }
        }
    }, true);

    document.addEventListener('mouseup', function (e) {
        if (draggedElem != null && isDragging == true) {
            
            // Verifica se a peça física realmente se moveu (evita falsos drags de cliques com a mão a tremer)
            const currentRect = draggedElem.getBoundingClientRect();
            const elementMoved = Math.abs(currentRect.left - dragStartRect.left) > 2 || Math.abs(currentRect.top - dragStartRect.top) > 2;

            if (!elementMoved) {
                // Foi só um clique com o rato a mexer, abortar o drag e permitir que o evento de clique normal aconteça
                draggedElem = null;
                isDragging = false;
                return;
            }

            ignorarProximoClique = true; // Impede o falso clique

            // Obter label do elemento arrastado
            let label = findCustomDataLabel(draggedElem);
            if (!label) {
                label = draggedElem.closest('[data-label]')?.getAttribute('data-label') || 'Sem label';
            }

            let alvo = null;
            let maxOverlap = 0;
            const dragRect = draggedElem.getBoundingClientRect();

            const possiveisAlvos = document.querySelectorAll('.ax_default[data-label]');
            for (let painel of possiveisAlvos) {
                if (painel === draggedElem || draggedElem.contains(painel)) continue;

                const targetRect = painel.getBoundingClientRect();

                // Calcula a intersecção
                const overlapX = Math.max(0, Math.min(dragRect.right, targetRect.right) - Math.max(dragRect.left, targetRect.left));
                const overlapY = Math.max(0, Math.min(dragRect.bottom, targetRect.bottom) - Math.max(dragRect.top, targetRect.top));
                const overlapArea = overlapX * overlapY;

                // Escolhe o alvo com maior área de sobreposição (se houver empate, vence o que estiver "mais por cima" no HTML)
                if (overlapArea >= maxOverlap && overlapArea > 0) {
                    maxOverlap = overlapArea;
                    alvo = painel;
                }
            }

            const nomeAlvo = alvo ? (findCustomDataLabel(alvo) || alvo.getAttribute('data-label')) : "Vazio/Fora";
            const textoPassword = draggedElem.innerText ? draggedElem.innerText.trim() : "";
            const valorFinal = nomeAlvo + " ( " + textoPassword + " )";

            // 3. Registar o evento
            const detalhes = {
                eventInfo: label,
                eventValue: valorFinal,
                elementType: "drag_drop",
                click_x: e.clientX,
                click_y: e.clientY
            };

            regEvent('drag_drop', detalhes);

            // limpar as variaveis
            draggedElem = null;
            dragStartX = 0;
            dragStartY = 0;
            isDragging = false;
        }
    }, true);

})();
