export function calculateChecksum(message) {
    let checksum = 0;
    for (let i = 0; i < message.length; i++) {
        checksum += message.charCodeAt(i);
    }
    return checksum;
}