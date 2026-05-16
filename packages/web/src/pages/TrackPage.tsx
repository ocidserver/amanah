import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { IconSearch, IconShield, IconSun, IconMoon } from "../components/Icons"
import { useThemeStore } from "../stores/theme-store"

export default function TrackPage() {
  const navigate = useNavigate()
  const { isDark, toggle } = useThemeStore()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError("Masukkan kode pinjaman")
      return
    }
    if (!/^AMN-[A-Z0-9]{4}$/.test(trimmed)) {
      setError("Format kode tidak valid. Contoh: AMN-1A2B")
      return
    }
    navigate(`/track/${trimmed}`)
  }

  return (
    <div className="min-h-dvh bg-[var(--color-surface-alt)] text-[var(--color-text)]">
      <nav className="sticky top-0 z-40 bg-[var(--color-surface)]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-[var(--color-primary)] text-lg">Amanah</span>
          </Link>
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label={isDark ? "Mode terang" : "Mode gelap"}
          >
            {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center px-4" style={{ minHeight: "calc(100dvh - 57px)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center">
              <IconShield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Lacak Pinjaman</h1>
            <p className="text-[var(--color-text-secondary)] mt-2 text-sm">
              Masukkan kode amanah yang diberikan oleh pemberi pinjaman
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Kode Amanah</label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setError("")
                  }}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl px-4 py-3 text-base font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="AMN-XXXX"
                  maxLength={8}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IconSearch className="w-5 h-5 text-[var(--color-text-muted)]" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-[var(--color-danger)] text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl py-3 font-semibold text-base active:scale-[0.98] transition-transform"
            >
              Lacak Pinjaman
            </button>
          </form>

          <p className="text-xs text-[var(--color-text-muted)] text-center mt-6">
            Kode amanah berbentuk <strong>AMN-XXXX</strong> dan diberikan saat pinjaman dibuat.
          </p>
        </div>
      </div>
    </div>
  )
}
