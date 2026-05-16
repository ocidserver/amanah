import { useState } from "react"
import { Link } from "react-router-dom"
import {
  IconShield, IconWallet, IconTrustee, IconCheck, IconChevronDown,
  IconCopy, IconPhone, IconMail, IconFileText, IconCalendar,
  IconClock, IconUser, IconAlertTriangle, IconCheckCircle,
  IconArrowRightLeft, IconTrendingUp, IconSun, IconMoon,
} from "../components/Icons"
import { LOAN_PURPOSE } from "@amanah/shared"
import { useThemeStore } from "../stores/theme-store"

const DEMO_CREDENTIALS = [
  { role: "Pemberi Pinjaman", email: "lender@amanah.app", password: "Password123!", desc: "Kelola pinjaman, verifikasi cicilan, undang peminjam", icon: "lender" as const },
  { role: "Peminjam", email: "borrower1@amanah.app", password: "Password123!", desc: "Ajukan pinjaman, upload bukti bayar, kirim doa lunas", icon: "borrower" as const },
  { role: "Wali Amanah", email: "trustee@amanah.app", password: "Password123!", desc: "Terima permintaan, verifikasi & kembalikan jaminan", icon: "trustee" as const },
  { role: "Admin", email: "admin@amanah.app", password: "Password123!", desc: "Kelola pengguna, verifikasi dokumen, approve role change", icon: "admin" as const },
]

const FAQ_DATA = [
  { q: "Apa itu Amanah?", a: "Amanah adalah platform digital untuk mencatat dan mengelola pinjaman kebajikan (Qardhul Hasan) berbasis komunitas. Sistem ini memungkinkan pemberi pinjaman dan peminjam untuk mencatat transaksi secara transparan tanpa bunga/riba." },
  { q: "Bagaimana cara mendaftar?", a: "Klik tombol 'Daftar' di halaman utama, masukkan email, nama lengkap, dan password. Setelah terdaftar, Anda bisa memilih peran sebagai Pemberi Pinjaman, Peminjam, atau Wali Amanah." },
  { q: "Apa itu Qardhul Hasan?", a: "Qardhul Hasan adalah konsep pinjaman kebajikan dalam Islam dimana pemberi pinjaman tidak mengambil keuntungan (bunga/riba) dari peminjam. Yang dikembalikan hanya pokok pinjaman." },
  { q: "Bagaimana cara membayar cicilan?", a: "1. Login ke akun peminjam Anda\n2. Buka halaman Pinjaman\n3. Pilih pinjaman yang aktif\n4. Klik 'Upload Bukti' pada cicilan yang ingin dibayar\n5. Upload foto bukti transfer\n6. Tunggu verifikasi dari pemberi pinjaman" },
  { q: "Apa itu Wali Amanah?", a: "Wali Amanah adalah pihak ketiga yang dipercaya untuk memegang jaminan (kolateral) dari peminjam. Jaminan tidak dipegang langsung oleh pemberi pinjaman untuk menjaga keadilan dan kepercayaan." },
  { q: "Jenis jaminan apa saja yang bisa digunakan?", a: "Ada 4 jenis: Dokumen (KTP, surat tanah), Barang Berharga (emas, elektronik), Surat Pernyataan, atau Tanpa Jaminan (untuk pinjaman kecil)." },
  { q: "Apakah data saya aman?", a: "Ya. Password di-hash menggunakan bcrypt (12 rounds). Data sensitif tidak disimpan dalam plaintext. Kami menggunakan HTTPS untuk semua komunikasi dan tidak membagikan data ke pihak ketiga." },
  { q: "Bagaimana jika peminjam tidak bisa bayar?", a: "Pemberi pinjaman bisa menandai pinjaman sebagai 'Gagal Bayar' (defaulted). Jaminan yang dipegang wali amanah bisa digunakan sesuai kesepakatan awal. Sistem juga memiliki tier peminjam yang mencegah pinjaman melebihi kapasitas." },
  { q: "Apa itu 'Doa Lunas'?", a: "Doa Lunas adalah pesan syukur yang bisa dikirim peminjam setelah semua cicilan lunas. Pesan ini bersifat anonim dan bertujuan mempererat silaturahmi dalam komunitas." },
  { q: "Bagaimana cara mengundang peminjam?", a: "Saat membuat pinjaman baru, masukkan email peminjam. Sistem akan mengirim undangan email. Peminjam bisa mendaftar dan langsung terhubung ke pinjaman tersebut." },
]

