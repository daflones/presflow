const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://api.evolution-api.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

// Configurações do Supabase (usando service_role para bypass de RLS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper para fazer chamadas ao Supabase REST API
async function supabaseRequest(endpoint, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers
    }
  });
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    if (!response.ok) {
      const errorText = await response.text().catch(() => `Status ${response.statusText}`);
      throw new Error(`Supabase request failed with status ${response.status}: ${errorText}`);
    }
    return null; // Retorna nulo para respostas vazias bem-sucedidas (ex: 201 com prefer=minimal)
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Supabase request failed');
  }

  return data;
}

// Helper para Supabase Auth Admin API
async function supabaseAuthAdmin(endpoint, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const url = `${SUPABASE_URL}/auth/v1/admin/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || data.msg || 'Supabase Auth request failed');
  }
  return data;
}

// Middleware
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Proxy para Evolution API
app.use('/api/evolution', async (req, res) => {
  try {
    const upstreamPath = req.originalUrl.replace(/^\/api\/evolution/, '');
    const upstreamUrl = `${EVOLUTION_API_URL}${upstreamPath}`;

    const method = req.method.toUpperCase();
    const shouldSendBody = !['GET', 'HEAD'].includes(method);

    const upstreamResponse = await fetchAPI(upstreamUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: shouldSendBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    const contentType = upstreamResponse.headers.get('content-type') || '';
    const status = upstreamResponse.status;

    if (contentType.includes('application/json')) {
      const data = await upstreamResponse.json().catch(() => null);
      return res.status(status).json(data);
    }

    const text = await upstreamResponse.text();
    return res.status(status).send(text);
  } catch (error) {
    console.error('Erro no proxy Evolution:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Em produção, servir arquivos estáticos do build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Função para formatar nome da instância
function formatInstanceName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

// Função para fazer fetch (compatível com Node.js)
async function fetchAPI(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  return fetch(url, options);
}

// Endpoint para criar instância
app.post('/api/instance/create', async (req, res) => {
  try {
    console.log('=== CRIAÇÃO DE INSTÂNCIA ===');
    console.log('Recebendo requisição para criar instância:', req.body);
    
    const { instanceName, phoneNumber, number } = req.body;
    const resolvedNumber = phoneNumber || number;
    
    if (!instanceName || !resolvedNumber) {
      console.log('Erro: instanceName ou number/phoneNumber não fornecidos');
      return res.status(400).json({ error: 'instanceName e number (ou phoneNumber) são obrigatórios' });
    }
    
    const formattedName = formatInstanceName(instanceName);
    console.log('Nome formatado:', formattedName);
    
    // Aceita payload "completo" enviado pelo frontend (webhook/settings/etc)
    // e também o formato antigo (phoneNumber).
    const body = {
      ...req.body,
      instanceName: formattedName,
      number: resolvedNumber,
      qrcode: typeof req.body.qrcode === 'boolean' ? req.body.qrcode : true,
      integration: req.body.integration || 'WHATSAPP-BAILEYS',
    };

    console.log('Enviando para Evolution API:', EVOLUTION_API_URL);
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('API Key:', EVOLUTION_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');

    const response = await fetchAPI(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(body)
    });

    console.log('Status da resposta:', response.status);
    const responseText = await response.text();
    console.log('Resposta bruta da Evolution API:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Erro ao fazer parse do JSON:', e);
      data = { error: 'Resposta inválida da Evolution API', rawResponse: responseText };
    }
    
    console.log('Resposta processada:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    console.log('Instância criada com sucesso, aguardando conexão...');
    res.json(data);
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para conectar instância
app.get('/api/instance/connect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { phoneNumber } = req.query;

    console.log('=== CONECTANDO INSTÂNCIA ===');
    console.log('InstanceName:', instanceName);
    console.log('PhoneNumber:', phoneNumber);

    let url = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
    if (phoneNumber) {
      url += `?phone=${phoneNumber}`;
    }

    console.log('URL da requisição:', url);

    const response = await fetchAPI(url, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    console.log('Status da resposta:', response.status);
    const responseText = await response.text();
    console.log('Resposta bruta:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Erro ao fazer parse do JSON:', e);
      data = { error: 'Resposta inválida da Evolution API', rawResponse: responseText };
    }
    
    console.log('Resposta processada:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.log('Erro na resposta da Evolution API:', response.status, responseText);
      return res.status(response.status).json(data);
    }

    console.log('QR Code obtido com sucesso');
    res.json(data);
  } catch (error) {
    console.error('Erro ao conectar instância:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para buscar instâncias
app.get('/api/instance/fetchInstances', async (req, res) => {
  try {
    const response = await fetchAPI(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para verificar status da instância
app.get('/api/instance/status/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log('=== VERIFICANDO STATUS ===');
    console.log('InstanceName:', instanceName);

    const response = await fetchAPI(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    console.log('Status da resposta:', response.status);
    const responseText = await response.text();
    console.log('Resposta bruta:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Erro ao fazer parse do JSON:', e);
      data = { error: 'Resposta inválida da Evolution API', rawResponse: responseText };
    }
    
    console.log('Resposta processada:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const instance = data.find(inst => inst.name === instanceName);
    
    if (!instance) {
      console.log('Instância não encontrada');
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const result = {
      instanceName: instance.name,
      status: instance.connectionStatus,
      profileName: instance.profileName,
      profilePictureUrl: instance.profilePicUrl
    };

    console.log('Status final:', result);
    res.json(result);
  } catch (error) {
    console.error('Erro ao verificar status da instância:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// ========== ENDPOINTS DE CHAT/CONVERSAS ==========

// Endpoint para buscar todos os chats de uma instância
app.post('/api/chat/findChats/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    console.log('=== BUSCANDO CHATS ===');
    console.log('InstanceName:', instanceName);

    const response = await fetchAPI(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({})
    });

    console.log('Status da resposta:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para buscar mensagens de um chat específico
app.post('/api/chat/findMessages/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { remoteJid, limit = 50, page = 1 } = req.body;

    console.log('=== BUSCANDO MENSAGENS ===');
    console.log('InstanceName:', instanceName);
    console.log('RemoteJid:', remoteJid);
    console.log('Limit:', limit, 'Page:', page);

    if (!remoteJid) {
      return res.status(400).json({ error: 'remoteJid é obrigatório' });
    }

    const response = await fetchAPI(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: remoteJid
          }
        },
        limit: limit,
        page: page
      })
    });

    console.log('Status da resposta:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para buscar foto de perfil
app.post('/api/chat/fetchProfilePictureUrl/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number } = req.body;

    console.log('=== BUSCANDO FOTO DE PERFIL ===');
    console.log('InstanceName:', instanceName);
    console.log('Number:', number);

    const response = await fetchAPI(`${EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({ number })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar foto de perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para enviar mensagem de texto
app.post('/api/message/sendText/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, text } = req.body;

    console.log('=== ENVIANDO MENSAGEM ===');
    console.log('InstanceName:', instanceName);
    console.log('Number:', number);
    console.log('Text:', text);

    if (!number || !text) {
      return res.status(400).json({ error: 'number e text são obrigatórios' });
    }

    const response = await fetchAPI(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number,
        text,
        delay: 1200
      })
    });

    console.log('Status da resposta:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para enviar mídia (imagem, vídeo, documento)
app.post('/api/message/sendMedia/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, mediatype, mimetype, caption, media, fileName } = req.body;

    console.log('=== ENVIANDO MÍDIA ===');
    console.log('InstanceName:', instanceName);
    console.log('Number:', number);
    console.log('MediaType:', mediatype);

    if (!number || !media || !mediatype) {
      return res.status(400).json({ error: 'number, media e mediatype são obrigatórios' });
    }

    const response = await fetchAPI(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number,
        mediatype,
        mimetype,
        caption,
        media,
        fileName,
        delay: 1200
      })
    });

    console.log('Status da resposta:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao enviar mídia:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para enviar áudio
app.post('/api/message/sendAudio/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, audio } = req.body;

    console.log('=== ENVIANDO ÁUDIO ===');
    console.log('InstanceName:', instanceName);
    console.log('Number:', number);

    if (!number || !audio) {
      return res.status(400).json({ error: 'number e audio são obrigatórios' });
    }

    const response = await fetchAPI(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number,
        audio,
        delay: 1200
      })
    });

    console.log('Status da resposta:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para buscar mídia em base64
app.post('/api/chat/getBase64/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { message } = req.body;

    console.log('=== BUSCANDO MÍDIA BASE64 ===');
    console.log('InstanceName:', instanceName);

    if (!message) {
      return res.status(400).json({ error: 'message é obrigatório' });
    }

    const response = await fetchAPI(`${EVOLUTION_API_URL}/chat/getBase64/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar mídia base64:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// ==========================================
// ENDPOINTS DE REGISTRO (SUPABASE ADMIN)
// ==========================================

// Função para gerar slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Endpoint para registrar igreja e usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('=== REGISTRO DE IGREJA ===');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase não configurado');
      return res.status(500).json({ error: 'Servidor não configurado corretamente' });
    }

    const { churchName, userName, email, password } = req.body;

    if (!churchName || !userName || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    console.log('Criando usuário no Auth:', email);

    // 1. Criar usuário no Auth
    const authData = await supabaseAuthAdmin('users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: userName
        }
      })
    });

    console.log('Usuário Auth criado:', authData.id);

    const slug = generateSlug(churchName);
    
    // 2. Criar igreja
    const churchData = await supabaseRequest('churches', {
      method: 'POST',
      body: JSON.stringify({
        name: churchName,
        slug: slug,
        email: email,
        plan: 'free',
        is_active: true
      })
    });

    const church = Array.isArray(churchData) ? churchData[0] : churchData;
    console.log('Igreja criada:', church.id);

    // 3. Criar perfil do usuário
    const userData = await supabaseRequest('users', {
      method: 'POST',
      body: JSON.stringify({
        auth_id: authData.id,
        church_id: church.id,
        name: userName,
        email: email,
        role: 'owner',
        is_active: true
      })
    });

    const user = Array.isArray(userData) ? userData[0] : userData;
    console.log('Perfil criado:', user.id);

    res.json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user: {
        id: user.id,
        auth_id: authData.id,
        email: email,
        name: userName
      },
      church: {
        id: church.id,
        name: churchName,
        slug: slug
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para criar usuário em igreja existente
app.post('/api/auth/create-user', async (req, res) => {
  try {
    console.log('=== CRIAÇÃO DE USUÁRIO ===');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase não configurado');
      return res.status(500).json({ error: 'Servidor não configurado corretamente' });
    }

    const { churchId, userName, email, password, role } = req.body;

    if (!churchId || !userName || !email || !password || !role) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    console.log('Criando usuário no Auth:', email);

    // 1. Criar usuário no Auth
    const authData = await supabaseAuthAdmin('users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: userName
        }
      })
    });

    console.log('Usuário Auth criado:', authData.id);

    // 2. Criar perfil do usuário
    const userData = await supabaseRequest('users', {
      method: 'POST',
      body: JSON.stringify({
        auth_id: authData.id,
        church_id: churchId,
        name: userName,
        email: email,
        role: role,
        is_active: true
      })
    });

    const user = Array.isArray(userData) ? userData[0] : userData;
    console.log('Perfil criado:', user.id);

    res.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      user: {
        id: user.id,
        auth_id: authData.id,
        email: email,
        name: userName,
        role: role
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// ==========================================
// ENDPOINTS DE FORMULÁRIO DE VISITAÇÃO
// ==========================================

app.post('/api/forms/submit', async (req, res) => {
  try {
    console.log('=== SUBMISSÃO DE FORMULÁRIO DE VISITAÇÃO ===');
    const responseData = req.body;

    if (!responseData.church_id || !responseData.form_config_id) {
      return res.status(400).json({ error: 'church_id e form_config_id são obrigatórios' });
    }

    // Adicionar metadados do servidor
    responseData.ip_address = req.ip;
    responseData.user_agent = req.headers['user-agent'];

    console.log('Dados recebidos para salvar:', responseData);

    const data = await supabaseRequest('visitation_form_responses', {
      method: 'POST',
      body: JSON.stringify(responseData),
      prefer: 'return=minimal' // Não precisa retornar o objeto inserido
    });

    console.log('Resposta do Supabase:', data);

    res.status(201).json({ success: true, message: 'Formulário enviado com sucesso!' });

  } catch (error) {
    console.error('Erro ao salvar resposta do formulário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});


// Servir frontend em produção
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API Evolution: ${EVOLUTION_API_URL}`);
  console.log(`Supabase: ${SUPABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO'}`);
});
