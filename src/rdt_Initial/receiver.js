import dgram from 'node:dgram'
const receiver = dgram.createSocket('udp4');

receiver.on('message', (msg, rinfo) => {
    const jsonMsg = msg.toString();

    const receiverMsg = JSON.parse(jsonMsg)

    console.log(receiverMsg);
})

receiver.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});