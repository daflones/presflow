import { useEffect, useState } from 'react'
import { RefreshCw, Smartphone, AlertCircle } from 'lucide-react'
import QRCode from 'qrcode'

interface QRCodeWebDisplayProps {
  qrCode: string
}

export function QRCodeWebDisplay({ qrCode }: QRCodeWebDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [qrExpired, setQrExpired] = useState(false)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then((url: string) => {
        setQrDataUrl(url)
        setQrExpired(false)
        setCountdown(60)
      })
      .catch((err: Error) => {
        console.error('Erro ao gerar QR Code:', err)
      })
    }
  }, [qrCode])

  useEffect(() => {
    if (!qrCode || qrExpired) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setQrExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [qrCode, qrExpired])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">QR Code não disponível</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        {qrExpired ? (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">QR Code Expirado</h3>
            <p className="text-gray-500 mb-4">
              O QR Code expirou. Clique em atualizar para gerar um novo.
            </p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar QR Code
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code WhatsApp Web" 
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Escaneie com seu WhatsApp</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Expira em: <span className="font-mono font-semibold">{countdown}s</span>
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-700 mb-2">Como conectar:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em "Mais opções" (⋮) e depois em "Aparelhos conectados"</li>
              <li>Toque em "Conectar um aparelho"</li>
              <li>Aponte seu celular para este QR Code</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
