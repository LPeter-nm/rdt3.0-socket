export function calculateChecksum(message) {
    let checksum = 0;

    // Loop através de cada caractere da mensagem
    for (let i = 0; i < message.length; i++) {
        // Obtém o código ASCII do caractere e o adiciona ao checksum
        checksum += message.charCodeAt(i);
    }

    // Retorna o checksum calculado
    return checksum;
}
