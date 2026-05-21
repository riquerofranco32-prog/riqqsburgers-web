'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="toast-enter fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-2xl shadow-2xl max-w-xs">
      <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onDismiss} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
