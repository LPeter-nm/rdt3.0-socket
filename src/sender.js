// Remetente
/**
 * Remetente: Este é o arquivo que implementa o papel de enviar dados para outro socket. 
 * Ele usa o dgram.createSocket('udp4') para criar um socket UDP e envia pacotes para 
 * um endereço e porta específicos. Esse comportamento é característico de um remetente.
 */
import dgram from 'node:dgram';
import { verifyChecksum, makePacket } from './util.js';

export class Sender {
    constructor() {
        this.packetNum = 1;
        this.seqNum = 0;
        this.receiverPort = 11555; // Número da porta do receptor
        this.senderSocket = dgram.createSocket('udp4'); // Cria o socket UDP para o remetente
    }

    sendPacket(packet, appMsgStr) {
        // Prepara e envia o pacote para o receptor
        const destination = { address: 'localhost', port: this.receiverPort };
        this.senderSocket.send(packet, 0, packet.length, destination.port, destination.address, (err) => {
            if (err) {
                console.error('Erro ao enviar o pacote:', err);
                return;
            }
            console.log(`Pacote #${this.packetNum} enviado com sucesso para o receptor.`);
            this.packetNum += 1;
        });

        // Cria um timeout
        const timeoutDuration = 3000; // Timeout de 3 segundos
        let timeout;

        // Lida com a resposta do receptor
        const handleMessage = (msg, senderAddr) => {
            clearTimeout(timeout);
            const isResponseValid = verifyChecksum(msg);
            const ackNum = msg[11] & 1;

            if (ackNum === this.seqNum && isResponseValid) {
                // Caso: ack = seq -> entrega de dados bem-sucedida, resposta válida do receptor
                console.log(`Pacote recebido corretamente: seq. num ${this.seqNum} = ACK num ${ackNum}. Tudo feito!`);
                console.log('\n');
                // Atualiza o número de sequência
                this.seqNum = this.seqNum === 0 ? 1 : 0;
            } else {
                // Caso: número de sequência e número de ack não correspondem
                console.log('Receptor confirmou pacote anterior, reenviar!');
                console.log('\n');
                console.log(`[ACK-Reenvio]: ${appMsgStr}`);

                // Reinicia o temporizador - permite que o remetente aguarde o pacote ACK correto do receptor
                this.sendPacket(packet, appMsgStr);
            }
        };

        const handleTimeout = () => {
            console.log('Timeout do socket! Reenviar!');
            console.log('\n');
            console.log(`[Timeout-Reenvio]: ${appMsgStr}`);
            this.sendPacket(packet, appMsgStr);
        };

        // Define o timeout para aguardar a resposta
        timeout = setTimeout(handleTimeout, timeoutDuration);

        // Lida com a mensagem recebida
        this.senderSocket.once('message', handleMessage);
    }

    rdtSend(appMsgStr) {
        // Envia uma mensagem de forma confiável para o receptor (DEVE TER NÃO ALTERE)

        // Cria o pacote
        console.log(`Mensagem original em string: ${appMsgStr}`);
        const packet = makePacket(appMsgStr, 0, this.seqNum);
        console.log(`Pacote criado: ${packet}`);

        // Envia o pacote
        this.sendPacket(packet, appMsgStr);
    }
}

// Função principal
function main() {
    const sender = new Sender();
    for (let i = 1; i < 10; i++) {
        // Aqui é onde rdtSend será chamado
        sender.rdtSend(`msg${i}`);
    }
}

if (import.meta.url === 'file://' + new URL(import.meta.url).pathname) {
    main();
}
