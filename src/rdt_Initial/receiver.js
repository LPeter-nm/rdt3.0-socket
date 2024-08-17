import dgram from 'node:dgram'
import { calculateChecksum } from './checksum';
const receiver = dgram.createSocket('udp4');

let expectedNum = 0;

function checksumVerify (data, make_pkt){
    const checksumRcv = calculateChecksum(data);
    if(checksumRcv != extract.checksum){
        const make_pkt = {
            confirm: 'NACK',
            checksum: checksumRcv
        }
        console.log('Os dados foram corrompidos')

        const sndpkt = JSON.stringify(make_pkt)
        receiver.send(sndpkt, rinfo.port, rinfo.address)
    }  else {
        const sndpkt = JSON.stringify(make_pkt)
        receiver.send(sndpkt, rinfo.port, rinfo.address)
    }
}

receiver.on('message', (rcvpkt, rinfo) => {
})

receiver.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});