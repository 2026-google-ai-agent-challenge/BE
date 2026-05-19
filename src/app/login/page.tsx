'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, loginAdmin } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (role === 'user') {
        const userData = await loginUser(id, password);
        localStorage.setItem('currentUser', JSON.stringify({ ...userData, role: 'user' }));
        alert('사용자 로그인 성공!');
        router.push('/recommend');
      } else {
        const adminData = await loginAdmin(id, password);
        localStorage.setItem('currentAdmin', JSON.stringify({ ...adminData, role: 'admin' }));
        alert('관리자 로그인 성공!');
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h1 style={{ textAlign: 'center', fontSize: '1.8rem', color: '#1e293b', marginBottom: '2rem' }}>
          로그인
        </h1>

        <div style={{ display: 'flex', marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
          <button
            onClick={() => setRole('user')}
            style={{
              flex: 1,
              padding: '0.8rem',
              backgroundColor: role === 'user' ? '#2563eb' : '#f8fafc',
              color: role === 'user' ? '#ffffff' : '#64748b',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            사용자 로그인
          </button>
          <button
            onClick={() => setRole('admin')}
            style={{
              flex: 1,
              padding: '0.8rem',
              backgroundColor: role === 'admin' ? '#2563eb' : '#f8fafc',
              color: role === 'admin' ? '#ffffff' : '#64748b',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            관리자 로그인
          </button>
        </div>

        {error && (
          <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
              아이디
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={role === 'user' ? '사용자 아이디 (예: user1)' : '관리자 아이디 (예: admin_road)'}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '1rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
