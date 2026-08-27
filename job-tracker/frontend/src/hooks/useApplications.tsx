import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applications as applicationsApi, dashboard } from '@/services/api'
import { getToken } from '@/services/client'
import type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  DashboardStats,
  SocketEvent,
  Status,
} from '@/services/types'
import { useAuth } from './useAuth'
import { useStatusSocket, type SocketState } from './useStatusSocket'

interface ApplicationsValue {
  items: Application[]
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  socket: SocketState
  refresh: () => Promise<void>
  create: (data: ApplicationCreate) => Promise<Application>
  update: (id: string, data: ApplicationUpdate) => Promise<Application>
  updateStatus: (id: string, status: Status) => Promise<void>
  remove: (id: string) => Promise<void>
}

const ApplicationsContext = createContext<ApplicationsValue | null>(null)

/**
 * One cache of the application list for the whole session, so the dashboard,
 * ledger, and detail pages agree with each other and a socket event only has
 * to be applied in one place.
 */
export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<Application[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      // Stats are Redis-cached server-side and invalidated on every write, so
      // fetching both together stays consistent and costs one cheap read.
      const [list, next] = await Promise.all([
        applicationsApi.list(),
        dashboard.stats(),
      ])
      setItems(list)
      setStats(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void refresh()
    } else {
      setItems([])
      setStats(null)
      setLoading(false)
    }
  }, [user, refresh])

  const onSocketEvent = useCallback(
    (event: SocketEvent) => {
      if (event.event_type !== 'status_changed') return

      // Patch the row in place rather than refetching: the event carries the
      // new status, and this is what makes a second tab update without a
      // network round trip.
      setItems((current) =>
        current.map((item) =>
          item.id === event.application_id
            ? {
                ...item,
                status: event.new_status,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      )

      // Stats can't be patched safely from one event — response_rate is
      // derived across the whole set — so re-read the cached endpoint.
      void dashboard.stats().then(setStats).catch(() => undefined)
    },
    []
  )

  const socket = useStatusSocket(user ? getToken() : null, onSocketEvent)

  const create = useCallback(async (data: ApplicationCreate) => {
    const created = await applicationsApi.create(data)
    setItems((current) => [created, ...current])
    void dashboard.stats().then(setStats).catch(() => undefined)
    return created
  }, [])

  const update = useCallback(async (id: string, data: ApplicationUpdate) => {
    const updated = await applicationsApi.update(id, data)
    setItems((current) => current.map((item) => (item.id === id ? updated : item)))
    // Stats are derived from status and row count, neither of which this
    // endpoint can change, so there is nothing to re-read.
    return updated
  }, [])

  const updateStatus = useCallback(async (id: string, status: Status) => {
    const updated = await applicationsApi.updateStatus(id, status)
    // The socket will also deliver this change to this tab; applying it here
    // too is harmless (same value) and keeps the UI honest if the socket is
    // offline.
    setItems((current) =>
      current.map((item) => (item.id === id ? updated : item))
    )
    void dashboard.stats().then(setStats).catch(() => undefined)
  }, [])

  const remove = useCallback(async (id: string) => {
    await applicationsApi.remove(id)
    setItems((current) => current.filter((item) => item.id !== id))
    void dashboard.stats().then(setStats).catch(() => undefined)
  }, [])

  const value = useMemo(
    () => ({
      items,
      stats,
      loading,
      error,
      socket,
      refresh,
      create,
      update,
      updateStatus,
      remove,
    }),
    [items, stats, loading, error, socket, refresh, create, update, updateStatus, remove]
  )

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  )
}

export function useApplications() {
  const context = useContext(ApplicationsContext)
  if (!context) {
    throw new Error('useApplications must be used inside <ApplicationsProvider>')
  }
  return context
}
