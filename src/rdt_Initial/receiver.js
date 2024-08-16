import dgram from 'node:dgram'
const receiver = dgram.createSocket('udp4');

receiver.on('message', (msg, rinfo) => {
    const jsonMsg = msg.toString();

    const receiverMsg = JSON.parse(jsonMsg)
    setTimeout(() => {
        if (msg && receiverMsg.message != "") {
            console.log(receiverMsg)
            receiver.send("ACK", rinfo.port, rinfo.address)
        } else if (msg && receiverMsg.message == "") {
            console.log('Recebi, mas está corrompido')
            receiver.send("NACK", rinfo.port, rinfo.address)
        }
    }, 4000)
})

receiver.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});