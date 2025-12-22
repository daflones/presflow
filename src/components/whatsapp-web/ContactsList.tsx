import { useState } from 'react'
import { 
  Users, 
  Search, 
  MessageSquare, 
  RefreshCw,
  Building2,
  User
} from 'lucide-react'
import type { WhatsAppContact } from '../../hooks/useWhatsAppWeb'

interface ContactsListProps {
  contacts: WhatsAppContact[]
  onSendMessage: (to: string, message: string) => void
  onRefresh: () => void
}

export function ContactsList({ contacts, onSendMessage, onRefresh }: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
  const [messageText, setMessageText] = useState('')

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number?.includes(searchTerm)
  )

  const handleSendMessage = () => {
    if (!selectedContact || !messageText.trim()) return
    
    onSendMessage(selectedContact.id, messageText.trim())
    setMessageText('')
    setSelectedContact(null)
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Contatos</h3>
              <p className="text-sm text-gray-500">{contacts.length} contatos</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum contato encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
                    contact.isBusiness ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {contact.isBusiness ? (
                      <Building2 className="w-6 h-6" />
                    ) : (
                      contact.name?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">{contact.name || 'Sem nome'}</h4>
                    <p className="text-sm text-gray-500">{contact.displayNumber || contact.number}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {contact.isMyContact && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Meu contato
                        </span>
                      )}
                      {contact.isBusiness && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Empresa
                        </span>
                      )}
                      {contact.verifiedName && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedContact(contact)
                    }}
                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de envio de mensagem */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
                  selectedContact.isBusiness ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {selectedContact.isBusiness ? (
                    <Building2 className="w-6 h-6" />
                  ) : (
                    selectedContact.name?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedContact.name || 'Sem nome'}</h3>
                  <p className="text-sm text-gray-500">{selectedContact.displayNumber || selectedContact.number}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <textarea
                placeholder="Digite sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 resize-none"
              />
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedContact(null)
                  setMessageText('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
