# Estágio AnyMApp

Este repositório contém a framework de telemetria desenvolvida no âmbito do Estágio da Licenciatura em Ciência de Computadores pelo Departamento de Ciência de Computadores da Faculdade de Ciências da Universidade do Porto (DCC/FCUP) em parceria com a Faculdade de Medicina da Universidade do Porto (FMUP).

## Nota de Confidencialidade e Propriedade Intelectual
Por questões de privacidade, sigilo médico e proteção de propriedade intelectual da instituição de acolhimento, e de acordo com as indicações da orientadora, **este repositório não contém os protótipos de alta fidelidade completos** (ficheiros HTML, CSS e imagens proprietárias dos projetos *Inspirers-HTN*, *3CARATkids* ou do Jogo). 

Adicionalmente, todas as chaves de ligação e credenciais de bases de dados (Firebase Firestore e MongoDB) foram omitidas por razões de segurança. Este repositório aloja exclusivamente os componentes genéricos de software implementados por mim:

1. O motor de telemetria cliente (`tracker.js` / `tracker_mongo.js`).
2. O servidor backend local para persistência de dados (`server.js`).
3. O utilitário autónomo de extração e conversão de logs (`exportar_csv.html`).
4. Resultado de testes de cada protótipo (`.csv`).

---

## Componentes Disponibilizados

### 1. Motor de Telemetria (`tracker.js` / `tracker_mongo.js`)
Script em JavaScript Vanilla (autoexecutável/IIFE) injetado nas páginas dos protótipos para intercetar eventos no DOM.
* **Captura:** Escuta cliques, alterações de inputs, escala de smiles e ações de arrastar e soltar (*drag-and-drop*).
* **Resiliência:** Implementa uma fila de persistência baseada em `sessionStorage` para evitar a perda de pacotes durante transições imediatas de páginas.

### 2. Servidor Backend (`3CARATkidsMongoDB/backend/`)
Servidor local construído em Node.js com Express e ligação NoSQL MongoDB via Mongoose ODM.
* **Ficheiros:** `server.js`, `package.json`, `package-lock.json`.
* **Segurança:** Configurado para utilizar variáveis de ambiente para a string de ligação à base de dados. Um ficheiro `.env.example` é fornecido como modelo de parametrização.

### 3. Utilitário de Exportação (`exportar_csv.html`)
Script HTML/JS autónomo para extração automática de dados do Firebase Firestore e conversão direta para formato tabular (CSV).
* **Compatibilidade:** Desenhado para ser executado localmente sob o protocolo `file:///`, recorrendo a importações assíncronas dinâmicas do SDK modular do Firebase v10 para contornar restrições de CORS.
* **Sanitização:** Formata os logs com delimitador de ponto e vírgula (`;`) e cabeçalho UTF-8 BOM para abertura direta no Microsoft Excel em português.

---

## Como Integrar a Framework em Novos Protótipos

Para aplicar a telemetria desenvolvida em qualquer página HTML estática:

1. **Importação do Rastreio:** Importe o script do tracker no cabeçalho ou fim do ficheiro HTML:
   ```html
   <script src="path/to/tracker.js"></script>

---

## Documentação de Referência e APIs Utilizadas

A implementação das funcionalidades e algoritmos presentes nesta framework de telemetria baseou-se nas seguintes documentações oficiais de APIs e bibliotecas:

### 1. APIs Nativas do Navegador (Web APIs)
* [**MDN Web Docs - Element.getBoundingClientRect()**](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect): Documentação de referência para obter o posicionamento absoluto e as coordenadas dos limites físicos (*bounding boxes*) de elementos no ecrã. Serviu de base matemática para o algoritmo de cálculo de interseção geométrica do *Drag-and-Drop*.
* [**MDN Web Docs - SessionStorage API**](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage): Guia de utilização do armazenamento de sessão do navegador, utilizado para a persistência temporária da fila de eventos resiliente e para a gestão anónima de `session_id`.
* [**JavaScript.info - Bubble and Capture**](https://javascript.info/bubbling-and-capturing): Artigo técnico explicativo sobre os ciclos de vida e fases de propagação de eventos no DOM. Utilizado para fundamentar a escolha da fase de captura (`addEventListener(..., true)`) para contornar o bloqueio de eventos pelo motor interno do Axure RP.

### 2. Desenvolvimento de Servidor e Base de Dados (Backend)
* [**Documentação Oficial do Express.js**](https://expressjs.com/): Manual e API de referência para a estruturação do servidor web local, criação de endpoints (rota POST `/api/track`) e configuração de middlewares de segurança e processamento de payloads (`cors` e `express.json`).
* [**Mongoose ODM - Schemas Guide**](https://mongoosejs.com/docs/guide.html): Documentação oficial do Mongoose contendo os padrões para definição de esquemas JSON, validação de tipos de dados e instanciação de modelos para persistência de documentos na coleção MongoDB.

### 3. Integrações na Nuvem (Firebase)
* [**Firebase Cloud Firestore - Web SDK**](https://firebase.google.com/docs/firestore): Manual do desenvolvedor para ligação cliente-base de dados do Firestore. Utilizado para a configuração das regras de segurança de escrita anónima e para as importações dinâmicas assíncronas do SDK v10 do Firebase no browser.
