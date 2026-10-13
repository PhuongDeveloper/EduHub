/**
 * Client-Side AES-256-GCM Zero-Knowledge Encryption
 * Protects teacher curriculum files and private lesson plans.
 * Plaintext never leaves the browser.
 */

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM key from user passphrase using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a text string with a user passphrase.
 * Returns { encryptedPayload, iv, salt }
 */
export async function encryptLesson(
  plainText: string,
  passphrase: string
): Promise<{ encryptedPayload: string; iv: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    enc.encode(plainText)
  );

  return {
    encryptedPayload: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

/**
 * Decrypts an encrypted payload with a user passphrase.
 */
export async function decryptLesson(
  encryptedPayload: string,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<string> {
  const dec = new TextDecoder();
  const salt = new Uint8Array(base64ToBuffer(saltBase64));
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const cipherBuffer = base64ToBuffer(encryptedPayload);

  const key = await deriveKey(passphrase, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    cipherBuffer as ArrayBuffer
  );

  return dec.decode(decryptedBuffer);
}
