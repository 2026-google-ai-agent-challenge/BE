import { createClient } from '@supabase/supabase-js';

// Build-time 또는 초기 실행 시 환경 변수가 비어 있으면 더미 값으로 폴백 처리하여 빌드 중단을 방지합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-id.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-to-prevent-build-crashes';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일에 실제 URL과 KEY를 입력해주세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

