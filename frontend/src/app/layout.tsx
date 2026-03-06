import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Idea Create Everything - AI项目规划助手',
  description: '将你的想法转化为详细的项目规划，从想法到落地的完美实现',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
