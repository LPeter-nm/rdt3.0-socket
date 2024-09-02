import dgram from 'node:dgram'
import { calculateChecksum } from './checksum.js';
import { setReceivedMessage } from './intermediary.js'

// Criando um socket UDP com IPv4 para receber mensagens
const receiver = dgram.createSocket('udp4');

let expectedNum = 0; // Número de sequência esperado
let pkt = [] // Array para armazenar pacotes recebidos

// Evento disparado quando uma mensagem é recebida no socket UDP
receiver.on('message', (rcvpkt, rinfo) => {
    console.log('======== Destinatário em ação ========')
    // Converte o pacote recebido para uma string
    const rdt_rcv = rcvpkt.toString();

    // Converte a string JSON para um objeto
    const jsonrdt_rcv = JSON.parse(rdt_rcv);

    // Extrai o número de sequência do pacote
    const seqNum = rdt_rcv.slice(10, 11);

    // Calcula o checksum da mensagem recebida para verificar a integridade
    const checksumRcv = calculateChecksum(jsonrdt_rcv.data);

    // Verifica se o número de sequência foi extraído corretamente
    if (!seqNum) {
        console.log('Erro de posição do seqNum');
    }

    if(jsonrdt_rcv.data === ""){
        console.log("Pacotes sem dados!");
    } 

    // Verifica se o número de sequência esperado é 0
    if (expectedNum == 0) {
        setTimeout(() => {
            // Verifica se o pacote recebido é o esperado e se o checksum é válido
            if (rdt_rcv && Number(seqNum) == 0 && checksumRcv == jsonrdt_rcv.checksum) {
                console.log('------- Mensagem recebida sem erro --------')
                console.log(`Sequência: ${jsonrdt_rcv.seqNum}`)
                console.log(`Mensagem: ${jsonrdt_rcv.data}`)
                console.log(`Checksum: ${jsonrdt_rcv.checksum}`)

                const extract = jsonrdt_rcv.data;

                // Adiciona o pacote ao array de pacotes recebidos
                pkt.push(extract);

                // Cria um pacote de confirmação (ACK) para enviar de volta ao remetente
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 0,
                    checksum: jsonrdt_rcv.checksum
                }

                // Envia a mensagem recebida ao intermediário
                const lengthMessage = extract.length;
                setReceivedMessage(extract, lengthMessage);

                // Converte o pacote de confirmação para uma string JSON
                const sndpkt = JSON.stringify(make_pkt);
                console.log('-------------------------------------------')
                console.log('Mensagem sendo enviada...\n');

                // Envia o pacote de confirmação para o remetente
                receiver.send(sndpkt, rinfo.port, rinfo.address);

                // Incrementa o número de sequência esperado
                expectedNum++;
            }
            // Caso o número de sequência seja 1 ou o pacote tenha sido recebido anteriormente
            else if (rdt_rcv && (Number(seqNum) == 1 && pkt.some(pkt => pkt === jsonrdt_rcv.message) || checksumRcv == jsonrdt_rcv.checksum)) {
                console.log('---- Sequência incorreta ----')
                console.log(`Sequência: ${jsonrdt_rcv.seqNum}`)
                // Cria um pacote de confirmação para retransmissão
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 1,
                    checksum: jsonrdt_rcv.checksum
                }

                // Converte o pacote de confirmação para uma string JSON
                const sndpkt = JSON.stringify(make_pkt);
                console.log('A sequência está incorreta, mas o pacote chegou');
                console.log('Mensagem duplicada detectada, reenviando ACK\n');

                // Envia o pacote de confirmação para o remetente
                receiver.send(sndpkt, rinfo.port, rinfo.address);

                // Volta ao 1 para que o pacote seja enviado na sequência certa
                expectedNum++
            }
        }, 3000); // Espera 3 segundos para processar a resposta -> somente para observar o processo mais lentamente

    }
    // Verifica se o número de sequência esperado é 1
    else if (expectedNum == 1) {
        setTimeout(() => {
            // Verifica se o pacote recebido é o esperado e se o checksum é válido
            if (rdt_rcv && Number(seqNum) == 1 && checksumRcv == jsonrdt_rcv.checksum) {
                console.log('------- Mensagem recebida sem erro --------')
                console.log(`Sequência: ${jsonrdt_rcv.seqNum}`)
                console.log(`Mensagem: ${jsonrdt_rcv.data}`)
                console.log(`Checksum: ${jsonrdt_rcv.checksum}`)

                const extract = jsonrdt_rcv.data;

                // Adiciona o pacote ao array de pacotes recebidos
                pkt.push(extract);

                // Cria um pacote de confirmação (ACK) para enviar de volta ao remetente
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 1,
                    checksum: jsonrdt_rcv.checksum
                }

                // Envia a mensagem recebida ao intermediário
                const lengthMessage = extract.length;
                setReceivedMessage(extract, lengthMessage);

                // Converte o pacote de confirmação para uma string JSON
                const sndpkt = JSON.stringify(make_pkt);
                console.log('-------------------------------------------')
                console.log('Mensagem sendo enviada...\n');

                // Envia o pacote de confirmação para o remetente
                receiver.send(sndpkt, rinfo.port, rinfo.address);

                // Decrementa o número de sequência esperado
                expectedNum--;
            }
            // Caso o número de sequência seja 0 ou o pacote tenha sido recebido anteriormente
            else if (rdt_rcv && (Number(seqNum) == 0 && pkt.some(pkt => pkt === jsonrdt_rcv.message) || checksumRcv == jsonrdt_rcv.checksum)) {
                console.log('---- Sequência incorreta ----')
                console.log(`Sequência: ${jsonrdt_rcv.seqNum}`)
                // Cria um pacote de confirmação para retransmissão
                const make_pkt = {
                    confirm: 'ACK',
                    seqNum: 0,
                    checksum: jsonrdt_rcv.checksum
                }

                // Converte o pacote de confirmação para uma string JSON
                const sndpkt = JSON.stringify(make_pkt);
                console.log('A sequência está incorreta, mas o pacote chegou');
                console.log('Mensagem duplicada detectada, reenviando ACK\n');

                // Envia o pacote de confirmação para o remetente
                receiver.send(sndpkt, rinfo.port, rinfo.address);

                // Volta ao 0 para que o pacote seja enviado na sequência certa
                expectedNum--
            }
        }, 3000); // Espera 3 segundos para processar a resposta -> somente para observa o processo mais lentamente 
    }

})

// Faz o binding do socket à porta 41234, tornando-o pronto para receber mensagens
receiver.bind(41234, () => {
    console.log("Servidor UDP escutando na porta 41234.");
});
