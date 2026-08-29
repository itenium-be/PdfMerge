import { useCallback, useRef, useState } from 'react'

/** Undo/redo over any immutable value: every edit pushes the value it replaced. */
export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState(initial)
  const past = useRef<T[]>([])
  const future = useRef<T[]>([])
  const [depth, setDepth] = useState({ past: 0, future: 0 })

  const sync = () => setDepth({ past: past.current.length, future: future.current.length })

  const set = useCallback((next: T) => {
    past.current.push(present)
    future.current = []
    setPresent(next)
    sync()
  }, [present])

  const undo = useCallback(() => {
    const previous = past.current.pop()
    if (previous === undefined) return
    future.current.push(present)
    setPresent(previous)
    sync()
  }, [present])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (next === undefined) return
    past.current.push(present)
    setPresent(next)
    sync()
  }, [present])

  return { present, set, undo, redo, canUndo: depth.past > 0, canRedo: depth.future > 0 }
}
