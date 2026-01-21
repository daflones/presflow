import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function ConversationsPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/conversas', { replace: true })
  }, [navigate])

  return null
}
