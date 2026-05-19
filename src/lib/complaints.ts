import { supabase } from './supabase';

export interface Complaint {
  id?: string;
  title: string;
  content: string;
  actual_department: string;
  ai_department_1?: string | null;
  ai_department_2?: string | null;
  ai_department_3?: string | null;
  ai_reason?: string | null;
  final_department?: string | null;
  created_at?: string;
  status?: string; // '대기중' | '처리중' | '처리완료'
  user_id?: string; // 작성자 ID
  solved_at?: string | null; // 처리완료 시간
}

/**
 * 0. 새로운 민원을 생성하고 사용자의 민원 목록에 추가하는 함수
 */
export async function submitUserComplaint(userId: string, title: string, content: string, actual_department: string) {
  // 민원 생성 (작성자 user_id 포함)
  const { data: complaintData, error: complaintError } = await supabase
    .from('complaints')
    .insert([{ title, content, actual_department, user_id: userId }])
    .select()
    .single();

  if (complaintError) {
    throw new Error(`민원 생성 중 오류: ${complaintError.message}`);
  }

  return complaintData;
}

/**
 * 1. 샘플 민원 데이터를 complaints 테이블에 삽입하는 함수
 */
export async function insertSampleComplaints() {
  const sampleData: Omit<Complaint, 'id' | 'created_at'>[] = [
    {
      title: '도로 파손 및 포트홀 복구 요청',
      content: '시청 앞 사거리 도로에 큰 포트홀이 생겨 차량 타이어가 손상될 뻔했습니다. 사고 위험이 있으니 신속한 도로 보수를 요청합니다.',
      actual_department: '도로관리과',
      ai_department_1: '도로관리과',
      ai_department_2: '교통행정과',
      ai_department_3: '안전총괄과',
      ai_reason: '도로 파손 보수 및 포트홀 복구는 도로관리과의 주 업무이며, 교통안전 및 차량 통행 불편과 관련되어 교통행정과와 안전총괄과가 부가 부서로 추천됨.',
      final_department: '도로관리과'
    },
    {
      title: '공원 내 가로등 고장 신고',
      content: '중앙공원 산책로 중간 지점의 가로등 3개가 며칠째 켜지지 않아 밤길이 너무 어둡고 불량배들이 모여 우려됩니다. 조속히 수리 바랍니다.',
      actual_department: '공원녹지과',
      ai_department_1: '공원녹지과',
      ai_department_2: '도시재생과',
      ai_department_3: '안전총괄과',
      ai_reason: '공원 시설물 정비 및 조명 관리는 공원녹지과 소관이며, 도시 방범 및 야간 안전을 위해 안전총괄과가 연관될 수 있음.',
      final_department: '공원녹지과'
    },
    {
      title: '소방도로 불법 주정차 단속 요청',
      content: '아파트 단지 진입로 소방차 전용 구역에 상습적으로 불법 주정차를 하는 차량들이 있습니다. 화재 발생 시 큰 피해가 우려되니 즉각적인 단속을 요청합니다.',
      actual_department: '교통지도과',
      ai_department_1: '교통지도과',
      ai_department_2: '소방재난본부',
      ai_department_3: '안전총괄과',
      ai_reason: '불법 주정차 단속 및 과태료 부과는 교통지도과 소관이며, 소방도로 확보는 소방재난본부 및 안전 관련 부서와 밀접한 연관이 있음.',
      final_department: '교통지도과'
    },
    {
      title: '상가 밤샘 소음 규제 요청',
      content: '상업지구 인근 주택가인데, 근처 맥주집에서 밤늦게까지 야외 테이블을 펼쳐놓고 고성방가를 유발합니다. 수면에 큰 방해가 되니 야간 소음 단속을 원합니다.',
      actual_department: '환경위생과',
      ai_department_1: '환경위생과',
      ai_department_2: '지역경제과',
      ai_department_3: '도시지도과',
      ai_reason: '생활 소음 및 규제 업무는 환경위생과 소속이며, 상가 불법 영업 및 노상 테이블 적치는 도시지도과나 지역경제과 소관일 수 있음.',
      final_department: '환경위생과'
    }
  ];

  const { data, error } = await supabase
    .from('complaints')
    .insert(sampleData)
    .select();

  if (error) {
    console.error('샘플 데이터 삽입 중 오류 발생:', error);
    throw error;
  }

  console.log('샘플 데이터가 성공적으로 삽입되었습니다:', data);
  return data;
}

/**
 * 2. 대구시 실데이터 기반 100건의 샘플 민원 데이터를 complaints 테이블에 벌크 삽입하는 함수
 */
export async function insertDaeguComplaints() {
  const { complaintsData } = await import('../data/complaintsData');
  
  // 기존 데이터 중복 삽입 방지를 위해 전체 갯수 체크
  const { count, error: countError } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('데이터 갯수 확인 중 오류 발생:', countError);
    throw countError;
  }

  // 이미 100건 이상의 데이터가 있으면 삽입하지 않음
  if (count && count >= 100) {
    console.log(`이미 ${count}개의 민원 데이터가 데이터베이스에 존재하여 초기화를 건너뜁니다.`);
    return { skipped: true, count };
  }

  // 100건의 데이터를 벌크 삽입
  const { data, error } = await supabase
    .from('complaints')
    .insert(complaintsData)
    .select();

  if (error) {
    console.error('대구시 100건 데이터 삽입 중 오류 발생:', error);
    throw error;
  }

  console.log('대구시 100건 데이터가 성공적으로 삽입되었습니다:', data.length);
  return { success: true, count: data.length };
}

/**
 * 2. 민원 내용에서 키워드를 받아 complaints 테이블의 content를 LIKE 검색하여 유사 민원 3개를 가져오는 함수
 * @param keyword 검색할 키워드
 */
export async function searchSimilarComplaints(keyword: string): Promise<Complaint[]> {
  if (!keyword.trim()) {
    return [];
  }

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .ilike('content', `%${keyword}%`)
    .limit(3);

  if (error) {
    console.error(`유사 민원 검색 중 오류 발생 (키워드: ${keyword}):`, error);
    throw error;
  }

  return data as Complaint[];
}
