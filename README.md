# Estágio AnyMApp

Este repositório contém a framework de telemetria desenvolvida no âmbito do Estágio do Mestrado em Bioinformática e Biologia Computacional / Licenciatura em Ciência de Computadores pelo Departamento de Ciência de Computadores da Faculdade de Ciências da Universidade do Porto (DCC/FCUP) em parceria com a Faculdade de Medicina da Universidade do Porto (FMUP).

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
