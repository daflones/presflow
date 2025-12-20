import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { 
  MessageCircle, 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { 
  useWhatsAppInstance, 
  useCreateWhatsAppInstance, 
  useWhatsAppStatus,
  useWhatsAppQRCode,
  useDeleteWhatsAppInstance
} from '../hooks/useWhatsApp'

export default function WhatsAppPage() {
  const [instanceName, setInstanceName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data: instance, isLoading: instanceLoading } = useWhatsAppInstance()
  
  // Determinar se deve fazer polling baseado no status da instância
  const shouldPoll = Boolean(instance?.instanceName && (!instance.status || instance.status !== 'open'))
  
  const { data: status, isLoading: statusLoading } = useWhatsAppStatus(instance?.instanceName || undefined, shouldPoll)
  const { data: qrCode, isLoading: qrLoading } = useWhatsAppQRCode(instance?.instanceName || undefined, status?.status)
  
  const createInstance = useCreateWhatsAppInstance()
  const deleteInstance = useDeleteWhatsAppInstance()

  // Função para gerar nome da instância baseado em um padrão
  const generateInstanceName = (baseName: string) => {
    return baseName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens no início e fim
  }

  // Gerar nome padrão para instância
  useEffect(() => {
    if (!instanceName) {
      const generatedName = generateInstanceName('igreja-prestflow')
      setInstanceName(generatedName)
    }
  }, [instanceName])

  const handleCreateInstance = async () => {
    if (!instanceName.trim() || !phoneNumber.trim()) return
    
    try {
      await createInstance.mutateAsync({ 
        instanceName: instanceName.trim(), 
        number: phoneNumber.trim() 
      })
      setInstanceName('')
      setPhoneNumber('')
      setShowCreateForm(false)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async () => {
    if (!instance?.instanceName) return
    if (!confirm('Tem certeza que deseja remover completamente esta instância? Esta ação não pode ser desfeita.')) return
    
    try {
      await deleteInstance.mutateAsync(instance.instanceName)
      // Forçar reset do estado local após delete bem-sucedido
      setShowCreateForm(false)
      setInstanceName('')
      setPhoneNumber('')
    } catch (error) {
      // Error handled by hook
    }
  }

  const getStatusBadge = (currentStatus?: string) => {
    switch (currentStatus) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Conectando</Badge>
      case 'close':
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertTriangle className="w-3 h-3 mr-1" />Desconhecido</Badge>
    }
  }

  const currentStatus = status?.status || instance?.status

  if (instanceLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conexões WhatsApp</h1>
        <p className="text-gray-600">Configure suas instâncias do WhatsApp para enviar mensagens</p>
      </div>

      {!instance?.instanceName ? (
        // Formulário de criação de instância
        <Card className="max-w-2xl mx-auto shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Smartphone className="w-6 h-6" />
              Criar Nova Conexão
            </CardTitle>
            <CardDescription className="text-blue-100">
              Configure uma nova instância do WhatsApp para sua organização
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {!showCreateForm ? (
              <div className="text-center py-8">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-16 h-16 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Nenhuma conexão configurada</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Crie sua primeira conexão do WhatsApp para começar a enviar mensagens para seus contatos
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)} 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-medium"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Criar Conexão
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="instanceName" className="text-gray-700 font-medium">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    placeholder="nome-da-instancia"
                    className="mt-2 h-11 text-base"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Nome único para identificar sua instância (sem espaços ou caracteres especiais)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">Número do WhatsApp</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="5511999999999"
                    className="mt-2 h-11 text-base"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Número completo com código do país (ex: 5511999999999)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreateInstance}
                    disabled={createInstance.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
                  >
                    {createInstance.isPending ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5 mr-2" />
                    )}
                    Criar Conexão
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={createInstance.isPending}
                    className="h-12 px-6 text-base"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Status da instância existente
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    {instance.instanceName}
                  </CardTitle>
                  <CardDescription>
                    ID: {instance.instanceId}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(currentStatus)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteInstance.isPending}
                  >
                    {deleteInstance.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instance.connectedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conectado em:</span>
                    <span className="text-sm text-gray-500">
                      {new Date(instance.connectedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          {currentStatus === 'connecting' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code para Conexão
                </CardTitle>
                <CardDescription>
                  Escaneie este QR Code com seu WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  {qrLoading ? (
                    <div className="flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg">
                      <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : qrCode?.code ? (
                    <>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <img 
                          src={`data:image/png;base64,${qrCode.code}`}
                          alt="QR Code"
                          className="w-48 h-48"
                          onError={(e) => {
                            console.error('Erro ao carregar QR Code:', e);
                            console.log('QR Code data:', qrCode);
                          }}
                        />
                      </div>
                      {qrCode.pairingCode && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Código de pareamento:</p>
                          <p className="font-mono text-lg font-bold text-blue-600">
                            {qrCode.pairingCode}
                          </p>
                        </div>
                      )}
                      <Alert>
                        <QrCode className="w-4 h-4" />
                        <AlertDescription>
                          Abra o WhatsApp, vá em "Conectados" &gt; "Conectar dispositivo" e escaneie o QR Code acima.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : qrCode?.count === 0 ? (
                    <Alert>
                      <Clock className="w-4 h-4" />
                      <AlertDescription>
                        QR Code ainda não disponível. A instância está sendo preparada. Isso pode levar alguns segundos...
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        QR Code ainda não disponível. A instância está sendo preparada. Isso pode levar alguns segundos...
                        <div className="mt-2 text-xs text-gray-500">
                          Status: {currentStatus} | QR Code Count: {qrCode?.count || 0}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Loading */}
          {statusLoading && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-600">Verificando status...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
