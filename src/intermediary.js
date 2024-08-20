import express from 'express';
import cors from 'cors';
import { sendMessage } from './sender.js'; // Importa o cliente UDP

let message;  // Variável para armazenar a mensagem recebida
let lengthMessage;  // Variável para armazenar o tamanho da mensagem recebida

// Função que recebe a mensagem do Receiver
export function setReceivedMessage(msg, msgLength) {
    message = msg;  // Armazena a mensagem
    lengthMessage = msgLength;  // Armazena o tamanho da mensagem
}

// Inicializa a aplicação Express
const app = express();

// Middleware para parsear JSON nas requisições
app.use(express.json());

// Middleware para habilitar CORS, permitindo requisições de diferentes origens
app.use(cors({
    origin: '*', // Permite todas as origens. Pode ser configurado para permitir apenas origens específicas.
}));

// Rota POST para enviar uma mensagem
app.post('/send-text', (req, res) => {
    const { text } = req.body;  // Extrai o texto do corpo da requisição

    // Envia a mensagem para o servidor UDP usando o cliente UDP
    sendMessage(text);

    // Retorna uma resposta ao cliente HTTP
    res.send({ response: 'Mensagem enviada ao servidor UDP, aguardando resposta...' });
});

// Rota GET para retornar a mensagem recebida e seu comprimento
app.get('/send-text', async (req, res) => {
    res.json({ message, lengthMessage });  // Retorna a mensagem e o comprimento armazenados
});

// Inicia o servidor HTTP na porta 3000
app.listen(3000, () => {
    console.log('Servidor intermediário HTTP escutando na porta 3000');
});
