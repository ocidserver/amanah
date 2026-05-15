import { Link } from "react-router-dom"
import { IconShield, IconWallet, IconTrustee, IconCheck } from "../components/Icons"

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

export default function LandingPage() {
  const features = [
    {
      icon: <IconShield className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Privasi Terjaga",
      desc: "Peminjam tidak perlu daftar. Identitas hanya berupa kode unik — tanpa nama asli.",
    },
    {
      icon: <IconWallet className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Tanpa Riba",
      desc: "Pinjaman kebajikan tanpa bunga. Semua transaksi sesuai prinsip Qardhul Hasan.",
    },
    {
      icon: <IconTrustee className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Wali Amanah",
      desc: "Jaminan dipegang pihak ketiga yang dipercaya, bukan langsung oleh pemberi pinjaman.",
    },
    {
      icon: <IconCheck className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Doa Lunas",
      desc: "Saat melunasi, peminjam bisa kirim pesan syukur anonim — tabungan akhirat.",
    },
  ]

  return (
    <div className="min-h-dvh bg-white">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-[var(--color-primary)] text-lg">Amanah</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/track"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors"
            >
              Lacak
            </Link>
            <Link
              to="/login"
              className="text-sm text-[var(--color-primary)] font-medium px-3 py-2 rounded-lg hover:bg-[var(--color-primary-50)] transition-colors"
            >
              Masuk
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-[var(--color-primary)] text-white font-medium px-4 py-2 rounded-xl active:scale-[0.98] transition-transform"
            >
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-50)] to-white" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[var(--color-primary-50)] text-[var(--color-primary)] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <IconShield className="w-3.5 h-3.5" />
              Qardhul Hasan Digital
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Catat Pinjaman Kebajikan <span className="text-[var(--color-primary)]">Tanpa Riba</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto">
              Amanah membantu Anda mencatat pinjaman tanpa bunga dengan menjaga privasi peminjam dan transparansi cicilan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/signup"
                className="bg-[var(--color-primary)] text-white px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[var(--color-primary)]/20"
              >
                Mulai Sekarang — Gratis
              </Link>
              <Link
                to="/track"
                className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform hover:border-gray-300"
              >
                Lacak Pinjaman
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Kenapa Amanah?</h2>
          <p className="text-gray-500 max-w-md mx-auto">Dirancang khusus untuk pinjaman kebajikan Islam dengan prinsip transparansi dan privasi.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-primary)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Cara Kerja</h2>
          <p className="text-white/70 mb-10 max-w-md mx-auto">Tiga langkah sederhana untuk mulai mencatat pinjaman kebajikan.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">1</div>
              <h3 className="font-semibold mb-1">Daftar</h3>
              <p className="text-sm text-white/70">Buat akun pemberi pinjaman dengan email dan password.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">2</div>
              <h3 className="font-semibold mb-1">Catat Pinjaman</h3>
              <p className="text-sm text-white/70">Masukkan detail pinjaman dan dapatkan kode amanah unik.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">3</div>
              <h3 className="font-semibold mb-1">Bagikan Kode</h3>
              <p className="text-sm text-white/70">Peminjam lacak cicilan dengan kode — tanpa perlu daftar.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Siap Mulai?</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Catat pinjaman kebajikan pertama Anda. Privasi peminjam terjaga, cicilan transparan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="bg-[var(--color-primary)] text-white px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform"
            >
              Daftar Sekarang
            </Link>
            <Link
              to="/login"
              className="border border-gray-200 bg-white text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform hover:border-gray-300"
            >
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Amanah. Qardhul Hasan Digital.</p>
          <Link to="/track" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Lacak Pinjaman
          </Link>
        </div>
      </footer>
    </div>
  )
}