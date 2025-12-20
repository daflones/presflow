import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappService } from '../services/api/whatsapp'
import { whatsappDbService } from '../services/supabase'
import { toast } from 'sonner'

export function useWhatsAppInstance() {
  return useQuery({
    queryKey: ['whatsapp', 'instance'],
    queryFn: () => whatsappService.getInstanceFromProfile(),
    staleTime: 5000, // 5 segundos para detectar mudanças mais rápido
    refetchInterval: 10000, // Refetch a cada 10 segundos
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
    refetchOnMount: true, // Sempre refetch ao montar
  })
}

export function useCreateWhatsAppInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ instanceName, number }: { instanceName: string; number: string }) => {
      // Verificar se já existe instância
      const existingInstance = await whatsappService.getInstanceFromProfile()
      if (existingInstance?.instanceName) {
        throw new Error('Já existe uma instância WhatsApp configurada')
      }

      // Formatar número: remover todos os caracteres especiais, manter apenas dígitos
      const formattedNumber = number.replace(/\D/g, '')
      
      // Validar se o número tem pelo menos 10 dígitos (código país + DDD + número)
      if (formattedNumber.length < 10) {
        throw new Error('Número inválido. Insira o número completo com código do país (ex: 5511999999999)')
      }

      // 1. Criar instância na Evolution API com número formatado
      const response = await whatsappService.createInstance(instanceName, formattedNumber)
      
      // 2. Salvar no localStorage imediatamente
      await whatsappService.saveInstanceToProfile({
        instanceName: response.instance.instanceName,
        instanceId: response.instance.instanceId,
        status: 'connecting' // Status inicial
      })
      
      // 3. Salvar no banco de dados
      try {
        await whatsappDbService.saveInstance({
          instance_name: response.instance.instanceName,
          instance_id: response.instance.instanceId,
          status: 'connecting',
          phone_number: formattedNumber
        })
        console.log('[useCreateWhatsAppInstance] Instância salva no banco de dados')
      } catch (dbError) {
        console.error('[useCreateWhatsAppInstance] Erro ao salvar no banco:', dbError)
        // Não falhar a criação se o banco falhar, apenas logar
      }
      
      return response
    },
    onSuccess: async () => {
      // Invalidar queries para refletir mudanças
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] })
      toast.success('Instância WhatsApp criada com sucesso!')
    },
    onError: (error: Error) => {
      // Tratar erros específicos da Evolution API
      let errorMessage = error.message
      
      if (errorMessage.includes('does not match pattern') || errorMessage.includes('number does not match')) {
        errorMessage = 'Número inválido. Use apenas números com código do país (ex: 5511999999999)'
      } else if (errorMessage.includes('already exists')) {
        errorMessage = 'Já existe uma instância com este nome'
      }
      
      toast.error(`Erro ao criar instância: ${errorMessage}`)
    }
  })
}

export function useWhatsAppStatus(instanceName?: string, shouldPoll: boolean = false) {
  return useQuery({
    queryKey: ['whatsapp', 'status', instanceName],
    queryFn: async () => {
      if (!instanceName) return null
      
      // Primeiro, verificar status no localStorage
      const localInstance = await whatsappService.getInstanceFromProfile()
      
      // Se já está conectado no localStorage, não precisa fazer fetch da Evolution
      if (localInstance?.status === 'open') {
        return {
          instanceName,
          status: 'open',
          owner: null,
          profileName: null
        }
      }
      
      // Só fazer fetch da Evolution se shouldPoll for true (quando criando instância)
      if (!shouldPoll) {
        return {
          instanceName,
          status: 'connecting',
          owner: null,
          profileName: null
        }
      }
      
      try {
        const instance = await whatsappService.getInstanceByName(instanceName)
        
        // Se detectou que conectou (status = 'open'), atualizar localStorage e banco
        // MAS SÓ recarregar se o status anterior NÃO era 'open' (evitar loop infinito)
        if (instance && instance.status === 'open' && instance.owner) {
          const wasAlreadyOpen = localInstance?.status === 'open'
          
          // Atualizar localStorage
          await whatsappService.saveInstanceToProfile({
            instanceName: instance.instanceName,
            instanceId: instance.instanceId,
            status: 'open'
          })
          
          // Atualizar banco de dados com status conectado
          try {
            await whatsappDbService.saveInstance({
              instance_name: instance.instanceName,
              instance_id: instance.instanceId,
              status: 'open',
              connected_at: new Date().toISOString(),
              profile_name: instance.profileName,
              profile_picture_url: instance.profilePictureUrl
            })
            console.log('[useWhatsAppStatus] Status atualizado no banco de dados: open')
          } catch (dbError) {
            console.error('[useWhatsAppStatus] Erro ao atualizar banco:', dbError)
          }
          
          // Só recarregar se estava em outro status antes
          if (!wasAlreadyOpen) {
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          }
        }
        
        return instance
      } catch (error) {
        return null
      }
    },
    enabled: !!instanceName,
    refetchInterval: shouldPoll ? (data: any) => {
      // Parar polling quando conectado
      if (data?.status === 'open') {
        return false // Para o polling
      }
      return 5000 // 5 segundos
    } : false, // Não fazer polling se shouldPoll for false
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  })
}

export function useWhatsAppQRCode(instanceName?: string, status?: string) {
  return useQuery({
    queryKey: ['whatsapp', 'qrcode', instanceName],
    queryFn: async () => {
      if (!instanceName) return null
      return await whatsappService.getQRCode(instanceName)
    },
    enabled: !!instanceName && status !== 'open', // Não buscar QR code se já estiver conectado
    refetchInterval: () => {
      // Se conectado, parar de fazer refetch
      return status === 'open' ? false : 30000
    },
    retry: 1, // Reduzir tentativas
    staleTime: 10000 // Cache por 10 segundos
  })
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (instanceName: string) => {
      // Fazer logout da instância
      await whatsappService.logoutInstance(instanceName)
      
      // Limpar dados do localStorage
      await whatsappService.clearInstanceFromProfile()
      
      // Limpar dados do banco de dados
      try {
        await whatsappDbService.clearInstance()
        console.log('[useDisconnectWhatsApp] Instância removida do banco de dados')
      } catch (dbError) {
        console.error('[useDisconnectWhatsApp] Erro ao limpar banco:', dbError)
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] })
      toast.success('WhatsApp desconectado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`)
    }
  })
}

export function useDeleteWhatsAppInstance() {
  return useMutation({
    mutationFn: async (instanceName: string) => {
      // 1. Limpar dados do localStorage primeiro
      await whatsappService.clearInstanceFromProfile()
      
      // 2. Limpar dados do banco de dados
      try {
        await whatsappDbService.clearInstance()
        console.log('[useDeleteWhatsAppInstance] Instância removida do banco de dados')
      } catch (dbError) {
        console.error('[useDeleteWhatsAppInstance] Erro ao limpar banco:', dbError)
      }
      
      // 3. Deletar instância da Evolution API
      await whatsappService.deleteInstance(instanceName)
      
      // 4. Verificar se foi realmente deletada
      const instance = await whatsappService.getInstanceByName(instanceName)
      if (instance) {
        throw new Error('Instância não foi deletada corretamente')
      }
      
      return true
    },
    onSuccess: async () => {
      toast.success('Instância WhatsApp removida com sucesso!')
      
      // Recarregar página após deletar
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover instância: ${error.message}`)
    }
  })
}
