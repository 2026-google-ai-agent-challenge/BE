import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b',
      padding: '2rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: '#ffffff',
        padding: '3rem 2rem',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1.5rem',
          animation: 'bounce 2s infinite'
        }}>🏢</div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.025em',
          lineHeight: '1.3'
        }}>
          AI 민원 담당 부서 추천 시스템
        </h1>
        
        <p style={{
          fontSize: '1.05rem',
          color: '#64748b',
          lineHeight: 1.7,
          margin: '0 0 2.5rem 0',
          wordBreak: 'keep-all'
        }}>
          Supabase DB와 AI 알고리즘을 활용하여 접수된 민원의 내용을 분석하고, 가장 적합한 행정 부서를 자동 추천하는 프로토타입 시스템입니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/login" style={{
            display: 'inline-block',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
            cursor: 'pointer'
          }}>
            ⚡ 시작하기 (로그인)
          </Link>
          
          <Link href="/test-search" style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#2563eb',
            border: '2px solid #2563eb',
            padding: '0.9rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}>
            🔍 유사 민원 키워드 검색 테스트
          </Link>
        </div>
      </div>
    </div>
  );
}
