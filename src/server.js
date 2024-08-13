import dgram from 'node:dgram'
const server = dgram.createSocket('udp4');
let expectedSeqNum = 0;

function calculateChecksum(message) {
    let checksum = 0;
    for (let i = 0; i < message.length; i++) {
        checksum += message.charCodeAt(i);
    }
    checksum = ~checksum;
    return checksum;
}

server.on('message', (msg, rinfo) => {
    const jsonMsg = msg.toString();
    
    // Parse a string JSON para um objeto
    const receivedMsg = JSON.parse(jsonMsg);
    
    // Desestruture o objeto para obter o seqNum, checksum e a mensagem
    const { seqNum: receivedSeqNum, message, checksum: receivedChecksum } = receivedMsg;
    const checksum = calculateChecksum(`${receivedSeqNum}:${message}`);

    console.log(`Servidor UDP recebeu: ${msg} de ${rinfo.address}:${rinfo.port}`);
    if(receivedMsg.seqNum = 0){
        if (checksum === receivedChecksum && receivedSeqNum === expectedSeqNum ) {
            console.log(`Mensagem UDP confirmada com seqNum: ${receivedSeqNum}`);
            receivedMsg.seqNum++;
        // Aqui a gente criaria um objeto ACK pra mandar 
            server.send(`ACK:${expectedSeqNum}`, rinfo.port, rinfo.address);
        } else {
            console.log(`Erro na mensagem UDP ou checksum incorreto.`);
            server.send(`ACK:${expectedSeqNum}`, rinfo.port, rinfo.address);
        }
    } else if (receivedMsg.seqNum  = 1) {
        if (checksum === receivedChecksum && receivedSeqNum === expectedSeqNum ) {
            console.log(`Mensagem UDP confirmada com seqNum: ${receivedSeqNum}`);
            receivedMsg.seqNum--;
        // Aqui a gente criaria um objeto ACK pra mandar 
            server.send(`ACK:${expectedSeqNum}`, rinfo.port, rinfo.address);
        } else {
            console.log(`Erro na mensagem UDP ou checksum incorreto.`);
            server.send(`ACK:${expectedSeqNum}`, rinfo.port, rinfo.address);
        }
    } 
    
});

server.on('error', (err) => {
    console.error(`Erro no servidor UDP: ${err.stack}`);
    server.close();
});

server.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});
