import { Link } from "react-router-dom"
import { IconMail, IconPhone, IconMapPin, IconShield, IconSun, IconMoon } from "../components/Icons"
import { useThemeStore } from "../stores/theme-store"

const TEAM = [
  { name: "Ahmad Rizki", role: "Founder & Developer", bio: "Full-stack developer dengan fokus pada teknologi untuk kebaikan sosial. Berpengalaman dalam membangun platform berbasis komunitas." },
  { name: "Siti Nurhaliza", role: "Advisor Syariah", bio: "Ahli fiqih muamalah yang memastikan semua fitur Amanah sesuai dengan prinsip syariah Islam." },
  { name: "Budi Prasetyo", role: "Community Manager", bio: "Mengelola hubungan dengan BMT dan komunitas pinjaman kebajikan di seluruh Indonesia." },
]

export default function AboutPage() {
  const { isDark, toggle } = useThemeStore()

  return (
    <div className="min-h-dvh bg-[var(--color-surface)] text-[var(--color-text)]">
      <nav className="sticky top-0 z-40 bg-[var(--color-surface)]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-[var(--color-primary)] text-lg">Amanah</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label={isDark ? "Mode terang" : "Mode gelap"}
            >
              {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
            </button>
            <Link to="/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-2 rounded-lg transition-colors">Kembali</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center">
            <IconShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-3">Tentang Amanah</h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
            Platform digital untuk mencatat dan mengelola pinjaman kebajikan (Qardhul Hasan) berbasis komunitas, tanpa bunga dan saling membantu.
          </p>
        </div>

        {/* Visi & Misi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[var(--color-surface-alt)] dark:bg-slate-800/50 rounded-2xl p-6 border border-[var(--color-border-light)]">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Visi</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Menjadi platform terpercaya untuk pengelolaan pinjaman kebajikan di Indonesia, memperkuat ukhuwah dan saling membantu dalam komunitas Muslim.
            </p>
          </div>
          <div className="bg-[var(--color-surface-alt)] dark:bg-slate-800/50 rounded-2xl p-6 border border-[var(--color-border-light)]">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Misi</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Menyediakan alat digital yang mudah digunakan, transparan, dan sesuai prinsip syariah untuk membantu komunitas mengelola pinjaman kebajikan dengan amanah.
            </p>
          </div>
        </div>

        {/* Cerita */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">Cerita Kami</h2>
          <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Amanah lahir dari kebutuhan nyata di komunitas BMT (Baitul Maal wat Tamwil) di Indonesia. Banyak BMT yang masih mencatat pinjaman kebajikan secara manual — di buku tulis atau spreadsheet — yang rentan terhadap kesalahan dan sulit dilacak.
            </p>
            <p>
              Kami melihat peluang untuk membuat platform digital yang tidak hanya mencatat transaksi, tapi juga memperkuat nilai-nilai kepercayaan, transparansi, dan saling membantu yang menjadi inti dari Qardhul Hasan.
            </p>
            <p>
              Dengan Amanah, pemberi pinjaman bisa melacak cicilan, peminjam bisa melihat jadwal pembayaran, dan wali amanah bisa mengelola jaminan — semua dalam satu platform yang mudah digunakan.
            </p>
          </div>
        </section>

        {/* Tim */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-6">Tim Kami</h2>
          <div className="space-y-4">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-[var(--color-surface)] dark:bg-slate-800 rounded-2xl border border-[var(--color-border)] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">{member.name}</h3>
                    <p className="text-sm text-[var(--color-primary)] font-medium">{member.role}</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">{member.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kontak */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-6">Hubungi Kami</h2>
          <div className="bg-[var(--color-surface-alt)] dark:bg-slate-800/50 rounded-2xl p-6 space-y-4 border border-[var(--color-border-light)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <IconMail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                <a href="mailto:info@amanah.app" className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                  info@amanah.app
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <IconPhone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">WhatsApp</p>
                <a href="https://wa.me/6281234567890" className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                  +62 812-3456-7890
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <IconMapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Alamat</p>
                <p className="font-medium text-[var(--color-text)]">
                  Jl. Kebajikan No. 1, Bandung, Jawa Barat 40123
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-[var(--color-primary)] rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Bergabung dengan Amanah</h2>
          <p className="text-white/70 mb-6 max-w-sm mx-auto">
            Mulai mencatat pinjaman kebajikan di komunitas Anda. Gratis dan mudah digunakan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="bg-white hover:bg-gray-50 text-[var(--color-primary)] px-6 py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform">
              Daftar Sekarang
            </Link>
            <Link to="/login" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform">
              Masuk
            </Link>
          </div>
        </div>
      </article>

      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">&copy; {new Date().getFullYear()} Amanah. BMT Digital.</p>
        </div>
      </footer>
    </div>
  )
}
