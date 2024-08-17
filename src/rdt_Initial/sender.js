import dgram from 'node:dgram';
import { calculateChecksum } from './checksum.js';
const sender = dgram.createSocket('udp4')

let seqNum = 0;

export function sendMessage(message) {
    const rdt_send = message;
    const checksum = calculateChecksum(rdt_send);
    const make_pkt = {
        seqNum: seqNum,
        data: message,
        checksum: checksum
    };

    // Converter o objeto msg em uma string JSON
    const sndpkt = JSON.stringify(make_pkt);

    sender.send(sndpkt, 41234, 'localhost', () => {
        console.log(`Remetente enviou: ${sndpkt}`);
    });

    sender.on('message', (rcvpkt, rinfo) => {
        const stringMessage = rcvpkt.toString();

        const rdt_rcv = JSON.parse(stringMessage);
        setTimeout(() => {
            if (seqNum == 0) {
                console.log(seqNum, rdt_rcv.seqNum)
                if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0) {

                    console.log('Tudo certo, para o próximo pacote')
                    seqNum++;
                } else if (rdt_rcv && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 1 || rdt_rcv.checksum != checksum) { // Retransmite o pacote.
                    console.log('Certo, então vou falar novamente');
                    sender.send(sndpkt, rinfo.port, rinfo.address);
                }
            } else if (seqNum == 1) {
                console.log(seqNum, rdt_rcv.seqNum)
                if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 1) {
                    console.log('Tudo certo, para o próximo pacote')
                    seqNum--;
                } else if (rdt_rcv && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0 || rdt_rcv.checksum != checksum) { // Retransmite o pacote.
                    console.log('Certo, então vou falar novamente');
                    sender.send(sndpkt, rinfo.port, rinfo.address);
                }
            }
        }, 3000)


    });
}


