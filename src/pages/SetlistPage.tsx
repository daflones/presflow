import { useMemo } from 'react'

export function SetlistPage() {
  const src = useMemo(() => {
    return '/html_cifras/(Setlist)%2017-01-2026.html'
  }, [])

  return (
    <div className="w-screen h-screen bg-black">
      <iframe
        src={src}
        title="Setlist"
        className="w-full h-full border-0"
      />
    </div>
  )
}
