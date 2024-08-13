import dgram from 'node:dgram'
const client = dgram.createSocket('udp4');

let seqNum = 0;

function calculateChecksum(message) {
    let checksum = 0;
    // console.log(message);
    for (let i = 0; i < message.length; i++) {
        checksum += message.charCodeAt(i);
    }
    checksum = ~checksum;
    return checksum;
}

export function sendMessage(message) {
    const data = `${seqNum}:${message}`;
    const checksum = calculateChecksum(data);
    const msg = {
        seqNum: seqNum,
        checksum: checksum,
        message: message
    };

    // Converter o objeto msg em uma string JSON
    const msgString = JSON.stringify(msg);

    client.send(msgString, 41234, 'localhost', (err) => {
        if (err) {
            console.log(`Erro ao enviar mensagem: ${err}`);
            client.close();
        } else {
            console.log(`Cliente UDP enviou: ${msgString}`);
        }
    });
}

client.on('message', (msg, rinfo) => {
    const [a, c, k, points, receivedSeqNum] = msg.toString();
    const message = {
        ack: a+c+k,
        seqNumber: Number(receivedSeqNum)
    }
    
    // Aqui ele receberia e verificaria
    if (message.ack === 'ACK' && message.seqNumber === seqNum) {
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


