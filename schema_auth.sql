-- 1. 사용자(users) 테이블 생성
-- 민원 신청자 정보를 담습니다. (실제 서비스에서는 보안을 위해 비밀번호 해싱을 권장합니다)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL
);

-- 2. 관리자(admins) 테이블 생성
-- 각 부서의 관리자 정보를 담습니다.
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    department TEXT NOT NULL -- 관리자가 소속된 부서명 (예: '도로과', '자원순환과' 등)
);

-- 3. 테스트용 더미 데이터 삽입
-- 초기 테스트를 위해 미리 생성해 두는 테스트용 계정들입니다.
INSERT INTO users (id, password) 
VALUES ('user1', '1234')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admins (id, password, department) 
VALUES 
  ('admin_road', '1234', '도로과'),
  ('admin_env', '1234', '기후환경정책과'),
  ('admin_traffic', '1234', '교통정책과'),
  ('admin_water', '1234', '물환경과')
ON CONFLICT (id) DO NOTHING;
