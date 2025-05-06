import { Machine } from '@/types';
import { supabase } from './supabase';

export const getMachines = async (): Promise<Machine[]> => {
  const { data, error } = await supabase
    .from('machines')
    .select('*');

  if (error) {
    throw error;
  }

  return data || [];
}; 