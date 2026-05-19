import { supabase } from './supabase';

export async function loginUser(id: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  return data;
}

export async function loginAdmin(id: string, password: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', id)
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  return data;
}
