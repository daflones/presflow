import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SetlistPage } from './pages/SetlistPage'
import { DashboardPage } from './pages/DashboardPage';
import WhatsAppPage from './pages/WhatsAppPage';
import WhatsAppChatPage from './pages/WhatsAppChatPage';
// import WhatsAppWebPage from './pages/WhatsAppWebPage'; // Desabilitado temporariamente
import { AgentPage } from './pages/AgentPage';
import { ContactsPage } from './pages/ContactsPage';
import { CalendarPage } from './pages/CalendarPage';
import { NoticesPage } from './pages/NoticesPage';
import { UsersPage } from './pages/UsersPage';
import { ArquivosIAPage } from './pages/ArquivosIAPage';
import { PerfilIgrejaPage } from './pages/PerfilIgrejaPage';
import { VisitationResponsesPage } from './pages/VisitationResponsesPage';
import { AdminDashboard, AdminIgrejas, AdminConfigIA, AdminClientes, AdminArquivos, AdminServicos, AdminHospedagem, AdminVisitacao } from './pages/admin';
import { AdminCalendario } from './pages/admin/AdminCalendario';
import { PublicVisitationForm } from './pages/PublicVisitationForm';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/setlist',
    element: <SetlistPage />,
  },
  {
    path: '/form/:slug',
    element: <PublicVisitationForm />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/whatsapp', element: <WhatsAppPage /> },
          // { path: '/whatsapp-web', element: <WhatsAppWebPage /> }, // Desabilitado temporariamente
          { path: '/conversas', element: <WhatsAppChatPage /> },
          { path: '/agente-ia', element: <AgentPage /> },
          { path: '/arquivos-ia', element: <ArquivosIAPage /> },
          { path: '/contatos', element: <ContactsPage /> },
          { path: '/calendario', element: <CalendarPage /> },
          { path: '/visitacao', element: <VisitationResponsesPage /> },
          { path: '/avisos', element: <NoticesPage /> },
          { path: '/usuarios', element: <UsersPage /> },
          { path: '/perfil-igreja', element: <PerfilIgrejaPage /> },
        ],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'igrejas', element: <AdminIgrejas /> },
          { path: 'calendario', element: <AdminCalendario /> },
          { path: 'config-ia', element: <AdminConfigIA /> },
          { path: 'servicos', element: <AdminServicos /> },
          { path: 'hospedagem', element: <AdminHospedagem /> },
          { path: 'visitacao', element: <AdminVisitacao /> },
          { path: 'clientes', element: <AdminClientes /> },
          { path: 'arquivos', element: <AdminArquivos /> },
        ],
      },
    ],
  },
])
