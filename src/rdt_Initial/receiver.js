import dgram from 'node:dgram'
import { setReceivedMessage } from './intermediary.js'
const receiver = dgram.createSocket('udp4');

const pacotes = [];

receiver.on('message', (msg, rinfo) => {
    const jsonMsg = msg.toString();

    const receiverMsg = JSON.parse(jsonMsg)
    setTimeout(() => {
        if (msg && receiverMsg.message != "" && !pacotes.some(pacote => pacote.message === receiverMsg.message)) { // Recebimento e Confirmação
            console.log(receiverMsg)
            pacotes.push(receiverMsg);
            setReceivedMessage(receiverMsg); // Envia a mensagem ao intermediario
            receiver.send("", rinfo.port, rinfo.address)
        } else if(pacotes.some(pacote => pacote.message === receiverMsg.message)){ // Detector de duplicatas
            console.log('Mensagem duplicada detectada');
            receiver.send("ACK", rinfo.port, rinfo.address)
        }
    }, 4000)
})

receiver.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});