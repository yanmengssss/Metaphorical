import Link from 'next/link';
import { LayoutDashboard, FileText } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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
      </div>
    </nav>
  );
}