const LOAN_TYPES = [
  { key: "business_capital", label: LOAN_PURPOSE.business_capital, desc: "Modal untuk memulai atau mengembangkan usaha kecil dan menengah", icon: <IconTrendingUp className="w-6 h-6" />, iconColor: "#7C3AED", iconBg: "#EDE9FE", iconBgDark: "#2E1065" },
  { key: "home", label: LOAN_PURPOSE.home, desc: "Pembiayaan perbaikan, renovasi, atau pembangunan rumah", icon: <IconShield className="w-6 h-6" />, iconColor: "#2563EB", iconBg: "#DBEAFE", iconBgDark: "#1E3A8A" },
  { key: "consumables", label: LOAN_PURPOSE.consumables, desc: "Kebutuhan sehari-hari yang mendesak bagi anggota komunitas", icon: <IconWallet className="w-6 h-6" />, iconColor: "#D97706", iconBg: "#FEF3C7", iconBgDark: "#78350F" },
  { key: "education", label: LOAN_PURPOSE.education, desc: "Biaya sekolah, kuliah, atau pelatihan keterampilan", icon: <IconFileText className="w-6 h-6" />, iconColor: "#0891B2", iconBg: "#CFFAFE", iconBgDark: "#164E63" },
  { key: "health", label: LOAN_PURPOSE.health, desc: "Biaya pengobatan, operasi, atau kebutuhan medis lainnya", icon: <IconCheckCircle className="w-6 h-6" />, iconColor: "#DC2626", iconBg: "#FEE2E2", iconBgDark: "#7F1D1D" },
  { key: "urgent_needs", label: LOAN_PURPOSE.urgent_needs, desc: "Kebutuhan mendesak yang tidak bisa ditunda", icon: <IconAlertTriangle className="w-6 h-6" />, iconColor: "#EA580C", iconBg: "#FFEDD5", iconBgDark: "#7C2D12" },
  { key: "family_needs", label: LOAN_PURPOSE.family_needs, desc: "Kebutuhan keluarga seperti pernikahan atau acara adat", icon: <IconUser className="w-6 h-6" />, iconColor: "#0f6e56", iconBg: "#D8F3DC", iconBgDark: "#052e16" },
  { key: "debt_consolidation", label: LOAN_PURPOSE.debt_consolidation, desc: "Pelunasan hutang lama dengan pinjaman baru yang lebih ringan", icon: <IconArrowRightLeft className="w-6 h-6" />, iconColor: "#6D28D9", iconBg: "#EDE9FE", iconBgDark: "#2E1065" },
]

