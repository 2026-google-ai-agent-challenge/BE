'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Complaint } from '../../lib/complaints';

export default function AdminPage() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [activeTab, setActiveTab] = useState<'대기중' | '처리중' | '처리완료'>('대기중');

  // 대표적인 타 부서 목록 (예시)
  const departments = ['도로과', '공원녹지과', '교통정책과', '자원순환과', '건축과', '복지정책과', '기후환경정책과', '물환경과', '소통민원과', '안전정책과', '버스운영과'];

  useEffect(() => {
    const data = localStorage.getItem('currentAdmin');
    if (!data) {
      alert('관리자 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    const admin = JSON.parse(data);
    setAdminData(admin);
    fetchComplaints(admin.department);
  }, [router]);

  const fetchComplaints = async (department: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('actual_department', department)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('민원 목록을 불러오는 중 오류 발생:', error);
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  const handleTransfer = async (complaintId: string) => {
    if (!newDepartment) {
      alert('이첩할 부서를 선택해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('complaints')
        .update({ actual_department: newDepartment })
        .eq('id', complaintId);

      if (error) throw error;
      
      alert('성공적으로 재이첩되었습니다.');
      setEditingId(null);
      setNewDepartment('');
      // 목록 다시 불러오기
      fetchComplaints(adminData.department);
    } catch (error) {
      console.error('재이첩 중 오류 발생:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === '처리완료') {
        updateData.solved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);

      if (error) throw error;
      
      alert(`상태가 '${newStatus}'(으)로 변경되었습니다.`);
      fetchComplaints(adminData.department);
    } catch (error) {
      console.error('상태 변경 중 오류 발생:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentAdmin');
    router.push('/login');
  };

  if (loading || !adminData) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: '2.5rem', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: '-apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>⚙️ 관리자 대시보드</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
            환영합니다, <strong>{adminData.id}</strong>님. 현재 <strong>[{adminData.department}]</strong>에 배정된 민원 목록입니다.
          </p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ padding: '0.8rem 1.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          로그아웃
        </button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['대기중', '처리중', '처리완료'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: activeTab === tab ? '#0f172a' : '#fff',
              color: activeTab === tab ? '#fff' : '#64748b',
              border: activeTab === tab ? 'none' : '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab} 민원
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {complaints.filter(c => (c.status || '대기중') === activeTab).length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
            해당 상태의 민원이 없습니다.
          </div>
        ) : (
          complaints.filter(c => (c.status || '대기중') === activeTab).map(complaint => (
            <div key={complaint.id} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.8rem 0', color: '#0f172a', fontSize: '1.2rem' }}>{complaint.title}</h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#475569', lineHeight: 1.6 }}>{complaint.content}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      현재 상태: <strong style={{ color: complaint.status === '처리완료' ? '#10b981' : complaint.status === '처리중' ? '#3b82f6' : '#ef4444' }}>{complaint.status || '대기중'}</strong>
                    </span>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      부서: <strong>{complaint.actual_department}</strong>
                    </span>
                    {complaint.created_at && (
                      <span style={{ padding: '0.3rem 0' }}>접수일시: {new Date(complaint.created_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                
                <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                  {activeTab !== '처리완료' && (
                    <button 
                      onClick={() => handleStatusChange(complaint.id!, activeTab === '대기중' ? '처리중' : '처리완료')}
                      style={{ padding: '0.8rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      {activeTab === '대기중' ? '▶️ 처리 시작하기' : '✅ 처리 완료하기'}
                    </button>
                  )}

                  {editingId === complaint.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <select 
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">이첩할 부서 선택</option>
                        {departments.filter(d => d !== complaint.actual_department).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleTransfer(complaint.id!)}
                          style={{ flex: 1, padding: '0.6rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          확인
                        </button>
                        <button 
                          onClick={() => { setEditingId(null); setNewDepartment(''); }}
                          style={{ flex: 1, padding: '0.6rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditingId(complaint.id || null)}
                      style={{ padding: '0.8rem', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                      🔄 타 부서로 재이첩
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
