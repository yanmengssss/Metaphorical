'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { logout } from '@/lib/auth-client';
import { LayoutDashboard, FileText } from 'lucide-react';

export default function Navbar() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  async function handleLogout() {
    if (pending.current) return;
    pending.current = true;
    setLoggingOut(true);
    setError('');
    try {
      await logout();
    } catch {
      pending.current = false;
      setLoggingOut(false);
      setError('退出登录失败，请稍后重试。');
    }
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="flex h-16 w-full items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            Metaphorical 日志
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              仪表盘
            </Link>
            <Link href="/logs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
              <FileText className="w-4 h-4" />
              全局日志
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            {loggingOut ? '退出中…' : '退出登录'}
          </button>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </nav>
  );
}
