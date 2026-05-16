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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

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
      <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
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
      <p>Peminjam: <strong>${escapeHtml(borrowerAlias)}</strong></p>
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
      <p>Cicilan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong> akan jatuh tempo.</p>
      <p>Periode: <strong>${escapeHtml(periodLabel)}</strong></p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p>Jatuh tempo: <strong>${escapeHtml(dueDate)}</strong></p>
      <p style="color: #64748B;">Segera lakukan pembayaran sesuai jadwal.</p>
    </div>
    `
  )
}

export async function sendPaymentConfirmedEmail(email: string, periodLabel: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    `Cicilan ${escapeHtml(periodLabel)} Lunas`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Cicilan Dikonfirmasi</h2>
      <p>Cicilan <strong>${escapeHtml(periodLabel)}</strong> telah dikonfirmasi lunas.</p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
    </div>
    `
  )
}

export async function sendTrusteeInvitationEmail(email: string, lenderName: string, loanId?: string): Promise<void> {
  const trusteeUrl = loanId
    ? `${APP_URL}/trustee`
    : `${APP_URL}/trustee`
  await sendEmail(
    email,
    "Undangan Menjadi Wali Amanah",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Undangan Wali Amanah</h2>
      <p>${escapeHtml(lenderName)} mengundang Anda untuk menjadi wali amanah di Amanah.</p>
      <p style="color: #64748B; margin: 16px 0;">Silakan klik tombol di bawah untuk melihat dan mengelola permintaan wali amanah Anda.</p>
      <a href="${trusteeUrl}" style="display: inline-block; background-color: #1B4332; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Buka Dashboard Wali
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Jika Anda tidak merasa diundang, abaikan email ini.</p>
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
      <p>Semua cicilan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong> telah lunas.</p>
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
    `Undangan Pinjaman dari ${escapeHtml(lenderName)}`,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Undangan Pinjaman</h2>
      <p><strong>${escapeHtml(lenderName)}</strong> mengundang Anda untuk menjadi peminjam di Amanah.</p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p>Alias: <strong>${escapeHtml(borrowerAlias)}</strong></p>
      <p style="color: #64748B; margin: 16px 0;">Undangan ini berlaku selama 7 hari.</p>
      <a href="${invitationUrl}" style="display: inline-block; background-color: #1B4332; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Lihat Undangan
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Jika Anda belum punya akun, Anda akan diarahkan untuk mendaftar sebagai peminjam.</p>
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
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">${escapeHtml(title)}</h2>
      <p>Halo ${escapeHtml(borrowerAlias)},</p>
      ${daysLeft === 0
        ? `<p style="color: #dc2626; font-weight: 600;">Cicilan <strong>${escapeHtml(periodLabel)}</strong> jatuh tempo hari ini.</p>`
        : `<p>Cicilan <strong>${escapeHtml(periodLabel)}</strong> akan jatuh tempo dalam <strong>${daysLeft} hari</strong>.</p>`
      }
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p>Jatuh tempo: <strong>${escapeHtml(dueDate)}</strong></p>
      <p style="color: #64748B;">Segera lakukan pembayaran dan upload bukti transfer di aplikasi Amanah.</p>
    </div>
    `
  )
}

export async function sendPasswordResetEmail(email: string, displayName: string | null, resetUrl: string): Promise<void> {
  await sendEmail(
    email,
    "Reset Password Amanah",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Reset Password</h2>
      <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
      <p>Anda meminta untuk mereset password akun Amanah Anda.</p>
      <p style="color: #64748B; margin: 16px 0;">Link ini berlaku selama 1 jam.</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #1B4332; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Reset Password
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
    </div>
    `
  )
}

export async function sendPaymentRejectedEmail(email: string, periodLabel: string, amount: number): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Bukti Transfer Ditolak",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Bukti Transfer Ditolak</h2>
      <p>Bukti transfer untuk cicilan <strong>${escapeHtml(periodLabel)}</strong> ditolak oleh pemberi pinjaman.</p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p style="color: #64748B;">Silakan upload ulang bukti transfer yang valid di aplikasi Amanah.</p>
    </div>
    `
  )
}

export async function sendLoanApprovedEmail(email: string, borrowerAlias: string, amount: number, loanId: string): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
  await sendEmail(
    email,
    "Pinjaman Disetujui!",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Pinjaman Disetujui</h2>
      <p>Pinjaman untuk <strong>${escapeHtml(borrowerAlias)}</strong> telah disetujui.</p>
      <p>Nominal: <strong>${formattedAmount}</strong></p>
      <p style="color: #64748B;">Silakan cek aplikasi untuk detail selanjutnya.</p>
    </div>
    `
  )
}

