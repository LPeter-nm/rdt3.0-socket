import dgram from 'node:dgram';
import { calculateChecksum } from './checksum.js';
const sender = dgram.createSocket('udp4')

let seqNum = 0;
let messageIntermediary 

export function sendMessage(message) {
    messageIntermediary = message
    const data = `${seqNum}:${message}`;
    const checksum = calculateChecksum(data);
    const msg = {
        seqNum: seqNum,
        message: message,
        checksum: checksum
    };

    // Converter o objeto msg em uma string JSON
    const msgString = JSON.stringify(msg);

    sender.send(msgString, 41234, 'localhost', () => {
        console.log(`Remetente enviou: ${msgString}`);
    });
}


sender.on('message', (msg, rinfo) => {
    const message = msg.toString();

    setTimeout(() => { // Timeout
        if (message == 'ACK') {
            console.log('Deu tudo certo, próximo')
        } else{ // Retransmite o pacote.
            console.log('Certo, então vou falar novamente')
            sendMessage(messageIntermediary);
        }
    }, 4000)
});