import { Link } from "react-router-dom"
import { IconFileText, IconSun, IconMoon } from "../components/Icons"
import { useThemeStore } from "../stores/theme-store"

export default function TermsPage() {
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
            <IconFileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Syarat & Ketentuan</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Terakhir diperbarui: 16 Mei 2026</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">1. Penerimaan Syarat</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Dengan mengakses dan menggunakan platform Amanah, Anda menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak menyetujui syarat-syarat ini, harap tidak menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">2. Definisi</h2>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li><strong>Amanah</strong> — Platform digital pencatatan pinjaman kebajikan (Qardhul Hasan)</li>
              <li><strong>Pemberi Pinjaman (Lender)</strong> — Pengguna yang menyediakan dana pinjaman</li>
              <li><strong>Peminjam (Borrower)</strong> — Pengguna yang menerima dan mengembalikan dana pinjaman</li>
              <li><strong>Wali Amanah (Trustee)</strong> — Pihak ketiga yang memegang jaminan</li>
              <li><strong>Admin</strong> — Pengelola platform yang memverifikasi pengguna dan mengelola sistem</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">3. Prinsip Layanan</h2>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Amanah adalah platform <strong>pencatatan</strong>, bukan lembaga keuangan atau fintech lending</li>
              <li>Semua pinjaman bersifat <strong>Qardhul Hasan</strong> — tanpa bunga/riba</li>
              <li>Platform tidak menjamin pengembalian dana oleh peminjam</li>
              <li>Biaya administrasi (ujrah, materai, admin) digunakan untuk operasional platform, bukan keuntungan</li>
              <li>Setiap pengguna bertanggung jawab atas transaksi yang mereka lakukan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">4. Pendaftaran Akun</h2>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Anda harus berusia minimal 18 tahun untuk mendaftar</li>
              <li>Informasi yang diberikan harus benar dan akurat</li>
              <li>Anda bertanggung jawab menjaga kerahasiaan password</li>
              <li>Satu orang hanya boleh memiliki satu akun</li>
              <li>Akun tidak dapat dipindahtangankan kepada orang lain</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">5. Kewajiban Pengguna</h2>
            <h3 className="font-medium text-[var(--color-text)] mb-2">Pemberi Pinjaman:</h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Memastikan dana yang dipinjamkan adalah milik sendiri dan halal</li>
              <li>Tidak memungut bunga atau keuntungan tersembunyi</li>
              <li>Memverifikasi pembayaran cicilan secara adil dan tepat waktu</li>
              <li>Menghormati privasi peminjam</li>
            </ul>
            <h3 className="font-medium text-[var(--color-text)] mb-2 mt-4">Peminjam:</h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Membayar cicilan sesuai jadwal yang disepakati</li>
              <li>Memberikan informasi yang jujur dan akurat</li>
              <li>Tidak mengajukan pinjaman melebihi kapasitas (sesuai tier)</li>
              <li>Menjaga dan mengembalikan jaminan dalam kondisi baik</li>
            </ul>
            <h3 className="font-medium text-[var(--color-text)] mb-2 mt-4">Wali Amanah:</h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Menyimpan jaminan dengan aman dan bertanggung jawab</li>
              <li>Memverifikasi penerimaan jaminan secara jujur</li>
              <li>Mengembalikan jaminan setelah pinjaman lunas</li>
              <li>Tidak menggunakan jaminan untuk kepentingan pribadi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">6. Larangan</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">Pengguna dilarang:</p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2 mt-2">
              <li>Menggunakan platform untuk kegiatan ilegal atau melanggar hukum</li>
              <li>Memungut bunga/riba dalam bentuk apapun</li>
              <li>Memberikan informasi palsu atau menyesatkan</li>
              <li>Menyalahgunakan data pengguna lain</li>
              <li>Mengakses akun orang lain tanpa izin</li>
              <li>Menggunakan platform untuk pencucian uang</li>
              <li>Mengirim konten yang menyinggung, mengancam, atau melecehkan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">7. Tier Peminjam</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Sistem tier digunakan untuk membatasi jumlah pinjaman sesuai rekam jejak:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2 mt-2">
              <li><strong>Peminjam Baru</strong> — Maks. Rp 2.000.000</li>
              <li><strong>Peminjam Kecil</strong> — Maks. Rp 5.000.000 (min. 1 pinjaman lunas, 80% tepat waktu)</li>
              <li><strong>Peminjam Menengah</strong> — Maks. Rp 15.000.000 (min. 3 pinjaman lunas, 85% tepat waktu)</li>
              <li><strong>Peminjam Utama</strong> — Maks. Rp 50.000.000 (min. 5 pinjaman lunas, 90% tepat waktu)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">8. Penyelesaian Sengketa</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Sengketa antara pemberi pinjaman dan peminjam diselesaikan secara musyawarah. Platform Amanah tidak bertanggung jawab atas sengketa yang timbul dari transaksi pinjaman. Jika diperlukan, sengketa dapat diselesaikan melalui mediasi komunitas atau jalur hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">9. Pembatasan Tanggung Jawab</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Amanah menyediakan platform pencatatan dan tidak bertanggung jawab atas:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2 mt-2">
              <li>Kegagalan peminjam dalam membayar cicilan</li>
              <li>Kerugian yang timbul dari transaksi pinjaman</li>
              <li>Kehilangan atau kerusakan jaminan yang dipegang wali amanah</li>
              <li>Gangguan layanan akibat force majeure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">10. Perubahan Syarat</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Kami berhak mengubah syarat & ketentuan ini kapan saja. Perubahan akan berlaku efektif setelah dipublikasikan. Penggunaan layanan setelah perubahan berarti Anda menyetujui syarat yang baru.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">11. Kontak</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Pertanyaan mengenai syarat & ketentuan dapat dikirimkan ke:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2 mt-2">
              <li>Email: <a href="mailto:info@amanah.app" className="text-[var(--color-primary)] hover:underline">info@amanah.app</a></li>
              <li>WhatsApp: +62 812-3456-7890</li>
            </ul>
          </section>
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
