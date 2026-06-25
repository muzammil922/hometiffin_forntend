import { useSyncExternalStore } from 'react'

const MD_QUERY = '(min-width: 768px)'

function subscribe(onChange) {
  const mq = window.matchMedia(MD_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSnapshot() {
  return window.matchMedia(MD_QUERY).matches
}

function getServerSnapshot() {
  return false
}

export default function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
