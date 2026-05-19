'use client';

import { useState } from 'react';
import { searchSimilarComplaints } from '../../lib/searchSimilarComplaints';
import { Complaint } from '../../lib/complaints';

export default function RecommendPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [results, setResults] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error(err);
      setError(err.message || '데이터베이스 조회 중 오류가 발생했습니다.');
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
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
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

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                  color: '#ffffff',
                  padding: '1rem',
                  borderRadius: '10px',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
              >
                {isLoading ? '유사 민원 탐색 중...' : '⚡ 담당 부서 추천받기'}
              </button>
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
