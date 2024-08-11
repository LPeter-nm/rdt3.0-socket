import dgram from 'node:dgram'
const server = dgram.createSocket('udp4');
let expectedSeqNum = 0;

function calculateChecksum(message) {
    let checksum = 0;
    for (let i = 0; i < message.length; i++) {
        checksum += message.charCodeAt(i);
    }
    checksum = ~checksum;
    console.log(checksum)
    return checksum & 0xFFFF;
}

server.on('message', (msg, rinfo) => {
    const receivedSeqNum = expectedSeqNum;
    const checksum = calculateChecksum(msg.toString());
    const calculatedChecksum = calculateChecksum(`${receivedSeqNum}:${msg.toString()}`);

    console.log(`Servidor UDP recebeu: ${msg} de ${rinfo.address}:${rinfo.port}`);

    if (checksum === calculatedChecksum && receivedSeqNum === expectedSeqNum) {
        console.log(`Mensagem UDP confirmada com seqNum: ${receivedSeqNum}`);
        expectedSeqNum++;
        server.send(`ACK:${expectedSeqNum}`, rinfo.port, rinfo.address);
    } else {
        console.log(`Erro na mensagem UDP ou checksum incorreto.`);
        server.send(`ACK:${expectedSeqNum}`, rinfo.port, rinfo.address);
    }
});

server.on('error', (err) => {
    console.error(`Erro no servidor UDP: ${err.stack}`);
    server.close();
});

server.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});
