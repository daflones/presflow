import { supabase } from '../../lib/supabase';

export type DashboardStats = {
  // WhatsApp
  whatsappConnections: { connected: number; total: number };
  
  // Agentes IA
  aiAgentsActive: number;
  
  // Conversas
  activeConversations: number;
  
  // Contatos/CRM
  totalContacts: number;
  totalLeads: number;
  totalActiveClients: number;
  totalInactiveClients: number;
  
  // Taxa de conversão
  conversionRate: number;
  
  // Mensagens
  messagesToday: number;
  messagesSent: number;
  messagesReceived: number;
  
  // Pipeline
  newLeadsToday: number;
  
  // Eventos
  eventsToday: number;
  eventsThisWeek: number;
  eventsFuture: number;
  eventsTotal: number;
  
  // Intenções/Avisos
  noticesPending: number;
  noticesApproved: number;
  noticesConfirmed: number;
  noticesUrgent: number;
  noticesRequests: number;
  noticesAlerts: number;
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Buscar estatísticas em paralelo
    const [
      whatsappResult,
      clientsResult,
      eventsResult,
      noticesResult,
      conversationsResult,
      aiConfigResult,
    ] = await Promise.all([
      // WhatsApp instances
      supabase.from('whatsapp_instances').select('id, status'),
      
      // Clients/CRM
      supabase.from('clients').select('id, status, created_at'),
      
      // Calendar events
      supabase.from('calendar_events').select('id, start_at'),
      
      // Notices
      supabase.from('notices').select('id, type, priority, is_active'),
      
      // Conversations
      supabase.from('conversations').select('id, status, last_message_at'),
      
      // AI Config (para verificar se está ativo)
      supabase.from('ai_configs').select('id'),
    ]);

    // Processar WhatsApp
    const whatsappInstances = whatsappResult.data || [];
    const connectedInstances = whatsappInstances.filter(i => i.status === 'open').length;

    // Processar Clientes
    const clients = clientsResult.data || [];
    const totalContacts = clients.length;
    const totalLeads = clients.filter(c => c.status === 'lead').length;
    const totalActiveClients = clients.filter(c => c.status === 'ativo').length;
    const totalInactiveClients = clients.filter(c => c.status === 'inativo').length;
    const newLeadsToday = clients.filter(c => 
      c.status === 'lead' && new Date(c.created_at) >= today
    ).length;

    // Calcular taxa de conversão
    const conversionRate = totalContacts > 0 
      ? Math.round((totalActiveClients / totalContacts) * 100) 
      : 0;

    // Processar Eventos
    const events = eventsResult.data || [];
    const eventsToday = events.filter(e => {
      const eventDate = new Date(e.start_at);
      return eventDate.toDateString() === today.toDateString();
    }).length;
    
    const eventsThisWeek = events.filter(e => {
      const eventDate = new Date(e.start_at);
      return eventDate >= today && eventDate <= endOfWeek;
    }).length;
    
    const eventsFuture = events.filter(e => new Date(e.start_at) > today).length;
    const eventsTotal = events.length;

    // Processar Avisos
    const notices = noticesResult.data || [];
    const activeNotices = notices.filter(n => n.is_active);
    const noticesPending = activeNotices.filter(n => n.type === 'info').length;
    const noticesApproved = activeNotices.filter(n => n.priority === 0).length;
    const noticesConfirmed = activeNotices.length;
    const noticesUrgent = activeNotices.filter(n => n.type === 'urgent' || n.priority === 2).length;
    const noticesRequests = activeNotices.filter(n => n.type === 'warning').length;
    const noticesAlerts = activeNotices.filter(n => n.type === 'event').length;

    // Processar Conversas
    const conversations = conversationsResult.data || [];
    const activeConversations = conversations.filter(c => c.status === 'open').length;

    // Processar IA
    const aiConfigs = aiConfigResult.data || [];
    const aiAgentsActive = aiConfigs.length > 0 ? 1 : 0;

    // Mensagens (simplificado - idealmente buscaria da tabela messages)
    const messagesToday = 0;
    const messagesSent = 0;
    const messagesReceived = 0;

    return {
      whatsappConnections: { connected: connectedInstances, total: whatsappInstances.length },
      aiAgentsActive,
      activeConversations,
      totalContacts,
      totalLeads,
      totalActiveClients,
      totalInactiveClients,
      conversionRate,
      messagesToday,
      messagesSent,
      messagesReceived,
      newLeadsToday,
      eventsToday,
      eventsThisWeek,
      eventsFuture,
      eventsTotal,
      noticesPending,
      noticesApproved,
      noticesConfirmed,
      noticesUrgent,
      noticesRequests,
      noticesAlerts,
    };
  },
};