export async function sendLoanRejectedEmail(email: string, borrowerAlias: string, reason: string | null): Promise<void> {
  await sendEmail(
    email,
    "Pinjaman Ditolak",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Pinjaman Ditolak</h2>
      <p>Pinjaman untuk <strong>${escapeHtml(borrowerAlias)}</strong> tidak dapat disetujui.</p>
      ${reason ? `<p>Alasan: <strong>${escapeHtml(reason)}</strong></p>` : ""}
      <p style="color: #64748B;">Anda bisa mengajukan pinjaman baru setelah memperbaiki persyaratan.</p>
    </div>
    `
  )
}

export async function sendCollateralVerifiedEmail(email: string, borrowerAlias: string, trusteeName: string): Promise<void> {
  await sendEmail(
    email,
    "Jaminan Diverifikasi",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Jaminan Diverifikasi</h2>
      <p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> telah memverifikasi jaminan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p>
      <p style="color: #64748B;">Pinjaman akan segera diproses setelah verifikasi selesai.</p>
    </div>
    `
  )
}

export async function sendTrusteeRequestEmail(email: string, borrowerAlias: string, lenderName: string, loanId: string): Promise<void> {
  await sendEmail(
    email,
    "Permintaan Wali Amanah Baru",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Permintaan Wali Amanah</h2>
      <p><strong>${escapeHtml(lenderName)}</strong> meminta Anda menjadi wali amanah untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p>
      <p style="color: #64748B;">Silakan cek dashboard wali amanah Anda untuk meninjau permintaan ini.</p>
    </div>
    `
  )
}

export async function sendTrusteeResponseEmail(email: string, borrowerAlias: string, trusteeName: string, action: "accepted" | "declined"): Promise<void> {
  const title = action === "accepted" ? "Wali Amanah Menerima" : "Wali Amanah Menolak"
  const color = action === "accepted" ? "#1B4332" : "#dc2626"
  const message = action === "accepted"
    ? `<p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> telah menerima permintaan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p><p style="color: #64748B;">Jaminan sekarang dalam status dipegang oleh wali amanah.</p>`
    : `<p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> menolak permintaan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p><p style="color: #64748B;">Silakan cari wali amanah lain.</p>`

  await sendEmail(
    email,
    title,
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: ${color};">${escapeHtml(title)}</h2>
      ${message}
    </div>
    `
  )
}

export async function sendCollateralReturnedEmail(email: string, borrowerAlias: string, trusteeName: string): Promise<void> {
  await sendEmail(
    email,
    "Jaminan Dikembalikan",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Jaminan Dikembalikan</h2>
      <p>Wali amanah <strong>${escapeHtml(trusteeName)}</strong> telah mengembalikan jaminan untuk pinjaman <strong>${escapeHtml(borrowerAlias)}</strong>.</p>
      <p style="color: #64748B;">Pinjaman telah lunas dan jaminan telah dikembalikan kepada peminjam.</p>
    </div>
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
    "Permintaan Perubahan Peran Disetujui",
    `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1B4332;">Peran Diubah</h2>
      <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
      <p>Permintaan perubahan peran Anda telah <strong>disetujui</strong> oleh admin.</p>
      <p>Peran Anda telah diubah dari <strong>${roleLabel(oldRole)}</strong> menjadi <strong>${roleLabel(newRole)}</strong>.</p>
      <p style="color: #64748B;">Silakan masuk kembali ke aplikasi untuk melihat perubahan.</p>
    </div>
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
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Permintaan Ditolak</h2>
      <p>Halo ${escapeHtml(displayName) || "Sahabat"},</p>
      <p>Permintaan perubahan peran Anda ke <strong>${roleLabel(requestedRole)}</strong> <strong>ditolak</strong> oleh admin.</p>
      <p style="color: #64748B;">Jika Anda memiliki pertanyaan, silakan hubungi admin Amanah.</p>
    </div>
    `
  )
}