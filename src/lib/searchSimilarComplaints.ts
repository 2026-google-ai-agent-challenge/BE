import { supabase } from './supabase';
import { Complaint } from './complaints';

/**
 * 키워드 배열을 받아 complaints 테이블의 content를 LIKE(ilike) 검색하여
 * 유사 민원 최대 3개를 반환하는 함수
 * 
 * @param keywords 검색할 키워드 배열 (예: ['도로', '파손', '포트홀'])
 * @returns 유사 민원 배열 (최대 3개)
 */
export async function searchSimilarComplaints(keywords: string[]): Promise<Complaint[]> {
  // 유효한 키워드 필터링 (공백 제거 및 빈 문자열 제외)
  const validKeywords = keywords
    .map((kw) => kw.trim())
    .filter((kw) => kw.length > 0);

  if (validKeywords.length === 0) {
    return [];
  }

  // Supabase (PostgREST)의 OR 필터를 사용하여 여러 키워드 중 하나라도 포함하는(LIKE) 조건 생성
  // 형식: "content.ilike.%키워드1%,content.ilike.%키워드2%..."
  const orCondition = validKeywords
    .map((kw) => `content.ilike.%${kw}%`)
    .join(',');

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('status', '처리완료')
    .or(orCondition)
    .limit(3);

  if (error) {
    console.error('유사 민원 검색 중 오류 발생:', error, '검색 키워드:', validKeywords);
    throw error;
  }

  return data as Complaint[];
}
