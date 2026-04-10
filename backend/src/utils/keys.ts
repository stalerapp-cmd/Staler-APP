
import * as nacl from 'tweetnacl';

export function generateReserveKeypair() {
  const keypair = nacl.sign.keyPair();
  
  const reserve_pub = bufferToBase32(keypair.publicKey);
  const reserve_priv = bufferToBase32(keypair.secretKey);
  
  return {
    reserve_pub,
    reserve_priv,
  };
}

function bufferToBase32(buffer: Uint8Array): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  
  return result;
}

export function base32ToBuffer(str: string): Uint8Array {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const result: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of str.toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return new Uint8Array(result);
}