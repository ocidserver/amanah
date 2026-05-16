import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import App from "./App"
import "./index.css"
import "./stores/theme-store"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

const localStoragePersister = createSyncStoragePersister({
  storage: localStorage,
  key: "amanah-query-cache",
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: localStoragePersister, maxAge: 24 * 60 * 60 * 1000 }}
        onSuccess={() => {
          queryClient.resumePausedMutations().then(() => {
            queryClient.invalidateQueries()
          })
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
