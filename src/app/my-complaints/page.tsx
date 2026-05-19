'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Complaint } from '../../lib/complaints';
import Link from 'next/link';

export default function MyComplaintsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'대기중' | '처리중' | '처리완료'>('대기중');

  useEffect(() => {
    const data = localStorage.getItem('currentUser');
    if (!data) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    const user = JSON.parse(data);
    setCurrentUser(user);
    fetchMyComplaints(user.id);
  }, [router]);

  const fetchMyComplaints = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('민원 목록 조회 오류:', error);
      alert('목록을 불러오는 데 실패했습니다.');
    } else {
      setMyComplaints(data || []);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const handleDelete = async (complaintId: string) => {
    if (!confirm('정말로 이 민원을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);
        
      if (error) throw error;
      
      alert('민원이 성공적으로 삭제되었습니다.');
      // 목록 새로고침
      fetchMyComplaints(currentUser.id);
    } catch (error) {
      console.error('민원 삭제 오류:', error);
      alert('민원 삭제 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status?: string) => {
    const currentStatus = status || '대기중';
    let bgColor = '#f3f4f6';
    let textColor = '#4b5563';

    if (currentStatus === '대기중') {
      bgColor = '#fef3c7';
      textColor = '#d97706';
    } else if (currentStatus === '처리중') {
      bgColor = '#dbeafe';
      textColor = '#2563eb';
    } else {
      bgColor = '#d1fae5';
      textColor = '#059669';
    }

    return (
      <span style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        fontWeight: 700,
        fontSize: '0.9rem',
        display: 'inline-block',
        minWidth: '70px',
        textAlign: 'center'
      }}>
        {currentStatus}
      </span>
    );
  };

  if (loading || !currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, sans-serif' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        backgroundColor: '#fff', 
        padding: '1.5rem 2rem', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b', fontWeight: 800 }}>👤 나의 민원 내역</h1>
          <Link href="/recommend" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
            ← 새 민원 신청하기
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.95rem' }}><strong>{currentUser.id}</strong>님 환영합니다</span>
          <button 
            onClick={handleLogout}
            style={{ padding: '0.6rem 1.2rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', maxWidth: '1000px', margin: '0 auto 2rem auto' }}>
        {(['대기중', '처리중', '처리완료'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: activeTab === tab ? '#0f172a' : '#fff',
              color: activeTab === tab ? '#fff' : '#64748b',
              border: activeTab === tab ? 'none' : '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {myComplaints.filter(c => (c.status || '대기중') === activeTab).length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', color: '#94a3b8', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>해당 상태의 민원이 없습니다.</p>
          </div>
        ) : (
          myComplaints
            .filter(c => (c.status || '대기중') === activeTab)
            .map(complaint => (
            <div key={complaint.id} style={{ 
              backgroundColor: '#fff', 
              padding: '2rem', 
              borderRadius: '16px', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '2rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', fontWeight: 700 }}>{complaint.title}</h3>
                  <span style={{ backgroundColor: '#f8fafc', color: '#64748b', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                    {complaint.actual_department}
                  </span>
                </div>
                
                <p style={{ margin: '0 0 1.2rem 0', color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {complaint.content}
                </p>
                
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  접수일시: {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : '날짜 정보 없음'}
                </div>
                {complaint.solved_at && complaint.status === '처리완료' && (
                  <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.3rem', fontWeight: 600 }}>
                    처리완료일시: {new Date(complaint.solved_at).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: '100px', gap: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>처리 상태</span>
                  {getStatusBadge(complaint.status)}
                </div>
                
                {(complaint.status || '대기중') === '대기중' && (
                  <button
                    onClick={() => handleDelete(complaint.id!)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#fee2e2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      marginTop: '0.5rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fca5a5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  >
                    🗑️ 삭제하기
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
