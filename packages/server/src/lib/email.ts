import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import type { SentMessageInfo } from "nodemailer/lib/smtp-transport"

let transporter: Transporter<SentMessageInfo> | null = null

function getTransporter(): Transporter<SentMessageInfo> {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Amanah app <alat.donlot@gmail.com>"
const APP_URL = process.env.APP_URL ?? "https://amanah.app"

function escapeHtml(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function wrapSubject(subject: string): string {
  return `[AMANAH app] ${subject}`
}

function emailTemplate(html: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <div style="background-color: #1B4332; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Amanah</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0; font-size: 13px;">Qardhul Hasan Digital</p>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        ${html}
      </div>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">Email ini dikirim secara otomatis oleh Amanah app. Mohon tidak membalas email ini.</p>
        <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0;">&copy; ${new Date().getFullYear()} Amanah — Pinjaman Kebajikan Tanpa Riba</p>
      </div>
    </div>
  `
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV] Email to ${to}: ${subject}`)
    console.log(`[DEV] ${html}`)
    return
  }

  await getTransporter().sendMail({
    from: FROM_EMAIL,
    to,
    subject: wrapSubject(subject),
    html: emailTemplate(html),
  })
}

export async function sendWelcomeEmail(email: string, displayName: string | null): Promise<void> {
  await sendEmail(
    email,
    "Selamat Datang di Amanah",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Selamat Datang!</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>Terima kasih telah bergabung di <strong>Amanah</strong>. Platform ini membantu Anda mencatat Qardhul Hasan (pinjaman kebajikan) dengan transparansi dan menjaga privasi peminjam.</p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #1B4332; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534;">💡 <strong>Tips:</strong> Anda bisa mulai mencatat pinjaman pertama Anda sekarang dari dashboard.</p>
    </div>
    <p style="color: #64748b;">Semoga memudahkan Anda dalam beramal kebajikan.</p>
    `
  )
}

export async function sendEmailVerification(email: string, displayName: string | null, verificationUrl: string): Promise<void> {
  await sendEmail(
    email,
    "Verifikasi Email",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Verifikasi Email Anda</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>Terima kasih telah mendaftar di Amanah. Untuk mengaktifkan akun Anda, silakan verifikasi email dengan klik tombol di bawah:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background-color: #1B4332; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Verifikasi Email
      </a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Link ini berlaku selama 24 jam. Jika Anda tidak mendaftar di Amanah, abaikan email ini.</p>
    `
  )
}

export async function sendLoanCreatedEmail(email: string, borrowerAlias: string, amount: number, loanCode: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Pinjaman Berhasil Dibuat",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Pinjaman Berhasil Dibuat</h2>
    <p>Pinjaman baru telah berhasil dicatat:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Kode Pinjaman</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(loanCode)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Peminjam</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(borrowerAlias)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1B4332;">${formattedAmount}</td></tr>
    </table>
    <p style="color: #64748b;">Anda bisa melihat detail pinjaman di aplikasi Amanah.</p>
    `
  )
}

export async function sendPaymentReminderEmail(email: string, borrowerAlias: string, amount: number, periodLabel: string, dueDate: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Pengingat Cicilan",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Pengingat Cicilan</h2>
    <p>Cicilan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong> akan jatuh tempo:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Periode</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(periodLabel)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${formattedAmount}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Jatuh Tempo</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(dueDate)}</td></tr>
    </table>
    <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">⏰ <strong>Pengingat:</strong> Segera lakukan pembayaran sesuai jadwal.</p>
    </div>
    `
  )
}

