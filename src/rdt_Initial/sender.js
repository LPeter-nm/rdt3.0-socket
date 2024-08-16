import dgram from 'node:dgram';
import { calculateChecksum } from './checksum.js';
const sender = dgram.createSocket('udp4')

let seqNum = 0;

export function sendMessage(message) {
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

    sender.on('message', (msg, rinfo) => {
        const message = msg.toString();

        setTimeout(() => {
            if (message == 'ACK') {
                console.log('Deu tudo certo, próximo')
            } else if (message == 'NACK' || message == "") {
                console.log('Certo, então vou falar novamente')
                sender.send(msgString, rinfo.port, rinfo.address)
            }
        }, 4000)

    })
}