function SectionHeading({ badge, title, subtitle, light = true }: { badge: string; title: string; subtitle: string; light?: boolean }) {
  return (
    <div className="text-center mb-10">
      <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${
        light
          ? "bg-[#D8F3DC] text-[#1B4332]"
          : "bg-[#052e16] text-[#52B788]"
      }`}>
        <IconShield className="w-3.5 h-3.5" />
        {badge}
      </span>
      <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${light ? "text-[#1C1917] dark:text-[#F1F5F9]" : "text-[#F1F5F9]"}`}>{title}</h2>
      <p className={`max-w-lg mx-auto ${light ? "text-[#57534E] dark:text-[#94A3B8]" : "text-[#94A3B8]"}`}>{subtitle}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-xl overflow-hidden bg-white dark:bg-[#1e293b] dark:border-[#334155] transition-all ${
      open ? "border-l-[3px] border-l-[#40916C] border-[#E7E5E4] dark:border-[#334155]" : "border-[#E7E5E4]"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F0FAF4] dark:hover:bg-[#334155]/50 transition-colors"
      >
        <span className="font-medium text-[#1C1917] dark:text-[#F1F5F9] text-sm pr-4">{question}</span>
        <IconChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#40916C]" : "text-[#A8A29E] dark:text-[#64748B]"}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#E7E5E4] dark:border-[#334155]">
          <p className="text-sm text-[#57534E] dark:text-[#94A3B8] leading-relaxed whitespace-pre-line pt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const { isDark, toggle } = useThemeStore()
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const flowSteps = [
    { step: "1", title: "Peminjam Daftar", desc: "Buat akun, lengkapi profil, lolos BI Checking", icon: <IconUser className="w-5 h-5" /> },
    { step: "2", title: "Ajukan Pinjaman", desc: "Peminjam ajukan, lender tinjau & approve", icon: <IconFileText className="w-5 h-5" /> },
    { step: "3", title: "Serahkan Jaminan", desc: "Wali amanah terima & verifikasi jaminan", icon: <IconShield className="w-5 h-5" /> },
    { step: "4", title: "Bayar Cicilan", desc: "Peminjam bayar & upload bukti transfer", icon: <IconCalendar className="w-5 h-5" /> },
    { step: "5", title: "Lunas & Doa", desc: "Jaminan dikembalikan, kirim doa lunas", icon: <IconCheckCircle className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0f172a] text-[#1C1917] dark:text-[#F1F5F9]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-[#E7E5E4] dark:border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-[#1B4332] dark:text-[#52B788] text-lg">Amanah</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <a href="#sistem" className="text-sm text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] px-3 py-2 rounded-lg transition-colors">Sistem</a>
            <a href="#pembiayaan" className="text-sm text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] px-3 py-2 rounded-lg transition-colors">Pembiayaan</a>
            <a href="#faq" className="text-sm text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] px-3 py-2 rounded-lg transition-colors">FAQ</a>
            <a href="#demo" className="text-sm text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] px-3 py-2 rounded-lg transition-colors">Demo</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] hover:bg-[#F5F5F4] dark:hover:bg-[#1e293b] transition-colors"
              aria-label={isDark ? "Mode terang" : "Mode gelap"}
            >
              {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] px-3 py-2 rounded-lg transition-colors">Masuk</Link>
            <Link to="/signup" className="text-sm bg-[#1B4332] hover:bg-[#153528] text-white font-medium px-4 py-2 rounded-xl active:scale-[0.98] transition-transform">Daftar</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO — Dark ===== */}
      <section className="relative overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A] via-[#111827] to-[#0D1B2A]" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#052e16] text-[#52B788] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <IconShield className="w-3.5 h-3.5" />
              Pinjaman Kebajikan Berbasis Komunitas
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Pinjaman Tanpa Riba <span className="text-[#52B788]">Untuk Komunitas</span>
            </h1>
            <p className="text-lg text-[#94A3B8] leading-relaxed mb-8 max-w-lg mx-auto">
              Amanah membantu komunitas mencatat dan mengelola pinjaman kebajikan — transparan, tanpa bunga, dan saling membantu sesama anggota.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup" className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[#1B4332]/30">
                Mulai Sekarang — Gratis
              </Link>
              <a href="#demo" className="border border-[#2D4F6C] text-[#CBD5E1] hover:text-white hover:border-[#52B788] px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform">
                Coba Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SISTEM / CARA KERJA — Light ===== */}
      <section id="sistem" className="bg-[#FAFAF9] dark:bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <SectionHeading
            badge="Sistem"
            title="Bagaimana Amanah Bekerja"
            subtitle="Sistem pinjaman kebajikan dengan alur yang transparan dan aman, melibatkan 4 peran utama."
          />

          {/* Role Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: <IconWallet className="w-6 h-6" />, role: "Pemberi Pinjaman", desc: "Menyediakan dana, mengelola cicilan, verifikasi pembayaran" },
              { icon: <IconUser className="w-6 h-6" />, role: "Peminjam", desc: "Mengajukan pinjaman, bayar cicilan, kirim doa lunas" },
              { icon: <IconTrustee className="w-6 h-6" />, role: "Wali Amanah", desc: "Memegang & memverifikasi jaminan, mengembalikan saat lunas" },
              { icon: <IconShield className="w-6 h-6" />, role: "Admin", desc: "Verifikasi pengguna, kelola sistem, approve perubahan role" },
            ].map((r) => (
              <div key={r.role} className="bg-white dark:bg-[#1e293b] dark:border-[#334155] rounded-2xl border border-[#E7E5E4] p-5 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-[#40916C]/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#D8F3DC] dark:bg-[#052e16] flex items-center justify-center mx-auto mb-3 text-[#1B4332] dark:text-[#52B788]">
                  {r.icon}
                </div>
                <h3 className="font-semibold text-[#1C1917] dark:text-[#F1F5F9] text-sm mb-1">{r.role}</h3>
                <p className="text-xs text-[#57534E] dark:text-[#94A3B8]">{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Flow Steps */}
          <div className="bg-[#F0FAF4] dark:bg-[#111827] dark:border-[#1E3A5F] rounded-3xl p-6 md:p-10 border border-[#D8F3DC]">
            <h3 className="font-bold text-[#1C1917] dark:text-[#F1F5F9] text-lg mb-6 text-center">Alur Proses Bisnis</h3>

            {/* Mobile: Vertical timeline */}
            <div className="md:hidden">
              {flowSteps.map((s, i) => (
                <div key={s.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {s.step}
                    </div>
                    {i < 4 && (
                      <div className="w-0.5 flex-1 bg-[#40916C]/30 mt-2" />
                    )}
                  </div>
                  <div className="py-2 pb-6">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[#40916C] dark:text-[#52B788]">{s.icon}</span>
                      <h4 className="font-semibold text-[14px] text-[#1C1917] dark:text-[#F1F5F9]">{s.title}</h4>
                    </div>
                    <p className="text-[13px] text-[#57534E] dark:text-[#94A3B8] leading-[1.6]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Horizontal with wrapping */}
            <div className="hidden md:flex flex-wrap justify-center items-start gap-y-4">
              {flowSteps.map((s, i) => (
                <div key={s.step} className="flex items-center">
                  <div className="min-w-[140px] px-3 py-4 text-center">
                    <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white font-bold text-[14px] flex items-center justify-center mx-auto mb-2">
                      {s.step}
                    </div>
                    <div className="flex items-center justify-center mb-1.5 text-[#52B788]">
                      <div className="w-5 h-5">{s.icon}</div>
                    </div>
                    <h4 className="font-semibold text-[13px] text-[#1C1917] dark:text-[#F1F5F9] leading-tight mb-1">{s.title}</h4>
                    <p className="text-[11px] text-[#57534E] dark:text-[#94A3B8] leading-[1.5] line-clamp-2">{s.desc}</p>
                  </div>
                  {i < 4 && (
                    <div className="text-[#40916C]/60 dark:text-[#52B788]/60 mx-1 self-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIPE PEMBIAYAAN — Light (alternating) ===== */}
      <section id="pembiayaan" className="bg-[#FAFAF9] dark:bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <SectionHeading
            badge="Pembiayaan"
            title="Tipe Pembiayaan"
            subtitle="8 kategori pembiayaan yang bisa diajukan sesuai kebutuhan Anda."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LOAN_TYPES.map((t) => (
              <div key={t.key} className="bg-white dark:bg-[#1e293b] dark:border-[#334155] rounded-2xl border border-[#E7E5E4] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-[#40916C]/30 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: t.iconBg, color: t.iconColor }}>
                  {t.icon}
                </div>
                <h3 className="font-semibold text-[#1C1917] dark:text-[#F1F5F9] text-sm mb-1">{t.label}</h3>
                <p className="text-xs text-[#57534E] dark:text-[#94A3B8] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ — Light with green tint ===== */}
      <section id="faq" className="bg-[#F0FAF4] dark:bg-[#111827]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <SectionHeading
            badge="FAQ"
            title="Pertanyaan Umum"
            subtitle="Jawaban untuk pertanyaan yang sering diajukan tentang Amanah."
          />
          <div className="max-w-2xl mx-auto space-y-2">
            {FAQ_DATA.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEMO APP — Dark ===== */}
      <section id="demo" className="bg-[#0D1B2A]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <SectionHeading
            badge="Demo"
            title="Coba Aplikasi"
            subtitle="Gunakan akun demo berikut untuk mencoba semua fitur Amanah. Semua data akan direset secara berkala."
            light={false}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {DEMO_CREDENTIALS.map((cred, idx) => {
              const iconMap = {
                lender: <IconWallet className="w-5 h-5" />,
                borrower: <IconUser className="w-5 h-5" />,
                trustee: <IconTrustee className="w-5 h-5" />,
                admin: <IconShield className="w-5 h-5" />,
              }
              const accentBorder: Record<string, string> = {
                lender: "border-l-[#52B788]",
                borrower: "border-l-[#60A5FA]",
                trustee: "border-l-[#FBBF24]",
                admin: "border-l-[#A78BFA]",
              }
              return (
                <div key={cred.role} className={`bg-[#1a2744] border border-[#2D4F6C] border-l-4 ${accentBorder[cred.icon]} rounded-2xl p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#052e16] flex items-center justify-center text-[#52B788]">
                      {iconMap[cred.icon]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#F1F5F9]">{cred.role}</h3>
                      <p className="text-xs text-[#94A3B8]">{cred.desc}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-[#0D1B2A]/60 rounded-lg px-3 py-2">
                      <span className="text-xs text-[#94A3B8]">Email</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[#F1F5F9]">{cred.email}</code>
                        <button
                          onClick={() => copyToClipboard(cred.email, idx * 2)}
                          className="text-[#94A3B8] hover:text-[#52B788] transition-colors"
                          title="Salin email"
                        >
                          {copiedIdx === idx * 2 ? <IconCheck className="w-3.5 h-3.5 text-[#52B788]" /> : <IconCopy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#0D1B2A]/60 rounded-lg px-3 py-2">
                      <span className="text-xs text-[#94A3B8]">Password</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[#F1F5F9]">{cred.password}</code>
                        <button
                          onClick={() => copyToClipboard(cred.password, idx * 2 + 1)}
                          className="text-[#94A3B8] hover:text-[#52B788] transition-colors"
                          title="Salin password"
                        >
                          {copiedIdx === idx * 2 + 1 ? <IconCheck className="w-3.5 h-3.5 text-[#52B788]" /> : <IconCopy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/login"
                    className="mt-3 w-full block text-center bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium py-2 rounded-xl active:scale-[0.98] transition-transform"
                  >
                    Masuk sebagai {cred.role}
                  </Link>
                </div>
              )
            })}
          </div>
          <p className="text-center text-xs text-[#94A3B8] mt-6">
            Semua akun menggunakan password: <code className="font-mono bg-[#1a2744] border border-[#2D4F6C] px-1.5 py-0.5 rounded">Password123!</code>
          </p>
        </div>
      </section>

      {/* ===== CTA — Forest Green ===== */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="bg-[#1B4332] rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Siap Mulai?</h2>
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            Bergabung dengan komunitas pinjaman kebajikan. Tanpa riba, transparan, dan saling membantu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="bg-white hover:bg-[#F0FAF4] text-[#1B4332] px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform">
              Daftar Sekarang
            </Link>
            <Link to="/login" className="border border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER — Very Dark ===== */}
      <footer className="bg-[#0A0F0D] border-t border-[#1a2744]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-[#52B788] text-lg">Amanah</span>
              </div>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Platform Pinjaman Kebajikan Islam Tanpa Bunga. Berbasis komunitas, transparan, dan saling membantu.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#F1F5F9] mb-3">Informasi</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-[#94A3B8] hover:text-[#52B788] transition-colors">Tentang Kami</Link></li>
                <li><Link to="/privacy" className="text-sm text-[#94A3B8] hover:text-[#52B788] transition-colors">Kebijakan Privasi</Link></li>
                <li><Link to="/terms" className="text-sm text-[#94A3B8] hover:text-[#52B788] transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#F1F5F9] mb-3">Kontak</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <IconMail className="w-4 h-4 shrink-0" />
                  <a href="mailto:info@amanah.app" className="hover:text-[#52B788] transition-colors">info@amanah.app</a>
                </li>
                <li className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <IconPhone className="w-4 h-4 shrink-0" />
                  <a href="https://wa.me/6281234567890" className="hover:text-[#52B788] transition-colors">+62 812-3456-7890</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1a2744] mt-8 pt-6 text-center">
            <p className="text-sm text-[#94A3B8]">&copy; {new Date().getFullYear()} Amanah. BMT Digital — Pinjaman Kebajikan Berbasis Komunitas.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