export async function sendBorrowerReminderEmail(email: string, borrowerAlias: string, amount: number, periodLabel: string, dueDate: string, daysLeft: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  const title = daysLeft === 0 ? "Jatuh Tempo Hari Ini!" : `Pengingat: ${daysLeft} Hari Lagi`
  await sendEmail(
    email,
    title,
    `
    <h2 style="color: #1B4332; margin-top: 0;">${escapeHtml(title)}</h2>
    <p>Halo ${escapeHtml(borrowerAlias)},</p>
    ${daysLeft === 0
      ? `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; border-radius: 4px;"><p style="margin: 0; color: #991b1b; font-weight: 600;">⚠️ Cicilan <strong>${escapeHtml(periodLabel)}</strong> jatuh tempo hari ini.</p></div>`
      : `<p>Cicilan <strong>${escapeHtml(periodLabel)}</strong> akan jatuh tempo dalam <strong>${daysLeft} hari</strong>.</p>`
    }
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${formattedAmount}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Jatuh Tempo</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(dueDate)}</td></tr>
    </table>
    <p style="color: #64748b;">Segera lakukan pembayaran dan upload bukti transfer di aplikasi Amanah.</p>
    `
  )
}

export async function sendPaymentConfirmedEmail(email: string, periodLabel: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Cicilan Dikonfirmasi Lunas",
    `
    <h2 style="color: #1B4332; margin-top: 0;">✅ Cicilan Dikonfirmasi</h2>
    <p>Cicilan <strong>${escapeHtml(periodLabel)}</strong> telah dikonfirmasi lunas.</p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #1B4332; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-size: 18px; font-weight: 700;">${formattedAmount}</p>
    </div>
    <p style="color: #64748b;">Terima kasih atas pembayaran Anda.</p>
    `
  )
}

export async function sendPaymentRejectedEmail(email: string, periodLabel: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Bukti Transfer Ditolak",
    `
    <h2 style="color: #dc2626; margin-top: 0;">❌ Bukti Transfer Ditolak</h2>
    <p>Bukti transfer untuk cicilan <strong>${escapeHtml(periodLabel)}</strong> ditolak oleh pemberi pinjaman.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Periode</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(periodLabel)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${formattedAmount}</td></tr>
    </table>
    <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">📤 Silakan upload ulang bukti transfer yang valid di aplikasi Amanah.</p>
    </div>
    `
  )
}

export async function sendLoanApprovedEmail(email: string, borrowerAlias: string, amount: number, loanCode: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Pinjaman Disetujui",
    `
    <h2 style="color: #1B4332; margin-top: 0;">✅ Pinjaman Disetujui</h2>
    <p>Pinjaman untuk <strong>${escapeHtml(borrowerAlias)}</strong> telah disetujui.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Kode Pinjaman</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(loanCode)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1B4332;">${formattedAmount}</td></tr>
    </table>
    <p style="color: #64748b;">Silakan cek aplikasi untuk detail selanjutnya.</p>
    `
  )
}

export async function sendLoanRejectedEmail(email: string, borrowerAlias: string, reason: string | null): Promise<void> {
  await sendEmail(
    email,
    "Pinjaman Ditolak",
    `
    <h2 style="color: #dc2626; margin-top: 0;">❌ Pinjaman Ditolak</h2>
    <p>Pinjaman untuk <strong>${escapeHtml(borrowerAlias)}</strong> tidak dapat disetujui.</p>
    ${reason ? `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; border-radius: 4px;"><p style="margin: 0; color: #991b1b;"><strong>Alasan:</strong> ${escapeHtml(reason)}</p></div>` : ""}
    <p style="color: #64748b;">Anda bisa mengajukan pinjaman baru setelah memperbaiki persyaratan.</p>
    `
  )
}

export async function sendLoanCompletedEmail(email: string, borrowerAlias: string, amount: number, loanCode: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Pinjaman Lunas!",
    `
    <h2 style="color: #1B4332; margin-top: 0;">🎉 Pinjaman Lunas!</h2>
    <p>Semua cicilan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong> telah lunas.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Kode Pinjaman</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(loanCode)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1B4332;">${formattedAmount}</td></tr>
    </table>
    <div style="background-color: #f0fdf4; border-left: 4px solid #1B4332; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534;">🤲 Semoga Allah membalas kebaikan Anda.</p>
    </div>
    `
  )
}

export async function sendTrusteeInvitationEmail(email: string, lenderName: string, loanId?: string): Promise<void> {
  const trusteeUrl = loanId ? `${APP_URL}/trustee` : `${APP_URL}/trustee`
  await sendEmail(
    email,
    "Undangan Menjadi Wali Amanah",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Undangan Wali Amanah</h2>
    <p><strong>${escapeHtml(lenderName)}</strong> mengundang Anda untuk menjadi wali amanah di Amanah.</p>
    <p style="color: #64748b; margin: 16px 0;">Silakan klik tombol di bawah untuk melihat dan mengelola permintaan wali amanah Anda.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${trusteeUrl}" style="display: inline-block; background-color: #1B4332; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Buka Dashboard Wali
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 12px;">Jika Anda tidak merasa diundang, abaikan email ini.</p>
    `
  )
}

export async function sendLoanInvitationEmail(email: string, borrowerAlias: string, amount: number, lenderName: string, token: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  const invitationUrl = `${APP_URL}/invite/${token}`
  await sendEmail(
    email,
    "Undangan Pinjaman",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Undangan Pinjaman</h2>
    <p><strong>${escapeHtml(lenderName)}</strong> mengundang Anda untuk menjadi peminjam di Amanah.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${formattedAmount}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Alias</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(borrowerAlias)}</td></tr>
    </table>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${invitationUrl}" style="display: inline-block; background-color: #1B4332; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Lihat Undangan
      </a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Undangan ini berlaku selama 7 hari. Jika Anda belum punya akun, Anda akan diarahkan untuk mendaftar sebagai peminjam.</p>
    `
  )
}

export async function sendPasswordResetEmail(email: string, displayName: string | null, resetUrl: string): Promise<void> {
  await sendEmail(
    email,
    "Reset Password",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Reset Password</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>Anda meminta untuk mereset password akun Amanah Anda. Klik tombol di bawah untuk membuat password baru:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #1B4332; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Reset Password
      </a>
    </div>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 13px;">⚠️ Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
    </div>
    `
  )
}

export async function sendCollateralVerifiedEmail(email: string, borrowerAlias: string, trusteeName: string): Promise<void> {
  await sendEmail(
    email,
    "Jaminan Diverifikasi",
    `
    <h2 style="color: #1B4332; margin-top: 0;">✅ Jaminan Diverifikasi</h2>
    <p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> telah memverifikasi jaminan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p>
    <p style="color: #64748b;">Pinjaman akan segera diproses setelah verifikasi selesai.</p>
    `
  )
}

