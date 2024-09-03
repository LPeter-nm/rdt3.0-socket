import dgram from 'node:dgram';
import { calculateChecksum } from './checksum.js';
import { setReceivedMessage } from './intermediary.js';

// Criando um socket UDP com IPv4 para enviar e receber mensagens
const sender = dgram.createSocket('udp4')

// Número de sequência do pacote, usado para rastrear a ordem dos pacotes enviados
let seqNum = 0;
let messageHist; // Historico de mensagem
let sndpkt; // Pacote que será enviado
let checksum; // Checksum para verificar a integridade dos dados
let timeoutHandle; // Identificador do timeout para retransmissão
let make_pkt; // JSON do pacote que terá seqNum, data e checksum
let timeoutLimit = 0;
let errorLimit = 0;

// Função de simulação de ACK corrompido
function errorAck(rdt_rcv){
    if(errorLimit >= 2){
        errorLimit = 0
        setReceivedMessage(rdt_rcv.data, rdt_rcv.data.length);
        return 'Limite atingido';
    }
    setReceivedMessage("ACK corrompido", 0);
    rdt_rcv.confirm = ""

    return rdt_rcv;
}

// Função para enviar uma mensagem ao destinatário
export function sendMessage(message) {
    // Mensagem que será enviada
    messageHist = message;
    const rdt_send = message;

    // Calcula o checksum da mensagem
    checksum = calculateChecksum(rdt_send);

    // Cria o pacote com número de sequência, dados e checksum
    make_pkt = {
        seqNum: seqNum,
        data: message,
        checksum: checksum
    };

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

        make_pkt = {
            seqNum: seqNum,
            data: messageHist,
            checksum: checksum
        };

        sndpkt = JSON.stringify(make_pkt);
    
        // Define o timeout para retransmitir o pacote após 10 segundos, se necessário
        timeoutHandle = setTimeout(() => {
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
    // Converte a mensagem recebida de volta para string
    const stringMessage = rcvpkt.toString();

    // Parseia a mensagem JSON recebida de volta para um objeto
    const rdt_rcv = JSON.parse(stringMessage);

    // Simulação de ack corrompido
    // errorAck(rdt_rcv);

    // Verifica o número de sequência atual
    if (seqNum == 0) {
        setTimeout(() => {
            if(rdt_rcv && rdt_rcv.confirm == ""){
                console.log('------- ACK corrompido --------')
                console.log('----------------------------------------')
                console.log('Fechando socket para revisão...\n');
                
                clearTimeout(timeoutHandle);
                sender.close();
                console.log("Socket fechado || reinicie e revise")
                
            }
            // Verifica se o pacote foi recebido corretamente
            else if (rdt_rcv && rdt_rcv.checksum == checksum && rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0) {
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

                make_pkt = {
                    seqNum: seqNum,
                    data: messageHist,
                    checksum: checksum
                };
        
                sndpkt = JSON.stringify(make_pkt);

                // Retransmite o pacote
                sender.send(sndpkt, rinfo.port, rinfo.address);
            }
        }, 2000) // Espera 2 segundos para processar a resposta -> somente para observar o processo mais lentamente
    }
    // Caso o número de sequência seja 1
    else if (seqNum == 1) {
        setTimeout(() => {
            if(rdt_rcv && rdt_rcv.confirm == ""){
                console.log('------- ACK corrompido --------')
                console.log('----------------------------------------')
                console.log('Fechando socket para revisão...\n');
                
                clearTimeout(timeoutHandle);
                sender.close();
                console.log("Socket fechado || reinicie e revise")
                
            }
            // Verifica se o pacote foi recebido corretamente
            else if (rdt_rcv && (rdt_rcv.confirm == 'ACK' && rdt_rcv.seqNum == 0 || rdt_rcv.checksum != checksum)) {
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

                make_pkt = {
                    seqNum: seqNum,
                    data: messageHist,
                    checksum: checksum
                };
        
                // execErrorPktNull();
        
                sndpkt = JSON.stringify(make_pkt);

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
        }, 2000) // Espera 2 segundos para processar a resposta -> somente para observar o processo mais lentamente
    }
});