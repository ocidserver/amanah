import { Link } from "react-router-dom"
import { IconShield, IconSun, IconMoon } from "../components/Icons"
import { useThemeStore } from "../stores/theme-store"

export default function PrivacyPolicyPage() {
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
            <IconShield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Kebijakan Privasi</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Terakhir diperbarui: 16 Mei 2026</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">1. Pendahuluan</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Kebijakan Privasi ini menjelaskan bagaimana Amanah ("kami", "platform") mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat menggunakan layanan kami. Dengan menggunakan Amanah, Anda menyetujui pengumpulan dan penggunaan informasi sesuai kebijakan ini.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">2. Data yang Kami Kumpulkan</h2>
            <h3 className="font-medium text-[var(--color-text)] mb-2">Data yang Anda Berikan:</h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Email dan password (untuk autentikasi)</li>
              <li>Nama lengkap (display name)</li>
              <li>Nomor telepon (opsional)</li>
              <li>Nomor identitas (NIK) — untuk verifikasi</li>
              <li>Alamat lengkap</li>
              <li>Pekerjaan</li>
              <li>Foto KTP (untuk verifikasi identitas)</li>
            </ul>
            <h3 className="font-medium text-[var(--color-text)] mb-2 mt-4">Data yang Otomatis Terkumpul:</h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Alamat IP dan user agent (untuk audit log)</li>
              <li>Waktu akses dan aktivitas (log sistem)</li>
              <li>Data pinjaman dan cicilan (transaksi)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">3. Bagaimana Kami Menggunakan Data</h2>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Autentikasi dan manajemen akun</li>
              <li>Memproses dan mencatat transaksi pinjaman</li>
              <li>Verifikasi identitas pengguna</li>
              <li>Mengirim notifikasi email (pengingat cicilan, konfirmasi)</li>
              <li>Menyediakan fitur tracking cicilan</li>
              <li>Meningkatkan keamanan dan mencegah penipuan</li>
              <li>Memenuhi kewajiban hukum dan regulasi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">4. Keamanan Data</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data Anda:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2 mt-2">
              <li>Password di-hash menggunakan bcrypt (12 rounds)</li>
              <li>Autentikasi menggunakan JWT (JSON Web Token) dengan masa berlaku terbatas</li>
              <li>Semua komunikasi menggunakan HTTPS</li>
              <li>Data sensitif tidak disimpan dalam plaintext</li>
              <li>Akses ke data dibatasi berdasarkan peran (role-based access control)</li>
              <li>Audit log mencatat semua aksi administratif</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">5. Berbagi Data</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Kami <strong>tidak menjual atau membagikan</strong> data pribadi Anda kepada pihak ketiga untuk tujuan komersial. Data hanya dibagikan dalam konteks:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2 mt-2">
              <li>Antara pemberi pinjaman dan peminjam dalam konteks transaksi pinjaman</li>
              <li>Dengan wali amanah yang ditunjuk untuk pengelolaan jaminan</li>
              <li>Kepada admin platform untuk keperluan verifikasi dan moderasi</li>
              <li>Jika diwajibkan oleh hukum atau perintah pengadilan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">6. Penyimpanan Data</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Data disimpan di server yang aman menggunakan PostgreSQL. Pengguna dapat mengatur penghapusan otomatis data pinjaman setelah masa tertentu melalui fitur "auto-delete" di pengaturan pinjaman.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">7. Hak Anda</h2>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 ml-2">
              <li>Mengakses dan memperbarui data profil Anda kapan saja</li>
              <li>Mengubah password melalui halaman pengaturan</li>
              <li>Mengajukan permintaan perubahan peran</li>
              <li>Menghapus akun (hubungi admin)</li>
              <li>Menolak menerima notifikasi email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">8. Perubahan Kebijakan</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau notifikasi di aplikasi. Tanggal pembaruan terakhir tertera di bagian atas halaman ini.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">9. Kontak</h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di:
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
