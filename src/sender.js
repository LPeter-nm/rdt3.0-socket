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
let timeoutLimit = 0;

function pktNull(seqNum, checksum) {
    make_pkt = {
        seqNum: seqNum,
        data: "",
        checksum: checksum
    }
}

function dataCorrupted() {
    checksum = 'corrupted data'
}

function execErrorDataCorrupted() {
    const numRandom =  Math.random() >= 0.5; // Gera true ou false
    if (numRandom) {
        dataCorrupted();
    } 
}

function execErrorPktNull(seqNum, checksum) {
    const numRandom =  Math.random() >= 0.5; // Gera true ou false
    if (numRandom) {
        pktNull(seqNum, checksum);
    } 
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
    // execErrorPktNull(seqNum, checksum);
    // pktNull(seqNum, checksum);

    // Converte o objeto do pacote em uma string JSON
    sndpkt = JSON.stringify(make_pkt);

    // Envia o pacote para o destinatário via UDP
    sender.send(sndpkt, 41234, 'localhost', () => {
        console.log('======== Remetente em ação ========')
        console.log(`Remetente enviou: ${sndpkt}`);

        console.log('Temporizador iniciado...')
        // Inicia o temporizador para retransmissão caso o ACK não seja recebido
        startTimeout();
        console.log('\n')
    });
}

// Função para iniciar o timeout e retransmitir o pacote se necessário
function startTimeout() {
    // Limpa qualquer timeout anterior antes de iniciar um novo
    if(timeoutLimit === 3){ // Quantidade limite de retransmissões dos dados
        clearTimeout(timeoutHandle);
        timeoutLimit = 0;
        console.log('Limite de retransmissões atingido!');
    } else{
        clearTimeout(timeoutHandle);
    
        // Define o timeout para retransmitir o pacote após 10 segundos, se necessário
        timeoutHandle = setTimeout(() => {
            console.log('======== Remetente em ação ========')
            console.log('Timeout! Retransmitindo o pacote...');
    
            // Retransmite o pacote
            sender.send(sndpkt, 41234, 'localhost');
    
            // Reinicia o temporizador após a retransmissão
            timeoutLimit++;
            startTimeout();
        }, 10000); // 10 segundos de timeout
    }
}

// Evento disparado quando uma mensagem é recebida no socket UDP
sender.on('message', (rcvpkt, rinfo) => {
    console.log('======== Remetente em ação ========')
    // Converte a mensagem recebida de volta para string
    const stringMessage = rcvpkt.toString();

    // Parseia a mensagem JSON recebida de volta para um objeto
    const rdt_rcv = JSON.parse(stringMessage);

    // simulação de corrupção de dados
    // execErrorDataCorrupted();
    // dataCorrupted();

    // Verifica o número de sequência atual
    if (seqNum == 0) {
        setTimeout(() => {
            // Verifica se o pacote foi recebido corretamente
            if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0) {
                console.log('------- Mensagem recebida --------')
                console.log(`Confirmação: ${rdt_rcv.confirm}`)
                console.log(`Sequência: ${rdt_rcv.seqNum}`)
                console.log(`Checksum: ${rdt_rcv.checksum}`)

                console.log('----------------------------------')
                console.log('Tudo certo para o próximo pacote\n');

                // Cancela o timeout de retransmissão, pois o pacote foi confirmado
                clearTimeout(timeoutHandle);

                // Incrementa o número de sequência para o próximo pacote
                seqNum++;
            }
            // Se o pacote não foi confirmado corretamente, retransmite
            else if (rdt_rcv && (rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 1 || rdt_rcv.checksum != checksum)) {
                console.log('------- Mensagem corrompida --------')

                console.log('--- Checksum e seqNum esperados ---')
                console.log(`Checksum: ${checksum}`)
                console.log(`Sequência: ${seqNum}`)

                console.log('--- Checksum e seqNum recebidos ---')
                console.log(`Checksum: ${rdt_rcv.checksum}`)
                console.log(`Sequência: ${rdt_rcv.seqNum}`)

                console.log('----------------------------------------')
                console.log('Reenvio de pacote...\n');
                clearTimeout(timeoutHandle);

                // Retransmite o pacote
                sender.send(sndpkt, rinfo.port, rinfo.address);
            }
        }, 3000) // Espera 3 segundos para processar a resposta -> somente para observar o processo mais lentamente
    }
    // Caso o número de sequência seja 1
    else if (seqNum == 1) {
        setTimeout(() => {
            // Verifica se o pacote foi recebido corretamente
            if (rdt_rcv && (rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0 || rdt_rcv.checksum != checksum)) {
                console.log('------- Mensagem corrompida --------')

                console.log('--- Checksum e seqNum esperados ---')
                console.log(`Checksum: ${checksum}`)
                console.log(`Sequência: ${seqNum}`)

                console.log('--- Checksum e seqNum recebidos ---')
                console.log(`Checksum: ${rdt_rcv.checksum}`)
                console.log(`Sequência: ${rdt_rcv.seqNum}`)

                console.log('----------------------------------------')
                console.log('Reenvio de pacote...\n');
                clearTimeout(timeoutHandle);

                // Retransmite o pacote
                sender.send(sndpkt, rinfo.port, rinfo.address);
            }
            // Se o pacote foi confirmado corretamente, decrementar o número de sequência
            else if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 1) {
                console.log('------- Mensagem recebida --------')
                console.log(`Confirmação: ${rdt_rcv.confirm}`)
                console.log(`Sequência: ${rdt_rcv.seqNum}`)
                console.log(`Checksum: ${rdt_rcv.checksum}`)

                console.log('----------------------------------')
                console.log('Tudo certo para o próximo pacote\n');
                clearTimeout(timeoutHandle);
                seqNum--;
            }
        }, 3000) // Espera 3 segundos para processar a resposta -> somente para observar o processo mais lentamente
    }
});