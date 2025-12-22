import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappChurchService } from '../services/api/whatsappChurch'
import { toast } from 'sonner'

export function useChurchInstance(churchId: string) {
  return useQuery({
    queryKey: ['church-whatsapp', 'instance', churchId],
    queryFn: () => whatsappChurchService.getChurchInstance(churchId),
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export function useCreateChurchInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ churchId, instanceName, phoneNumber }: { 
      churchId: string; 
      instanceName: string; 
      phoneNumber: string 
    }) => {
      return await whatsappChurchService.createChurchInstance({
        churchId,
        instanceName,
        phoneNumber
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['church-whatsapp', 'instance', variables.churchId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['church-whatsapp', 'instances'] 
      })
      toast.success('Instância WhatsApp criada com sucesso!')
    },
    onError: (error: Error) => {
      let errorMessage = error.message
      
      if (errorMessage.includes('does not match pattern') || errorMessage.includes('number does not match')) {
        errorMessage = 'Número inválido. Use apenas números com código do país (ex: 5511999999999)'
      } else if (errorMessage.includes('already exists')) {
        errorMessage = 'Já existe uma instância com este nome'
      } else if (errorMessage.includes('já possui uma instância')) {
        errorMessage = 'Esta igreja já possui uma instância WhatsApp configurada'
      }
      
      toast.error(`Erro ao criar instância: ${errorMessage}`)
    }
  })
}

export function useDeleteChurchInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (churchId: string) => {
      return await whatsappChurchService.deleteChurchInstance(churchId)
    },
    onSuccess: (_, churchId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['church-whatsapp', 'instance', churchId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['church-whatsapp', 'instances'] 
      })
      toast.success('Instância WhatsApp removida com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover instância: ${error.message}`)
    }
  })
}

export function useChurchInstanceStatus(churchId: string, shouldPoll: boolean = false) {
  return useQuery({
    queryKey: ['church-whatsapp', 'status', churchId],
    queryFn: () => whatsappChurchService.getChurchInstanceStatus(churchId),
    staleTime: 5000,
    refetchInterval: shouldPoll ? 5000 : false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: !!churchId
  })
}

export function useAllChurchInstances() {
  return useQuery({
    queryKey: ['church-whatsapp', 'instances'],
    queryFn: () => whatsappChurchService.getAllChurchInstancesList(),
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}
