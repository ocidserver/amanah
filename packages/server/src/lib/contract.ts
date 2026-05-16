import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { LOAN_PURPOSE, COLLATERAL_TYPE, INSTALLMENT_TYPE } from "@amanah/shared"

interface ContractData {
  loanId: string
  loanCode: string
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

  const timestamp = Date.now()
  const filename = `contract-${data.loanCode}-${timestamp}.pdf`
  const filePath = path.join(CONTRACTS_DIR, filename)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 })
    const stream = fs.createWriteStream(filePath)

    doc.pipe(stream)

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const margin = 60

    // ===== WATERMARK (diagonal, light gray) =====
    doc.save()
    doc.opacity(0.04)
    doc.fontSize(72)
    .font("Helvetica-Bold")
    .fillColor("#999999")
    .rotate(-35, { origin: [pageWidth / 2, pageHeight / 2] })
    .text(data.loanCode, pageWidth / 2 - 150, pageHeight / 2 - 36, {
      width: 300,
      align: "center",
    })
    doc.restore()

    // ===== HEADER =====
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1B4332").text("PERJANJIAN PINJAMAN", { align: "center" })
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#2D6A4F").text("QARDHUL HASAN", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(11).font("Helvetica").fillColor("#475569").text("Amanah — Platform Pinjaman Kebajikan", { align: "center" })
    doc.moveDown(0.5)

    // Divider line
    doc.strokeColor("#1B4332").lineWidth(1.5)
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke()
    doc.moveDown(1)

    // ===== CONTRACT INFO BOX =====
    const infoBoxY = doc.y
    doc.strokeColor("#e2e8f0").lineWidth(0.5)
    doc.roundedRect(margin, infoBoxY, pageWidth - margin * 2, 55, 4).stroke()

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text(`Kode Pinjaman: ${data.loanCode}`, margin + 12, infoBoxY + 10)
    doc.font("Helvetica").text(`No. Kontrak: ${data.loanId}`, margin + 12, infoBoxY + 28)
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, margin + 250, infoBoxY + 10)
    doc.moveDown(1.5)

    // ===== PARTIES =====
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("PIHAK-PIHAK")
    doc.moveDown(0.3)

    // Parties box
    const partiesY = doc.y
    doc.fillColor("#f8fafc").roundedRect(margin, partiesY, pageWidth - margin * 2, data.trusteeName ? 75 : 55, 4).fill()
    doc.strokeColor("#e2e8f0").roundedRect(margin, partiesY, pageWidth - margin * 2, data.trusteeName ? 75 : 55, 4).stroke()

    doc.fontSize(10).font("Helvetica").fillColor("#0f172a")
    doc.text("Pemberi Pinjaman", margin + 12, partiesY + 10, { width: 140 })
    doc.font("Helvetica-Bold").text(`: ${data.lenderName}`, margin + 152, partiesY + 10)

    doc.font("Helvetica").text("Peminjam", margin + 12, partiesY + 28, { width: 140 })
    doc.font("Helvetica-Bold").text(`: ${data.borrowerAlias}`, margin + 152, partiesY + 28)

    if (data.trusteeName) {
      doc.font("Helvetica").text("Wali Amanah", margin + 12, partiesY + 46, { width: 140 })
      doc.font("Helvetica-Bold").text(`: ${data.trusteeName}`, margin + 152, partiesY + 46)
    }
    doc.moveDown(1.5)

    // ===== LOAN DETAILS =====
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("DETAIL PINJAMAN")
    doc.moveDown(0.3)

    const details = [
      ["Tujuan Pinjaman", LOAN_PURPOSE[data.purpose as keyof typeof LOAN_PURPOSE] || data.purpose],
      ["Nominal Pinjaman", formatCurrency(data.amount)],
      ["Durasi", `${data.durationMonths} bulan`],
      ["Pola Cicilan", INSTALLMENT_TYPE[data.installmentType as keyof typeof INSTALLMENT_TYPE] || data.installmentType],
      ["Jenis Jaminan", COLLATERAL_TYPE[data.collateralType as keyof typeof COLLATERAL_TYPE] || data.collateralType],
      ["Tanggal Mulai", data.startDate],
      ["Jatuh Tempo", data.dueDate],
    ]

    const detailsY = doc.y
    const rowHeight = 18
    details.forEach(([label, value], i) => {
      const y = detailsY + i * rowHeight
      if (i % 2 === 0) {
        doc.fillColor("#f8fafc").rect(margin, y, pageWidth - margin * 2, rowHeight).fill()
      }
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text(label, margin + 12, y + 3, { width: 160 })
      doc.font("Helvetica").fillColor("#334155").text(`: ${value}`, margin + 172, y + 3)
    })
    doc.moveDown(details.length * 0.7 + 0.5)

    // ===== FEE BREAKDOWN =====
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("RINCIAN BIAYA")
    doc.moveDown(0.3)

    const fees: [string, number][] = [
      ["Ujrah (1%)", data.ujrah],
      ["Materai", data.stampFee],
      ["Biaya Admin", data.adminFee],
      ["Biaya Penitipan Jaminan", data.custodyFee],
    ]

    const feesY = doc.y
    const feeRowHeight = 18
    fees.forEach(([label, value], i) => {
      const y = feesY + i * feeRowHeight
      if (i % 2 === 0) {
        doc.fillColor("#f8fafc").rect(margin, y, pageWidth - margin * 2, feeRowHeight).fill()
      }
      doc.fontSize(10).font("Helvetica").fillColor("#334155").text(label, margin + 12, y + 3, { width: 200 })
      doc.text(formatCurrency(value), margin + 212, y + 3, { align: "right", width: pageWidth - margin * 2 - 224 })
    })

    // Total fees and disbursed amount (highlighted)
    const totalY = feesY + fees.length * feeRowHeight + 4
    doc.fillColor("#1B4332").roundedRect(margin, totalY, pageWidth - margin * 2, 22, 3).fill()
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff").text("Total Biaya", margin + 12, totalY + 5, { width: 200 })
    doc.text(formatCurrency(data.totalFee), margin + 212, totalY + 5, { align: "right", width: pageWidth - margin * 2 - 224 })

    const disbursedY = totalY + 26
    doc.fillColor("#2D6A4F").roundedRect(margin, disbursedY, pageWidth - margin * 2, 22, 3).fill()
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff").text("Dana Diterima (Bersih)", margin + 12, disbursedY + 5, { width: 200 })
    doc.text(formatCurrency(data.disbursedAmount), margin + 212, disbursedY + 5, { align: "right", width: pageWidth - margin * 2 - 224 })

    doc.moveDown(2.5)

    // ===== TERMS =====
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("KETENTUAN")
    doc.moveDown(0.3)

    doc.fontSize(9).font("Helvetica").fillColor("#334155")
    const terms = [
      "Pinjaman ini bersifat Qardhul Hasan (pinjaman kebajikan) tanpa bunga/riba.",
      "Peminjam wajib membayar cicilan sesuai jadwal yang telah disepakati.",
      "Biaya administrasi dan ujrah digunakan untuk operasional platform.",
      "Jaminan dititipkan kepada wali amanah dan akan dikembalikan setelah pinjaman lunas.",
      "Jika peminjam wanprestasi, pemberi pinjaman berhak mengambil tindakan sesuai kesepakatan.",
      "Perjanjian ini dibuat dengan prinsip transparansi dan saling percaya.",
      "Kode pinjaman unik: " + data.loanCode + " — gunakan kode ini untuk melacak status cicilan.",
    ]
    terms.forEach((term, i) => {
      const bulletY = doc.y
      doc.font("Helvetica-Bold").text(`${i + 1}.`, margin, bulletY, { width: 18 })
      doc.font("Helvetica").text(term, margin + 18, bulletY, { width: pageWidth - margin * 2 - 18 })
      doc.moveDown(0.4)
    })
    doc.moveDown(1.5)

    // ===== SIGNATURES =====
    doc.strokeColor("#1B4332").lineWidth(1)
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke()
    doc.moveDown(1.5)

    const sigY = doc.y
    const sigWidth = data.trusteeName ? (pageWidth - margin * 2 - 40) / 3 : (pageWidth - margin * 2 - 20) / 2
    const sigLabels = ["Pemberi Pinjaman", "Peminjam"]
    if (data.trusteeName) sigLabels.push("Wali Amanah")

    sigLabels.forEach((label, i) => {
      const x = margin + i * (sigWidth + 20)
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a").text(label, x, sigY, { width: sigWidth, align: "center" })
      doc.text("(___________________)", x, sigY + 60, { width: sigWidth, align: "center" })
    })

    doc.moveDown(3)

    // ===== FOOTER =====
    doc.strokeColor("#e2e8f0").lineWidth(0.5)
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(8).font("Helvetica").fillColor("#94a3b8").text(`Dokumen ini dibuat secara digital oleh Amanah — ${data.loanCode}`, { align: "center" })
    doc.text(`ID: ${data.loanId} | Dicetak: ${new Date().toLocaleString("id-ID")}`, { align: "center" })

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
