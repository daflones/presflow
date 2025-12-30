import { supabase } from '../../lib/supabase';
import { getUserData } from '../../lib/user';

export interface FormResponse {
  id: string;
  nome: string;
  telefone: string | null;
  status: string;
  data_visita: string;
  created_at: string;
}

export const formsService = {
  async getLatestResponses(limit = 5): Promise<FormResponse[]> {
    const userData = await getUserData();
    if (!userData?.church_id) {
      console.error('Church ID not found for current user.');
      return [];
    }

    const { data, error } = await supabase
      .from('visitation_form_responses')
      .select('id, nome, telefone, status, data_visita, created_at')
      .eq('church_id', userData.church_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching form responses:', error);
      throw error;
    }

    return data || [];
  },
};
