const SECRET_FILE = /(?<!\w)\.env\b|\.vars\b|\b(?:local|secrets)\.(?:bash|fish)\b|\.(?:ssh|aws|gnupg)\/|\.netrc\b|\.npmrc\b|\.(?:pem|p12|pfx|key)(?=["'\s]|$)|\bid_(?:rsa|ed25519|ecdsa)\b|\bcredentials\b/

const PRIVATE_KEY_BLOCK = /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g

// A name that says secret, followed by a value, in any format: KEY=value, "key": "value", key: value.
const SECRET_NAME = /(?:token|secret|passw(?:or)?d|api[_-]?key|private[_-]?key|credential|authorization)\w*["']?\s*[:=]/i

const SECRET_VALUE = /\bBearer\s+\S|\b(?:sk|xai|ghp|gho|github_pat|xox[abp])[-_][\w-]{16,}/

/** True when a tool input or path names a file that holds secrets, so nothing from that call may reach Jev. */
export function isSecretFile(origin: string) {
  return SECRET_FILE.test(origin)
}

/** Removes private keys and every line that looks like it holds a secret, since Jev is an outside service. */
export function withoutSecrets(text: string) {
  return text
    .replace(PRIVATE_KEY_BLOCK, '')
    .split('\n')
    .filter(line => !SECRET_NAME.test(line) && !SECRET_VALUE.test(line))
    .join('\n')
}
