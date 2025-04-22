// AES Encryption/Decryption with AES-256-GCM using random Initialization Vector + Salt
// ----------------------------------------------------------------------------------------
// the encrypted datablock is base64 encoded for easy data exchange.
// if you have the option to store data binary save consider to remove the encoding to reduce storage size
// ----------------------------------------------------------------------------------------
// format of encrypted data - used by this example. not an official format
//
// +--------------------+-----------------------+----------------+----------------+
// | SALT               | Initialization Vector | Auth Tag       | Payload        |
// | Used to derive key | AES GCM XOR Init      | Data Integrity | Encrypted Data |
// | 64 Bytes, random   | 16 Bytes, random      | 16 Bytes       | (N-96) Bytes   |
// +--------------------+-----------------------+----------------+----------------+
//
// ----------------------------------------------------------------------------------------
// Input/Output Vars
//
// MASTERKEY: the key used for encryption/decryption.
//            it has to be cryptographic safe - this means randomBytes or derived by pbkdf2 (for example)
// TEXT:      data (utf8 string) which should be encoded. modify the code to use Buffer for binary data!
// ENCDATA:   encrypted data as base64 string (format mentioned on top)

import {
  pbkdf2Sync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";

const PBKDF_ROUNDs = 2145;

/**
 * Encrypts text by given key
 * @param String text to encrypt
 * @param Buffer masterkey
 * @returns String encrypted text, base64 encoded
 */
export function encrypt(
  data: string,
  masterkey: Uint8Array<ArrayBufferLike>,
): Uint8Array<ArrayBuffer> {
  // random initialization vector
  const iv = randomBytes(16);
  // random salt
  const salt = randomBytes(64);

  // derive encryption key: 32 byte key length
  // in assumption the masterkey is a cryptographic and NOT a password there is no need for
  // a large number of iterations. It may can replaced by HKDF
  // the value of PBKDF_ROUNDs is randomly chosen!
  const key = pbkdf2Sync(masterkey, salt, PBKDF_ROUNDs, 32, "sha512");

  // AES 256 GCM Mode
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  // encrypt the given data
  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);

  // extract the auth tag
  const tag = cipher.getAuthTag();

  // generate output
  return Buffer.concat([salt, iv, tag, encrypted]);
}

/**
 * Decrypts text by given key
 * @param String base64 encoded input data
 * @param Buffer masterkey
 * @returns String decrypted (original) text
 */
export function decrypt(
  encdata: Uint8Array<ArrayBufferLike>,
  masterkey: Uint8Array<ArrayBufferLike>,
): string {
  // convert data to buffers
  const salt = encdata.slice(0, 64);
  const iv = encdata.slice(64, 80);
  const tag = encdata.slice(80, 96);
  const text = encdata.slice(96);

  // derive key using; 32 byte key length
  const key = pbkdf2Sync(masterkey, salt, PBKDF_ROUNDs, 32, "sha512");

  // AES 256 GCM Mode
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  // encrypt the given text
  const decrypted =
    decipher.update(text, undefined, "utf8") + decipher.final("utf8");

  return decrypted;
}
