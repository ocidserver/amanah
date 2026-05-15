import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { LOAN_PURPOSE, COLLATERAL_TYPE, INSTALLMENT_TYPE } from "@amanah/shared"

interface ContractData {
  loanId: string
  lenderName: string
  borrowerAlias: string
  amount: number
  durationMonths: number
  installmentType: string
  purpose: string
  collateralType: string
  ujrah: number
  stampFee: number
  adminFee: number
  custodyFee: number
  totalFee: number
  disbursedAmount: number
  startDate: string
  dueDate: string
  trusteeName?: string
}

export async function generateContractPdf(data: ContractData): Promise<string> {
  const CONTRACTS_DIR = path.join(process.cwd(), "uploads", "contracts")
  if (!fs.existsSync(CONTRACTS_DIR)) {
    fs.mkdirSync(CONTRACTS_DIR, { recursive: true })
  }

  const filename = `contract-${data.loanId}-${Date.now()}.pdf`
  const filePath = path.join(CONTRACTS_DIR, filename)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const stream = fs.createWriteStream(filePath)

    doc.pipe(stream)

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("PERJANJIAN PINJAMAN", { align: "center" })
    doc.fontSize(16).font("Helvetica-Bold").text("QARDHUL HASAN", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(12).font("Helvetica").text("Amanah — Platform Pinjaman Kebajikan", { align: "center" })
    doc.moveDown(1)

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(1)

    // Contract Info
    doc.fontSize(11).font("Helvetica-Bold").text(`No. Kontrak: ${data.loanId}`)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`)
    doc.moveDown(1)

    // Parties
    doc.fontSize(12).font("Helvetica-Bold").text("PIHAK-PIHAK")
    doc.moveDown(0.5)
    doc.fontSize(11).font("Helvetica").text(`Pemberi Pinjaman: ${data.lenderName}`)
    doc.text(`Peminjam: ${data.borrowerAlias}`)
    if (data.trusteeName) {
      doc.text(`Wali Amanah: ${data.trusteeName}`)
    }
    doc.moveDown(1)

    // Loan Details
    doc.fontSize(12).font("Helvetica-Bold").text("DETAIL PINJAMAN")
    doc.moveDown(0.5)

    const details = [
      ["Tujuan Pinjaman", LOAN_PURPOSE[data.purpose as keyof typeof LOAN_PURPOSE] || data.purpose],
      ["Nominal Pinjaman", formatCurrency(data.amount)],
      ["Durasi", `${data.durationMonths} bulan`],
      ["Pola Cicilan", INSTALLMENT_TYPE[data.installmentType as keyof typeof INSTALLMENT_TYPE] || data.installmentType],
      ["Jenis Jaminan", COLLATERAL_TYPE[data.collateralType as keyof typeof COLLATERAL_TYPE] || data.collateralType],
      ["Tanggal Mulai", data.startDate],
      ["Jatuh Tempo", data.dueDate],
    ]

    details.forEach(([label, value]) => {
      doc.fontSize(11).font("Helvetica-Bold").text(label, { continued: true })
      doc.font("Helvetica").text(`: ${value}`)
    })
    doc.moveDown(1)

    // Fee Breakdown
    doc.fontSize(12).font("Helvetica-Bold").text("RINCIAN BIAYA")
    doc.moveDown(0.5)

    const fees = [
      ["Ujrah (1%)", formatCurrency(data.ujrah)],
      ["Materai", formatCurrency(data.stampFee)],
      ["Biaya Admin", formatCurrency(data.adminFee)],
      ["Biaya Penitipan Jaminan", formatCurrency(data.custodyFee)],
      ["Total Biaya", formatCurrency(data.totalFee)],
      ["Dana Diterima", formatCurrency(data.disbursedAmount)],
    ]

    fees.forEach(([label, value], i) => {
      if (i === fees.length - 1) {
        doc.font("Helvetica-Bold")
      } else {
        doc.font("Helvetica-Bold")
      }
      doc.fontSize(11).text(label, { continued: true })
      doc.font("Helvetica").text(`: ${value}`)
    })
    doc.moveDown(1)

    // Terms
    doc.fontSize(12).font("Helvetica-Bold").text("KETENTUAN")
    doc.moveDown(0.5)
    doc.fontSize(10).font("Helvetica")
    const terms = [
      "Pinjaman ini bersifat Qardhul Hasan (pinjaman kebajikan) tanpa bunga/riba.",
      "Peminjam wajib membayar cicilan sesuai jadwal yang telah disepakati.",
      "Biaya administrasi dan ujrah digunakan untuk operasional platform.",
      "Jaminan dititipkan kepada wali amanah dan akan dikembalikan setelah pinjaman lunas.",
      "Jika peminjam wanprestasi, pemberi pinjaman berhak mengambil tindakan sesuai kesepakatan.",
      "Perjanjian ini dibuat dengan prinsip transparansi dan saling percaya.",
    ]
    terms.forEach((term, i) => {
      doc.text(`${i + 1}. ${term}`)
    })
    doc.moveDown(2)

    // Signatures
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(1)

    const sigY = doc.y
    doc.fontSize(10).font("Helvetica").text("Pemberi Pinjaman", { width: 200 })
    doc.text("Peminjam", { width: 200, continued: false })
    if (data.trusteeName) {
      doc.text("Wali Amanah", { width: 200 })
    }
    doc.moveDown(3)

    doc.text("(___________________)", { width: 200 })
    doc.text("(___________________)", { width: 200 })
    if (data.trusteeName) {
      doc.text("(___________________)", { width: 200 })
    }

    // Footer
    doc.moveDown(2)
    doc.fontSize(8).font("Helvetica").text("Dokumen ini dibuat secara digital oleh Amanah.", { align: "center" })
    doc.text(`ID Kontrak: ${data.loanId}`, { align: "center" })

    doc.end()

    stream.on("finish", () => {
      resolve(`/uploads/contracts/${filename}`)
    })
    stream.on("error", reject)
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)
}
