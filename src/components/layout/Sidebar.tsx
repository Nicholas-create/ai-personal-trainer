'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/history', label: 'History', icon: '📅' },
  { href: '/coach', label: 'AI Coach', icon: '💬' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          AI<span className="text-blue-400">Trainer</span>
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 text-lg transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
