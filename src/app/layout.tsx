import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 민원 부서 추천 시스템',
  description: 'Supabase와 AI를 활용한 민원 담당 부서 추천 프로토타입',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
