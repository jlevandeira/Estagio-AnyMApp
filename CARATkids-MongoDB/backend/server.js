const express = require('express'); // Biblioteca que cria o server
const mongoose = require('mongoose'); // Ferramenta que permite falar com o MongoDB
const cors = require('cors'); // Medida de segurança que permite o Axure conversar com o server 

require('dotenv').config(); // lê as pass que estão no .env

// Configuração do server

const server = express();
const PORT = process.env.PORT || 3000; // porta que o node vai usar

// Middlewares 
server.use(cors()); // Permite que o html envie dados
server.use(express.json()); // Permite que o html envie dados em json

// Ligação ao MongoDB
// Pede ao mongoose para se ligar à bd com as credenciais guardadas no .env
mongoose.connect(process.env.MONGODB_URI).then(() => console.log("Ligado")).catch(err => console.error('Erro:', err));

// Definição da estrutura de dados
const esquema = new mongoose.Schema({
    session_id: String,
    page_title: String,
    time_enter: String,
    event_Type: String,
    timestamp: String,
    click_x: Number,
    click_y: Number,
    eventInfo: String,
    eventValue: String,
    elementType: String,
    operative_system: String,
    browser: String
}, { collection: 'interactions' })

const Interaction = mongoose.model('Interaction', esquema); // Transforma o esquema num modelo para criar novos registos

// Parte do API 
// Cria a rota POST no endereço /api/track que é onde o Axure envia o fetch
server.post('/api/track', async (req, res) => {
    try {
        console.log('Dados recebidos: ', req.body);
        const newInteraction = new Interaction(req.body); // Recebe os dados e cria um novo registo na memória do server

        await newInteraction.save() // Pedido para guardar o registo no MongoDB
        res.status(201).json({ message: 'Guardado no MongoDB' }); // Caso tenha guardado envia mensagem a confirmar

    } catch (error) {
        console.error('Erro a guardar', error);
        res.status(500).json({ error: 'Erro interno do servidor' }); // Avisa se houver um erro.
    }
});

// Iniciar o server
server.listen(PORT, () => {
    console.log(`O server está a correr na porta ${PORT}`);
    console.log(`Para aceder à app: http://localhost:${PORT}`);
});