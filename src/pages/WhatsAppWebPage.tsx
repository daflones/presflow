import { useState } from 'react'
import { 
  QrCode, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone, 
  MessageSquare, 
  Users, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useWhatsAppWeb } from '../hooks/useWhatsAppWeb'
import { QRCodeWebDisplay } from '../components/whatsapp-web/QRCodeWebDisplay'
import { ChatInterface } from '../components/whatsapp-web/ChatInterface'
import { ContactsList } from '../components/whatsapp-web/ContactsList'

export default function WhatsAppWebPage() {
  const {
    isConnected,
    isConnecting,
    qrCode,
    contacts,
    chats,
    messages,
    isLoading,
    error,
    connectWhatsApp,
    disconnectWhatsApp,
    sendMessage,
    sendMedia,
    refreshContacts,
    refreshChats,
    getChatMessages
  } = useWhatsAppWeb()

  const [activeTab, setActiveTab] = useState<'status' | 'chat' | 'contacts'>('status')

  const getStatusBadge = () => {
    if (isConnected) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
          <CheckCircle className="w-3 h-3" />
          Conectado
        </span>
      )
    } else if (isConnecting) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          Conectando
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
          <XCircle className="w-3 h-3" />
          Desconectado
        </span>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            WhatsApp Web
          </h1>
          <p className="text-gray-500">Interface completa do WhatsApp integrada ao sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'status'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Status
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          disabled={!isConnected}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          disabled={!isConnected}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'contacts'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Users className="w-4 h-4" />
          Contatos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Status da Conexão</h3>
                <p className="text-sm text-gray-500">Gerencie sua conexão com o WhatsApp Web</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Erro de conexão</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!isConnected && !isConnecting && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">WhatsApp Web Desconectado</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Conecte-se ao WhatsApp Web para começar a usar todas as funcionalidades
              </p>
              <button 
                onClick={connectWhatsApp}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 mx-auto"
              >
                <QrCode className="w-5 h-5" />
                Conectar WhatsApp
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Clique para gerar um novo QR Code
              </p>
            </div>
          )}

          {isConnecting && (
            <div className="space-y-6">
              {qrCode ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-800">Escaneie o QR Code</h4>
                  <p className="text-gray-600 mb-4">Use seu celular para escanear o código abaixo</p>
                  <QRCodeWebDisplay qrCode={qrCode} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-800">Conectando...</h4>
                  <p className="text-gray-600">Aguarde enquanto geramos o QR Code</p>
                </div>
              )}
            </div>
          )}

          {isConnected && (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-900">WhatsApp Conectado</h4>
                    <p className="text-green-700">Pronto para enviar e receber mensagens</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Contatos</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {contacts?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Conversas</p>
                      <p className="text-2xl font-bold text-indigo-900">
                        {chats?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={refreshContacts}
                    className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 flex items-center gap-2 text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar Contatos
                  </button>
                  <button
                    onClick={refreshChats}
                    className="px-4 py-2 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 flex items-center gap-2 text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar Conversas
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
                        disconnectWhatsApp()
                        setActiveTab('status')
                      }
                    }}
                    className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Desconectar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <ChatInterface 
          chats={chats}
          messages={messages}
          onSendMessage={sendMessage}
          onSendMedia={sendMedia}
          onGetChatMessages={getChatMessages}
          isConnected={isConnected}
        />
      )}

      {activeTab === 'contacts' && (
        <ContactsList 
          contacts={contacts}
          onSendMessage={sendMessage}
          onRefresh={refreshContacts}
        />
      )}

      {/* Informações importantes */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>
        <div>
          <p className="font-medium text-purple-800">Importante:</p>
          <p className="text-sm text-purple-700">
            Esta é uma conexão direta com o WhatsApp Web. 
            Mantenha esta aba aberta para receber mensagens em tempo real. 
            Não use o WhatsApp Web em outro navegador simultaneamente.
          </p>
        </div>
      </div>
    </div>
  )
}
