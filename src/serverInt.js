import express from 'express';
import cors from 'cors';
import { sendMessage } from './client.js'; // Importa o cliente UDP
const app = express();

app.use(express.json());
app.use(cors({
    origin: '*', // ou '*' para permitir todas as origens
  }));

app.post('/send-text', (req, res) => {
    const { text } = req.body;

    // Enviar a mensagem para o servidor UDP usando o cliente UDP
    sendMessage(text);

    // Aqui, você pode configurar uma lógica para aguardar a resposta do servidor UDP
    // ou enviar uma resposta imediata como antes.
    res.send({ response: 'Mensagem enviada ao servidor UDP, aguardando resposta...' });
    // return res.send({message: response});
});

app.listen(3000, () => {
    console.log('Servidor intermediário HTTP escutando na porta 3000');
});
