import dgram from 'node:dgram';
import { calculateChecksum } from './checksum.js';

// Criando um socket UDP com IPv4 para enviar e receber mensagens
const sender = dgram.createSocket('udp4')

// Número de sequência do pacote, usado para rastrear a ordem dos pacotes enviados
let seqNum = 0;
let sndpkt; // Pacote que será enviado
let checksum; // Checksum para verificar a integridade dos dados
let timeoutHandle; // Identificador do timeout para retransmissão
let make_pkt; // JSON do pacote que terá seqNum, data e checksum

function pktNull() {
    make_pkt = ''
}

function dataCorrupted() {
    checksum = 'corrupted data'
}
// Função para enviar uma mensagem ao destinatário
export function sendMessage(message) {
    // Mensagem que será enviada
    const rdt_send = message;

    // Calcula o checksum da mensagem
    checksum = calculateChecksum(rdt_send);

    // Cria o pacote com número de sequência, dados e checksum
    make_pkt = {
        seqNum: seqNum,
        data: message,
        checksum: checksum
    };

    // Simulação de perda de dados
    // pktNull();
    // sender.send(make_pkt, 41234, 'localhost', () => {
    //     console.log(`Remetente enviou: ${sndpkt}`);


    //     startTimeout(make_pkt);
    // });

    // Converte o objeto do pacote em uma string JSON
    sndpkt = JSON.stringify(make_pkt);

    // Envia o pacote para o destinatário via UDP
    sender.send(sndpkt, 41234, 'localhost', () => {
        console.log(`Remetente enviou: ${sndpkt}`);

        // Inicia o temporizador para retransmissão caso o ACK não seja recebido
        startTimeout(sndpkt);
    });
}

// Função para iniciar o timeout e retransmitir o pacote se necessário
function startTimeout(pkt) {
    // Limpa qualquer timeout anterior antes de iniciar um novo
    clearTimeout(timeoutHandle);

    // Define o timeout para retransmitir o pacote após 10 segundos, se necessário
    timeoutHandle = setTimeout(() => {
        console.log('Timeout! Retransmitindo o pacote...');

        // Retransmite o pacote
        sender.send(pkt, 41234, 'localhost');

        // Reinicia o temporizador após a retransmissão
        startTimeout();
    }, 10000); // 10 segundos de timeout
}

// Evento disparado quando uma mensagem é recebida no socket UDP
sender.on('message', (rcvpkt, rinfo) => {
    // Converte a mensagem recebida de volta para string
    const stringMessage = rcvpkt.toString();

    // Parseia a mensagem JSON recebida de volta para um objeto
    const rdt_rcv = JSON.parse(stringMessage);

    // simulação de corrupção de dados
    // dataCorrupted();

    // Verifica o número de sequência atual
    if (seqNum == 0) {
        setTimeout(() => {
            // Verifica se o pacote foi recebido corretamente
            if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0) {
                console.log('Tudo certo, para o próximo pacote');

                // Cancela o timeout de retransmissão, pois o pacote foi confirmado
                clearTimeout(timeoutHandle);

                // Incrementa o número de sequência para o próximo pacote
                seqNum++;
            }
            // Se o pacote não foi confirmado corretamente, retransmite
            else if (rdt_rcv && (rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 1 || rdt_rcv.checksum != checksum)) {
                console.log('Certo, então vou falar novamente');
                clearTimeout(timeoutHandle);

                // Retransmite o pacote
                sender.send(sndpkt, rinfo.port, rinfo.address);
            }
        }, 3000) // Espera 3 segundos para processar a resposta

    }
    // Caso o número de sequência seja 1
    else if (seqNum == 1) {
        setTimeout(() => {
            // Verifica se o pacote foi recebido corretamente
            if (rdt_rcv && (rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0 || rdt_rcv.checksum != checksum)) {
                console.log('Certo, então vou falar novamente');
                clearTimeout(timeoutHandle);

                // Retransmite o pacote
                sender.send(sndpkt, rinfo.port, rinfo.address);
            }
            // Se o pacote foi confirmado corretamente, decrementar o número de sequência
            else if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 1) {
                console.log('Tudo certo, para o próximo pacote');
                clearTimeout(timeoutHandle);
                seqNum--;
            }
        }, 3000) // Espera 3 segundos para processar a resposta

    }
});