export async function sendTrusteeRequestEmail(email: string, borrowerAlias: string, lenderName: string, loanId: string): Promise<void> {
  await sendEmail(
    email,
    "Permintaan Wali Amanah Baru",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Permintaan Wali Amanah</h2>
    <p><strong>${escapeHtml(lenderName)}</strong> meminta Anda menjadi wali amanah untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p>
    <p style="color: #64748b;">Silakan cek dashboard wali amanah Anda untuk meninjau permintaan ini.</p>
    `
  )
}

export async function sendTrusteeResponseEmail(email: string, borrowerAlias: string, trusteeName: string, action: "accepted" | "declined"): Promise<void> {
  const title = action === "accepted" ? "Wali Amanah Menerima" : "Wali Amanah Menolak"
  const color = action === "accepted" ? "#1B4332" : "#dc2626"
  const message = action === "accepted"
    ? `<p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> telah menerima permintaan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p><p style="color: #64748b;">Jaminan sekarang dalam status dipegang oleh wali amanah.</p>`
    : `<p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> menolak permintaan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p><p style="color: #64748b;">Silakan cari wali amanah lain.</p>`

  await sendEmail(
    email,
    title,
    `
    <h2 style="color: ${color}; margin-top: 0;">${escapeHtml(title)}</h2>
    ${message}
    `
  )
}

export async function sendCollateralReturnedEmail(email: string, borrowerAlias: string, trusteeName: string): Promise<void> {
  await sendEmail(
    email,
    "Jaminan Dikembalikan",
    `
    <h2 style="color: #1B4332; margin-top: 0;">✅ Jaminan Dikembalikan</h2>
    <p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> telah mengembalikan jaminan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p>
    <p style="color: #64748b;">Pinjaman telah lunas dan jaminan telah dikembalikan kepada peminjam.</p>
    `
  )
}

export async function sendRoleChangeApprovedEmail(email: string, displayName: string | null, oldRole: string, newRole: string): Promise<void> {
  const roleLabel = (role: string) => {
    const map: Record<string, string> = { lender: "Pemberi Pinjaman", borrower: "Peminjam", trustee: "Wali Amanah", admin: "Admin" }
    return map[role] || role
  }
  await sendEmail(
    email,
    "Peran Diubah",
    `
    <h2 style="color: #1B4332; margin-top: 0;">✅ Permintaan Perubahan Peran Disetujui</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>Permintaan perubahan peran Anda telah <strong>disetujui</strong> oleh admin.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Peran Lama</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${roleLabel(oldRole)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Peran Baru</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1B4332;">${roleLabel(newRole)}</td></tr>
    </table>
    <p style="color: #64748b;">Silakan masuk kembali ke aplikasi untuk melihat perubahan.</p>
    `
  )
}

export async function sendRoleChangeRejectedEmail(email: string, displayName: string | null, requestedRole: string): Promise<void> {
  const roleLabel = (role: string) => {
    const map: Record<string, string> = { lender: "Pemberi Pinjaman", borrower: "Peminjam", trustee: "Wali Amanah", admin: "Admin" }
    return map[role] || role
  }
  await sendEmail(
    email,
    "Permintaan Perubahan Peran Ditolak",
    `
    <h2 style="color: #dc2626; margin-top: 0;">❌ Permintaan Ditolak</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>Permintaan perubahan peran Anda ke <strong>${roleLabel(requestedRole)}</strong> <strong>ditolak</strong> oleh admin.</p>
    <p style="color: #64748b;">Jika Anda memiliki pertanyaan, silakan hubungi admin Amanah.</p>
    `
  )
}

export async function sendContractGeneratedEmail(email: string, displayName: string | null, loanCode: string, borrowerAlias: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Kontrak Pinjaman Dibuat",
    `
    <h2 style="color: #1B4332; margin-top: 0;">Kontrak Pinjaman Dibuat</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>Kontrak pinjaman untuk <strong>${escapeHtml(borrowerAlias)}</strong> telah dibuat.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Kode Pinjaman</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(loanCode)}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nominal</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${formattedAmount}</td></tr>
    </table>
    <p style="color: #64748b;">Kontrak dapat diunduh melalui aplikasi Amanah.</p>
    `
  )
}

export async function sendAutoDeleteNotificationEmail(email: string, displayName: string | null, entityType: string, reason: string): Promise<void> {
  await sendEmail(
    email,
    "Notifikasi Penghapusan Data",
    `
    <h2 style="color: #dc2626; margin-top: 0;">Penghapusan Data</h2>
    <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
    <p>${escapeHtml(entityType)} Anda telah dihapus secara otomatis oleh sistem.</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b;"><strong>Alasan:</strong> ${escapeHtml(reason)}</p>
    </div>
    <p style="color: #64748b;">Jika ini adalah kesalahan, silakan hubungi admin Amanah.</p>
    `
  )
}
