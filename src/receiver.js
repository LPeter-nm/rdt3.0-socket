// Destinatário
/**
 * Destinatário: Este arquivo implementa o papel de receber pacotes de dados. 
 * Ele também usa o dgram.createSocket('udp4'), mas em vez de enviar pacotes, 
 * ele escuta e processa pacotes recebidos em uma porta específica. Esse comportamento 
 * é característico de um destinatário.
 */
import dgram from 'node:dgram';
import { verifyChecksum, makePacket } from './util.js';

export class Receiver {
    constructor() {
        this.port = 11555; // Define o número da porta
        this.receiverSck = dgram.createSocket('udp4'); // Cria o socket UDP do receptor
        this.receiverSck.bind(this.port); // Vincula o socket à porta específica
        this.packetNum = 1;
        this.expectedSeqNum = 0;
        this.prevSeqNum = -1;
    }

    runForever() {
        // Esta função é um loop infinito onde o receptor ficará esperando e recebendo pacotes do remetente
        console.log('\n' + '*'.repeat(10) + ' RECEPTOR ativo e ouvindo ' + '*'.repeat(10) + '\n');
        this.receiverSck.on('message', (msg, senderAddr) => {
            console.log(`Pacote num.${this.packetNum} recebido: ${msg}`);
            const curSeqNumber = msg[11] & 1;

            const msgValid = verifyChecksum(msg);
            if (this.packetNum % 6 === 0) {
                // Simula a perda de pacote
                console.log('Simulando perda de pacote: aguardando um pouco para acionar o evento de timeout no remetente...');
                setTimeout(() => {}, 4000); // Aguarda 4 segundos (o timeout do remetente é 3 segundos)
            } else if (!msgValid || this.packetNum % 3 === 0) {
                // Simula erro de bit ou pacote corrompido
                console.log('Simulando erros de bit/pacote corrompido: ACK para o pacote anterior');
                const ackPacket = makePacket('', 1, this.prevSeqNum);
                this.receiverSck.send(ackPacket, senderAddr.port, senderAddr.address);
            } else if (curSeqNumber !== this.expectedSeqNum) {
                // Número de sequência do pacote do remetente está incorreto
                console.log(`Número de seq# incorreto do pacote recebido... seq# é ${curSeqNumber} mas seq# esperado é ${this.expectedSeqNum}... ACK para o pacote atual`);
                const ackPacket = makePacket('', 1, curSeqNumber);
                this.receiverSck.send(ackPacket, senderAddr.port, senderAddr.address);
            } else {
                // Caso: tudo está correto
                const payload = msg.slice(12).toString('utf-8');
                console.log(`Pacote esperado, mensagem entregue: ${payload}`);
                console.log('Pacote entregue, agora criando e enviando o pacote ACK...');
                const ackPacket = makePacket('', 1, curSeqNumber);
                this.receiverSck.send(ackPacket, senderAddr.port, senderAddr.address);
                this.prevSeqNum = curSeqNumber; // Atualiza o número de sequência
                
                // Atualiza o número de sequência esperado
                this.expectedSeqNum = curSeqNumber === 0 ? 1 : 0;
            }
            console.log('Tudo feito para este pacote!');
            console.log('\n');
            this.packetNum += 1;
        });
    }
}

// Função principal
function main() {
    const receiver = new Receiver();
    receiver.runForever();
}

if (import.meta.url === `file://${new URL(import.meta.url).pathname}`) {
    main();
}
