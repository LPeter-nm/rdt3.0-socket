import crypto from 'node:crypto';

/**
 * Cria o checksum do pacote (MUST-HAVE DO-NOT-CHANGE)
 *
 * @param {Buffer} packet_wo_checksum - Os dados do pacote (incluindo cabeçalhos, exceto pelo campo de checksum)
 * @returns {Buffer} - O checksum em bytes
 */
export function createChecksum(packet_wo_checksum) {
    let checksum = 0;
    // Agrupa os dados a cada 2 bytes e soma todos os grupos
    for (let i = 0; i < packet_wo_checksum.length; i += 2) {
        if (i + 1 >= packet_wo_checksum.length) {
            // Caso de número ímpar - preenche o byte 'faltante' com 0s para completar 2 bytes
            checksum += packet_wo_checksum[i] << 8;
        } else {
            // Caso par
            checksum += (packet_wo_checksum[i] << 8) + packet_wo_checksum[i + 1];
        }
    }

    // Extrai o carryover e adiciona ao resultado
    let carryOver = Math.floor(checksum / 0x10000);
    checksum = (checksum & 0xffff) + carryOver;

    // Faz o complemento de 1 e mantém apenas 2 bytes
    checksum = (~checksum) & 0xffff;
    return Buffer.from([(checksum >> 8) & 0xff, checksum & 0xff]);
}

/**
 * Verifica o checksum do pacote (MUST-HAVE DO-NOT-CHANGE)
 *
 * @param {Buffer} packet - O pacote inteiro (incluindo o checksum original)
 * @returns {boolean} - Verdadeiro se o checksum do pacote for o mesmo especificado no campo de checksum, falso caso contrário
 */
export function verifyChecksum(packet) {
    let packetSum = 0;
    // Soma o pacote a cada 2 bytes - incluindo o checksum
    for (let i = 0; i < packet.length; i += 2) {
        if (i + 1 >= packet.length) {
            // Caso de número ímpar - adiciona padding (8 bits de 0s) para completar 2 bytes
            packetSum += (packet[i] << 8);
        } else {
            // Caso par
            packetSum += (packet[i] << 8) + packet[i + 1];
        }
    }

    // Adiciona o carryover
    let carryOver = Math.floor(packetSum / 0x10000);
    packetSum = (packetSum & 0xffff) + carryOver;

    // A soma da internet + checksum deve ser 0xffff se o pacote não estiver corrompido
    return packetSum === 0xffff;
}

/**
 * Cria um pacote (MUST-HAVE DO-NOT-CHANGE)
 *
 * @param {string} dataStr - A string dos dados (a ser colocada na área de Dados)
 * @param {number} ackNum - Um int que indica se este pacote é um pacote ACK (1: ack, 0: não ack)
 * @param {number} seqNum - Um int que indica o número da sequência, ou seja, 0 ou 1
 * @returns {Buffer} - Um pacote criado em bytes
 */
export function makePacket(dataStr, ackNum, seqNum) {
    const dummyHeader = Buffer.from('COMPNETW'); // Porção dummy do cabeçalho em bytes

    // Handle length
    const headerLen = 12;
    const packetLen = headerLen + Buffer.byteLength(dataStr);  // comprimento total do pacote

    // Handle ack e seq #
    const packetLenWithAck = (packetLen << 1) + ackNum;
    const packetLenWithAckSeq = (packetLenWithAck << 1) + seqNum;
    const packetLenBytes = Buffer.from([(packetLenWithAckSeq >> 8) & 0xff, packetLenWithAckSeq & 0xff]);

    // Dados reais do pacote
    const dataBytes = Buffer.from(dataStr, 'utf-8');

    // Cria o checksum
    const packet_wo_checksum = Buffer.concat([dummyHeader, packetLenBytes, dataBytes]);
    const checksum = createChecksum(packet_wo_checksum);

    // Monta o pacote final
    return Buffer.concat([dummyHeader, checksum, packetLenBytes, dataBytes]);
}

