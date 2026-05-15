import { Resend } from "resend"

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY!)
  }
  return resendInstance
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Amanah <no-reply@amanah.app>"
const APP_URL = process.env.APP_URL ?? "https://amanah.app"

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Email to ${to}: ${subject}`)
    return
  }

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  })
}

export async function sendWelcomeEmail(email: string, displayName: string | null): Promise<void> {
  await sendEmail(
    email,
    "Selamat Datang di Amanah",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Selamat Datang di Amanah</h2>
      <p>Halo ${displayName || "Sahabat"},</p>
      <p>Terima kasih telah bergabung di Amanah. Semoga memudahkan Anda dalam mencatat pinjaman kebajikan.</p>
      <p style="color: #64748B;">Anda bisa mulai mencatat pinjaman pertama Anda sekarang.</p>
    </div>
    `
  )
}

export async function sendLoanCreatedEmail(email: string, borrowerAlias: string, amount: number, loanId: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    `Pinjaman Berhasil Dibuat`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Pinjaman Berhasil Dibuat</h2>
      <p>Peminjam: <strong>${borrowerAlias}</strong></p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p style="color: #64748B;">Anda bisa melihat detail pinjaman di aplikasi Amanah.</p>
    </div>
    `
  )
}

export async function sendPaymentReminderEmail(email: string, borrowerAlias: string, amount: number, periodLabel: string, dueDate: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    `Pengingat Cicilan`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Pengingat Cicilan</h2>
      <p>Cicilan untuk pinjaman <strong>${borrowerAlias}</strong> akan jatuh tempo.</p>
      <p>Periode: <strong>${periodLabel}</strong></p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p>Jatuh tempo: <strong>${dueDate}</strong></p>
      <p style="color: #64748B;">Segera lakukan pembayaran sesuai jadwal.</p>
    </div>
    `
  )
}

export async function sendPaymentConfirmedEmail(email: string, periodLabel: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    `Cicilan ${periodLabel} Lunas`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Cicilan Dikonfirmasi</h2>
      <p>Cicilan <strong>${periodLabel}</strong> telah dikonfirmasi lunas.</p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
    </div>
    `
  )
}

export async function sendTrusteeInvitationEmail(email: string, lenderName: string): Promise<void> {
  await sendEmail(
    email,
    "Undangan Menjadi Wali Amanah",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Undangan Wali Amanah</h2>
      <p>${lenderName} mengundang Anda untuk menjadi wali amanah di Amanah.</p>
      <p style="color: #64748B;">Silakan buka aplikasi untuk menerima atau menolak undangan ini.</p>
    </div>
    `
  )
}

export async function sendLoanCompletedEmail(email: string, borrowerAlias: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    `Pinjaman Lunas!`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Pinjaman Lunas!</h2>
      <p>Semua cicilan untuk pinjaman <strong>${borrowerAlias}</strong> telah lunas.</p>
      <p>Total: <strong>${formattedAmount}</strong></p>
      <p style="color: #64748B;">Semoga Allah membalas kebaikan Anda.</p>
    </div>
    `
  )
}

export async function sendLoanInvitationEmail(email: string, borrowerAlias: string, amount: number, lenderName: string, token: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  const invitationUrl = `${APP_URL}/invite/${token}`
  await sendEmail(
    email,
    `Undangan Pinjaman dari ${lenderName}`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Undangan Pinjaman</h2>
      <p><strong>${lenderName}</strong> mengundang Anda untuk menjadi peminjam di Amanah.</p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p>Alias: <strong>${borrowerAlias}</strong></p>
      <p style="color: #64748B; margin: 16px 0;">Undangan ini berlaku selama 7 hari.</p>
      <a href="${invitationUrl}" style="display: inline-block; background-color: #1B4332; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Lihat Undangan
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Jika Anda belum punya akun, Anda akan diarahkan untuk mendaftar sebagai peminjam.</p>
    </div>
    `
  )
}