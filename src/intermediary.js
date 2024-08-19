import express from 'express';
import cors from 'cors';
import { sendMessage } from './sender.js'; // Importa o cliente UDP

let message
let lengthMessage
export function setReceivedMessage(msg, msgLength) { // Recebe a mensagem do Receiver
    message = msg;
    lengthMessage = msgLength;
}

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', // ou '*' para permitir todas as origens
}));

app.post('/send-text', (req, res) => {
    const { text } = req.body;

    // Enviar a mensagem para o servidor UDP usando o cliente UDP
    sendMessage(text);

    res.send({ response: 'Mensagem enviada ao servidor UDP, aguardando resposta...' });
});

app.get('/send-text', async (req, res) => {
    res.json({ message, lengthMessage })
});


app.listen(3000, () => {
    console.log('Servidor intermediário HTTP escutando na porta 3000');
});