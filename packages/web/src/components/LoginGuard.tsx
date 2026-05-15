import { useAuth } from "../hooks/use-auth"

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const { restoreSession, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-gray-400">Memuat...</div>
      </div>
    )
  }

  return <>{children}</>
}