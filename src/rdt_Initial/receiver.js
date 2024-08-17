import dgram from 'node:dgram'
import { calculateChecksum } from './checksum.js';
const receiver = dgram.createSocket('udp4');

let expectedNum = 0;
let pkt = []

receiver.on('message', (rcvpkt, rinfo) => {
    const rdt_rcv = rcvpkt.toString();
    const jsonrdt_rcv = JSON.parse(rdt_rcv);
    const seqNum = rdt_rcv.slice(10, 11)
    const checksumRcv = calculateChecksum(jsonrdt_rcv.data);

    if (!seqNum) {
        console.log('Erro de posição do seqNum')
    }
    console.log(expectedNum)

    if (expectedNum == 0) {
        setTimeout(() => {
            if (rdt_rcv && Number(seqNum) == 0 && checksumRcv == jsonrdt_rcv.checksum) {
                const extract = jsonrdt_rcv.data
                pkt.push(extract);
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 0,
                    checksum: jsonrdt_rcv.checksum
                }


                const sndpkt = JSON.stringify(make_pkt)

                console.log('Mensagem sendo enviada com sucesso')
                receiver.send(sndpkt, rinfo.port, rinfo.address)
                expectedNum++;
            } else if (rdt_rcv && (Number(seqNum) == 1 || checksumRcv == jsonrdt_rcv.checksum)) {
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 1,
                    checksum: jsonrdt_rcv.checksum
                }
                const sndpkt = JSON.stringify(make_pkt)
                console.log('A sequência está incorreta, mas o pacote chegou')
                receiver.send(sndpkt, rinfo.port, rinfo.address)
            }
        }, 4000)

    } else if (expectedNum == 1) {
        setTimeout(() => {
            if (rdt_rcv && Number(seqNum) == 1 && checksumRcv == jsonrdt_rcv.checksum) {
                const extract = jsonrdt_rcv.data
                pkt.push(extract);
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 1,
                    checksum: jsonrdt_rcv.checksum
                }

                const sndpkt = JSON.stringify(make_pkt)
                console.log('Mensagem sendo enviada com sucesso')
                receiver.send(sndpkt, rinfo.port, rinfo.address);
                expectedNum--;
            } else if (rdt_rcv && (Number(seqNum) == 0 || checksumRcv == jsonrdt_rcv.checksum)) {
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 0,
                    checksum: jsonrdt_rcv.checksum
                }
                const sndpkt = JSON.stringify(make_pkt)
                console.log('A sequência está incorreta, mas o pacote chegou')
                receiver.send(sndpkt, rinfo.port, rinfo.address)
            }
        }, 4000)

    }

})




receiver.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});