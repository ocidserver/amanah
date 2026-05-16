import { useState } from "react"
import { IconXCircle, IconDownload, IconZoomIn } from "../components/Icons"

interface DocumentViewerProps {
  url: string
  label: string
  variant?: "image" | "pdf"
  thumbnail?: boolean
  className?: string
}

export default function DocumentViewer({ url, label, variant = "image", thumbnail = false, className = "" }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (!url) {
    return <span className="text-gray-400 text-sm">Tidak tersedia</span>
  }

  if (thumbnail) {
    return (
      <>
        <button
          onClick={() => { setIsOpen(true); setHasError(false) }}
          className={`relative group overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${className}`}
        >
          {variant === "image" ? (
            <img src={url} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center p-6">
              <IconDownload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500">PDF</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <IconZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>
        </button>

        {isOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{label}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <IconDownload className="w-4 h-4" /> Buka di tab baru
                  </a>
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <IconXCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto" style={{ maxHeight: "calc(90vh - 56px)" }}>
                {variant === "image" ? (
                  hasError ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                      <IconDownload className="w-12 h-12 mb-3" />
                      <p className="text-sm">Gagal memuat gambar</p>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={label}
                      className="w-full h-auto object-contain"
                      onError={() => setHasError(true)}
                    />
                  )
                ) : (
                  <iframe
                    src={url}
                    className="w-full"
                    style={{ height: "calc(90vh - 56px)", border: "none" }}
                    title={label}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
      >
        {label} →
      </a>
    </>
  )
}
