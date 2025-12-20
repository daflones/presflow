import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://api.evolution-api.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

// Configurações do Supabase (usando service_role para bypass de RLS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente Supabase com service_role (bypass RLS)
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Middleware
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Em desenvolvimento, não servir arquivos estáticos
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Função para formatar nome da instância
function formatInstanceName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

// Endpoint para criar instância
app.post('/api/instance/create', async (req, res) => {
  try {
    console.log('=== CRIAÇÃO DE INSTÂNCIA ===');
    console.log('Recebendo requisição para criar instância:', req.body);
    
    const { instanceName, phoneNumber } = req.body;
    
    if (!instanceName || !phoneNumber) {
      console.log('Erro: instanceName ou phoneNumber não fornecidos');
      return res.status(400).json({ error: 'instanceName e phoneNumber são obrigatórios' });
    }
    
    const formattedName = formatInstanceName(instanceName);
    console.log('Nome formatado:', formattedName);
    
    const body = {
      instanceName: formattedName,
      token: '', // Deixar vazio para criar dinamicamente
      qrcode: true,
      number: phoneNumber,
      integration: 'WHATSAPP-BAILEYS',
      reject_call: false,
      msg_call: '',
      groups_ignore: true,
      always_online: false,
      read_messages: false,
      read_status: false,
      websocket_enabled: false,
      rabbitmq_enabled: false,
      sqs_enabled: false
    };

    console.log('Enviando para Evolution API:', EVOLUTION_API_URL);
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('API Key:', EVOLUTION_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');

    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
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

    // Retornar dados da criação sem tentar obter QR Code ainda
    // O frontend deverá chamar o endpoint connect separadamente
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

    const response = await fetch(url, {
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
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
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

    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
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

    // Encontrar a instância específica
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

    const response = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
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

    const response = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
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

    const response = await fetch(`${EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${instanceName}`, {
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

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
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

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
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

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
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

// Endpoint para buscar mídia em base64 (para exibir imagens/áudios/documentos)
app.post('/api/chat/getBase64/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { message } = req.body;

    console.log('=== BUSCANDO MÍDIA BASE64 ===');
    console.log('InstanceName:', instanceName);

    if (!message) {
      return res.status(400).json({ error: 'message é obrigatório' });
    }

    const response = await fetch(`${EVOLUTION_API_URL}/chat/getBase64/${instanceName}`, {
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
    
    if (!supabaseAdmin) {
      console.error('Supabase Admin não configurado');
      return res.status(500).json({ error: 'Servidor não configurado corretamente' });
    }

    const { churchName, userName, email, password } = req.body;

    if (!churchName || !userName || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    console.log('Criando usuário no Auth:', email);

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name: userName
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário Auth:', authError);
      return res.status(400).json({ error: authError.message });
    }

    console.log('Usuário Auth criado:', authData.user.id);

    // 2. Criar igreja na tabela churches
    const slug = generateSlug(churchName);
    const { data: churchData, error: churchError } = await supabaseAdmin
      .from('churches')
      .insert({
        name: churchName,
        slug: slug,
        email: email,
        plan: 'free',
        is_active: true
      })
      .select()
      .single();

    if (churchError) {
      console.error('Erro ao criar igreja:', churchError);
      // Tentar deletar usuário Auth se falhar
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: 'Erro ao criar igreja: ' + churchError.message });
    }

    console.log('Igreja criada:', churchData.id);

    // 3. Criar perfil do usuário na tabela users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        church_id: churchData.id,
        name: userName,
        email: email,
        role: 'owner',
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar perfil:', userError);
      // Tentar deletar igreja e usuário Auth se falhar
      await supabaseAdmin.from('churches').delete().eq('id', churchData.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: 'Erro ao criar perfil: ' + userError.message });
    }

    console.log('Perfil criado:', userData.id);

    res.json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user: {
        id: userData.id,
        auth_id: authData.user.id,
        email: email,
        name: userName
      },
      church: {
        id: churchData.id,
        name: churchName,
        slug: slug
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para criar usuário em igreja existente (admin cria membro)
app.post('/api/auth/create-user', async (req, res) => {
  try {
    console.log('=== CRIAÇÃO DE USUÁRIO ===');
    
    if (!supabaseAdmin) {
      console.error('Supabase Admin não configurado');
      return res.status(500).json({ error: 'Servidor não configurado corretamente' });
    }

    const { churchId, userName, email, password, role } = req.body;

    if (!churchId || !userName || !email || !password || !role) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    console.log('Criando usuário no Auth:', email);

    // 1. Criar usuário no Supabase Auth (sem logar automaticamente)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: userName
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário Auth:', authError);
      return res.status(400).json({ error: authError.message });
    }

    console.log('Usuário Auth criado:', authData.user.id);

    // 2. Criar perfil do usuário na tabela users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        church_id: churchId,
        name: userName,
        email: email,
        role: role,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar perfil:', userError);
      // Deletar usuário Auth se falhar
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: 'Erro ao criar perfil: ' + userError.message });
    }

    console.log('Perfil criado:', userData.id);

    res.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      user: {
        id: userData.id,
        auth_id: authData.user.id,
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

// Servir frontend em produção (apenas se não for rota de API)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API Evolution: ${EVOLUTION_API_URL}`);
  console.log(`Supabase Admin: ${supabaseAdmin ? 'Configurado' : 'NÃO CONFIGURADO'}`);
});
