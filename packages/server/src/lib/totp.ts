import { TOTP } from "otpauth"

export function generateTotpSecret(email: string): { secret: string; uri: string } {
  const totp = new TOTP({
    issuer: "Amanah",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  })

  const secret = totp.secret.base32
  const uri = totp.toString()

  return { secret, uri }
}

export function verifyTotpToken(secret: string, token: string): boolean {
  const totp = new TOTP({
    issuer: "Amanah",
    label: "",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret,
  })

  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}
