import { searchSimilarComplaints } from '../../lib/searchSimilarComplaints';
import { Complaint } from '../../lib/complaints';

export const revalidate = 0; // 페이지 캐시를 하지 않고 항상 최신 데이터를 가져옴

export default async function TestSearchPage() {
  const keywords = ['차량', '불법주정차', '단속'];
  let results: Complaint[] = [];
  let errorMsg = null;

  try {
    results = await searchSimilarComplaints(keywords);
  } catch (err: any) {
    errorMsg = err.message || JSON.stringify(err);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '0.5rem' }}>
        🔍 유사 민원 검색 테스트 페이지
      </h1>
      
      <div style={{ backgroundColor: '#f0f4f8', padding: '1rem', borderRadius: '8px', margin: '1.5rem 0' }}>
        <p style={{ margin: 0 }}><strong>테스트 검색 키워드:</strong></p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {keywords.map((kw) => (
            <span key={kw} style={{ backgroundColor: '#0070f3', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>
              #{kw}
            </span>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef5350', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ 에러가 발생했습니다</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{errorMsg}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#555' }}>
            Supabase 테이블이 존재하지 않거나, 환경 변수(.env.local)가 올바르지 않을 수 있습니다.
          </p>
        </div>
      )}

      <h2>검색 결과 ({results.length}건)</h2>
      
      {results.length === 0 ? (
        <div style={{ border: '1px dashed #ccc', padding: '2rem', textAlign: 'center', color: '#666', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}>검색된 유사 민원이 없습니다.</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
            Supabase DB에 샘플 데이터가 등록되어 있는지 확인해주세요.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((complaint, index) => (
            <div key={complaint.id || index} style={{ border: '1px solid #e0e0e0', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 0.8rem 0', color: '#333' }}>{complaint.title}</h3>
              <p style={{ margin: '0 0 0.8rem 0', color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                <strong>내용:</strong> {complaint.content}
              </p>
              <div style={{ display: 'inline-block', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                실제 담당 부서: {complaint.actual_department}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
