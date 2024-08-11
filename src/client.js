import dgram from 'node:dgram'
const client = dgram.createSocket('udp4');

let seqNum = 0;

function calculateChecksum(message) {
    let checksum = 0;
    for (let i = 0; i < message.length; i++) {
        checksum += message.charCodeAt(i);
    }
    checksum = ~checksum;
    console.log(checksum)
    return checksum & 0xFFFF;
}

export function sendMessage(message) {
    const data = `${seqNum}:${message}`;
    const checksum = calculateChecksum(data);
    const msg = `${seqNum}:${checksum}:${message}`;

    client.send(msg, 41234, 'localhost', (err) => {
        if (err) {
            console.error(`Erro ao enviar mensagem: ${err}`);
            client.close();
        } else {
            console.log(`Cliente UDP enviou: ${msg}`);
        }
    });
}

client.on('message', (msg, rinfo) => {
    const [ack, receivedSeqNum] = msg.toString();
    
    if (ack === 'ACK' && parseInt(receivedSeqNum) === seqNum + 1) {
        console.log(`Cliente UDP recebeu ACK para seqNum: ${seqNum}`);
        seqNum++;
        // Aqui você pode continuar com o próximo envio ou finalizar
    } else {
        console.log(`ACK não recebido ou fora de ordem. SeqNum atual: ${seqNum}`);
        // Implementar lógica de reenvio ou outra manipulação de erro
    }
});

client.on('error', (err) => {
    console.error(`Erro no cliente UDP: ${err.stack}`);
    client.close();
});


