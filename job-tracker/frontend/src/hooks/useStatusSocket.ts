import { useEffect, useRef, useState } from 'react'
import type { SocketEvent } from '@/services/types'

export type SocketState = 'connecting' | 'live' | 'offline'

/** 25s: proxies commonly kill idle sockets at ~60s, and the server answers
 *  "ping" with a pong (see websockets/status_ws.py). */
const HEARTBEAT_MS = 25_000
const MAX_BACKOFF_MS = 30_000

/**
 * Holds the socket to /ws/status for the lifetime of a session.
 *
 * The token rides in the query string because the browser's WebSocket
 * constructor cannot set headers — the backend documents the same tradeoff and
 * mitigates it with a 60-minute expiry.
 */
export function useStatusSocket(
  token: string | null,
  onEvent: (event: SocketEvent) => void
): SocketState {
  const [state, setState] = useState<SocketState>('offline')

  // Held in a ref so a changing callback identity never tears down the socket.
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!token) {
      setState('offline')
      return
    }

    let socket: WebSocket | null = null
    let heartbeat: ReturnType<typeof setInterval> | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    // Guards against a reconnect firing after the effect has been cleaned up,
    // which would leave an orphan socket alive after logout.
    let disposed = false

    const connect = () => {
      if (disposed) return
      setState('connecting')

      const base =
        import.meta.env.VITE_WS_URL ??
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
          window.location.host
        }`
      socket = new WebSocket(
        `${base}/ws/status?token=${encodeURIComponent(token)}`
      )

      socket.onopen = () => {
        if (disposed) return
        attempts = 0
        setState('live')
        heartbeat = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send('ping')
        }, HEARTBEAT_MS)
      }

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as SocketEvent
          if (event.event_type === 'pong') return // heartbeat ack, not news
          handlerRef.current(event)
        } catch {
          // A malformed frame is not worth tearing the connection down for.
        }
      }

      socket.onclose = (event) => {
        clearInterval(heartbeat)
        if (disposed) return
        setState('offline')

        // 1008 is the policy-violation close the server sends for a bad or
        // expired token. Retrying with the same token would loop forever.
        if (event.code === 1008) return

        attempts += 1
        const delay = Math.min(1000 * 2 ** (attempts - 1), MAX_BACKOFF_MS)
        retry = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        // onclose always follows, and that is where reconnect is handled.
        socket?.close()
      }
    }

    connect()

    return () => {
      disposed = true
      clearInterval(heartbeat)
      clearTimeout(retry)
      // Remove onclose first, or closing here schedules a reconnect.
      if (socket) {
        socket.onclose = null
        socket.close()
      }
    }
  }, [token])

  return state
}
