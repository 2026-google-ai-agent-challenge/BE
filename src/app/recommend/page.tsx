'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchSimilarComplaints } from '../../lib/searchSimilarComplaints';
import { Complaint, submitUserComplaint } from '../../lib/complaints';

export default function RecommendPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [results, setResults] = useState<Complaint[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('currentUser');
    if (!data) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(data));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  // 데이터베이스 초기화(Seed) 상태 관리
  const [seedStatus, setSeedStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedStatus('seeding');
    setSeedMessage(null);
    try {
      const { insertDaeguComplaints } = await import('../../lib/complaints');
      const res = await insertDaeguComplaints();
      if (res.skipped) {
        setSeedStatus('success');
        setSeedMessage(`이미 데이터베이스에 ${res.count}건의 샘플 데이터가 등록되어 있어 초기화를 건너뛰었습니다.`);
      } else {
        setSeedStatus('success');
        setSeedMessage(`대구시 실데이터 기반 100건의 샘플 민원이 성공적으로 등록되었습니다!`);
      }
    } catch (err: any) {
      console.error(err);
      setSeedStatus('error');
      setSeedMessage(err.message || '데이터베이스 초기화 중 에러가 발생했습니다. .env.local 설정 및 테이블 존재 여부를 확인해주세요.');
    }
  };

  // 한국어 조사 등을 간단히 제거하며 키워드를 추출하는 헬퍼 함수
  const extractKeywords = (text: string): string[] => {
    if (!text.trim()) return [];
    
    // 한글, 영문, 숫자 단어 단위 분리
    const rawWords = text.match(/[a-zA-Z0-9가-힣]+/g) || [];
    
    // 불필요한 조사 및 일반 동사 단어 (Stopwords)
    const stopWords = new Set([
      '은', '는', '이', '가', '을', '를', '에', '의', '로', '으로', '에서', '과', '와', '도', '으로',
      '합니다', '했습니다', '합니다만', '했다', '한다', '있습니다', '있다', '없다', '요청', '신고', '민원',
      '부탁', '드립니다', '바랍니다', '때문에', '너무', '많이', '정말', '진짜', '매우', '조속히', '빠른'
    ]);
    
    const words = rawWords
      .map(w => w.trim())
      .filter(w => w.length >= 2) // 2글자 이상만 필터링
      .map(w => {
        // 단어 끝의 기본 조사(은/는/이/가/을/를/에/의/로/와/과/도) 제거 시도
        let cleaned = w;
        const particles = ['가', '이', '을', '를', '은', '는', '에', '의', '로', '와', '과', '도'];
        for (const p of particles) {
          if (cleaned.endsWith(p) && cleaned.length > p.length) {
            cleaned = cleaned.slice(0, -p.length);
            break;
          }
        }
        return cleaned;
      })
      .filter(w => w.length >= 2 && !stopWords.has(w));

    // 중복 제거 후 빈도가 높은 순서 또는 선입선출 기준으로 최대 5개 추출
    return Array.from(new Set(words)).slice(0, 5);
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('민원 내용을 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. 키워드 추출
    const extracted = extractKeywords(content);
    setKeywords(extracted);

    try {
      // 2. 키워드가 없는 경우 빈 결과 반환
      if (extracted.length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // 3. 유사 민원 검색 함수 실행
      const searchResults = await searchSimilarComplaints(extracted);
      setResults(searchResults);
      
      if (searchResults.length > 0) {
        setSelectedDept(searchResults[0].actual_department);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || '데이터베이스 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!content.trim()) {
      alert('민원 내용을 입력해주세요!');
      return;
    }
    if (!currentUser || !currentUser.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 추천 결과가 있으면 첫 번째 부서를, 없으면 미배정
    const recommendedDept = selectedDept || (results.length > 0 ? results[0].actual_department : '미배정');
    setIsLoading(true);
    try {
      await submitUserComplaint(currentUser.id, title, content, recommendedDept);
      alert('민원이 성공적으로 등록되었습니다.');
      // 폼 초기화 (선택 사항)
      setTitle('');
      setContent('');
      setResults([]);
      setKeywords([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '민원 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b',
      padding: '2.5rem 1rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* 상단 헤더 */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          marginBottom: '2.5rem'
        }}>
          {currentUser && (
            <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                <strong>{currentUser.id}</strong>님 환영합니다
              </span>
              <button 
                onClick={() => router.push('/my-complaints')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.1)'
                }}
              >
                📋 나의 민원 목록
              </button>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                로그아웃
              </button>
            </div>
          )}
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            🏢 AI 민원 담당 부서 추천
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: '#64748b',
            margin: 0
          }}>
            접수된 민원의 내용을 분석하여 최적의 유사 민원과 담당 부서를 매칭해 드립니다.
          </p>
        </header>

        {/* 데이터베이스 초기화 및 관리 바 */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.2rem 1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🗄️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                대구시 실데이터 기반 민원 데이터셋 (100건)
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Supabase DB를 100개의 현실적인 민원 데이터로 초기화하여 검색 품질을 획기적으로 개선합니다.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSeed}
            disabled={seedStatus === 'seeding'}
            style={{
              backgroundColor: seedStatus === 'seeding' ? '#93c5fd' : '#0f172a',
              color: '#ffffff',
              padding: '0.7rem 1.2rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              border: 'none',
              cursor: seedStatus === 'seeding' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              if (seedStatus !== 'seeding') e.currentTarget.style.backgroundColor = '#1e293b';
            }}
            onMouseLeave={(e) => {
              if (seedStatus !== 'seeding') e.currentTarget.style.backgroundColor = '#0f172a';
            }}
          >
            {seedStatus === 'seeding' ? '⏳ 데이터 삽입 중...' : '⚡ 대구시 민원 100건 DB 삽입'}
          </button>

          {seedMessage && (
            <div style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              backgroundColor: seedStatus === 'success' ? '#ecfdf5' : seedStatus === 'error' ? '#fef2f2' : '#eff6ff',
              color: seedStatus === 'success' ? '#047857' : seedStatus === 'error' ? '#991b1b' : '#1e40af',
              border: `1px solid ${seedStatus === 'success' ? '#a7f3d0' : seedStatus === 'error' ? '#fca5a5' : '#bfdbfe'}`
            }}>
              {seedStatus === 'success' ? '✅ ' : seedStatus === 'error' ? '⚠️ ' : 'ℹ️ '}
              {seedMessage}
            </div>
          )}
        </div>

        {/* 메인 레이아웃 (그리드) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          
          {/* 1. 입력 영역 카드 */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
          }}>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#334155',
              marginTop: 0,
              marginBottom: '1.5rem',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '0.8rem'
            }}>
              📥 신규 민원 등록
            </h2>
            
            <form onSubmit={handleRecommend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label htmlFor="title" style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  민원 제목
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="예: 공원 벤치 파손 보수 요청"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label htmlFor="content" style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  민원 내용 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="content"
                  rows={8}
                  placeholder="추천을 위해 자세한 민원 내용을 입력해주세요. (예: 공원 벤치 목재가 부러져 차량 및 행인의 안전을 방해하고 가로등 불빛이 안 닿아 위험합니다.)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.6',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label htmlFor="department" style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  신청 부서 선택 (직접 선택 혹은 추천 후 자동배정)
                </label>
                <select
                  id="department"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                >
                  <option value="">부서를 선택해주세요 (미선택 시 미배정)</option>
                  <option value="자원순환과">자원순환과</option>
                  <option value="건축과">건축과</option>
                  <option value="버스운영과">버스운영과</option>
                  <option value="도로과">도로과</option>
                  <option value="복지정책과">복지정책과</option>
                  <option value="기후환경정책과">기후환경정책과</option>
                  <option value="교통정책과">교통정책과</option>
                  <option value="소통민원과">소통민원과</option>
                  <option value="물환경과">물환경과</option>
                  <option value="안전정책과">안전정책과</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                    color: '#ffffff',
                    padding: '1rem',
                    borderRadius: '10px',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isLoading ? '분석 중...' : '🔍 유사 민원 및 부서 추천받기'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitComplaint}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: isLoading ? '#64748b' : '#0f172a',
                    color: '#ffffff',
                    padding: '1rem',
                    borderRadius: '10px',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isLoading ? '처리 중...' : '📝 이 내용으로 민원 신청하기'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. 결과 영역 카드 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            
            {/* 키워드 디스플레이 */}
            {keywords.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#475569',
                  margin: '0 0 0.8rem 0'
                }}>
                  🏷️ 민원 분석 키워드
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {keywords.map((kw, idx) => (
                    <span key={idx} style={{
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '1px solid #bfdbfe'
                    }}>
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 유사 민원 결과 목록 */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#334155',
                marginTop: 0,
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.8rem'
              }}>
                🔍 매칭된 유사 민원 (최대 3개)
              </h2>

              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #fca5a5',
                  fontSize: '0.9rem',
                  marginBottom: '1rem'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {isLoading ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1,
                  color: '#64748b',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #cbd5e1',
                    borderTop: '4px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>데이터베이스에서 유사 민원 분석 중...</p>
                </div>
              ) : results.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1,
                  color: '#94a3b8',
                  padding: '3rem 1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#64748b' }}>유사 민원이 아직 없습니다.</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>왼쪽 폼에 민원 내용을 입력하고 추천 버튼을 눌러주세요.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {results.map((comp, idx) => (
                    <div key={comp.id || idx} style={{
                      border: '1px solid #f1f5f9',
                      backgroundColor: '#fafbfc',
                      padding: '1.2rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        gap: '1rem',
                        marginBottom: '0.8rem'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#1e293b',
                          lineHeight: '1.4'
                        }}>
                          {comp.title}
                        </h4>
                        <span style={{
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          border: '1px solid #a7f3d0'
                        }}>
                          {comp.actual_department}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: '#475569',
                        lineHeight: '1.6',
                        wordBreak: 'keep-all'
                      }}>
                        {comp.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
      
      {/* 로딩 스피너 애니메이션용 style 태그 */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
