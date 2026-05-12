import React, { useContext, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

// استيراد الأيقونات الرسمية لـ Tailwind
import {
  UserGroupIcon, ChartBarIcon, ChatBubbleLeftRightIcon, LightBulbIcon, HeartIcon,
  AcademicCapIcon, ClipboardDocumentIcon, PaperAirplaneIcon, ExclamationTriangleIcon, MagnifyingGlassIcon,
  DocumentIcon,ClipboardDocumentListIcon, BeakerIcon, CalendarDaysIcon, ArrowTrendingUpIcon,
  HomeIcon, UsersIcon, EyeIcon, BellIcon,DocumentTextIcon
    , Cog6ToothIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
const roleNames = {
  parent: 'ولي الأمر',
  teacher: 'المعلم',
  counselor: 'المستشار',
  admin: 'الإدارة',
};

const menuItems = {
  parent: [
    { label: 'أبنائي', path: '/parent/children', icon: UserGroupIcon },
    { label: 'طلبات الجلسات', path: '/parent/sessions', icon: CalendarDaysIcon },
    { label: 'التقارير', path: '/parent/reports', icon: ChartBarIcon },
    { label: 'الدردشة', path: '/parent/chat', icon: ChatBubbleLeftRightIcon },
    { label: 'المدفوعات', path: '/parent/payments', icon: BanknotesIcon },
    { label: 'نصائح وإرشادات', path: '/parent/advices', icon: LightBulbIcon },
    { label: 'الحالة النفسية', path: '/parent/status', icon: HeartIcon },
  ],
  teacher: [
    { label: 'التلاميذ', path: '/teacher/students', icon: AcademicCapIcon },
    { label: 'ملاحظات سلوكية', path: '/teacher/notes', icon: ClipboardDocumentIcon },
    { label: 'إرسال تقارير', path: '/teacher/reports', icon: PaperAirplaneIcon },
    { label: 'طلب تدخل', path: '/teacher/request-intervention', icon: ExclamationTriangleIcon },
    { label: 'الدردشة', path: '/teacher/chat', icon: ChatBubbleLeftRightIcon },
    { label: 'توجيهات المستشار', path: '/teacher/advices', icon: LightBulbIcon },
    { label: 'متابعة', path: '/teacher/follow-up', icon: MagnifyingGlassIcon },
  ],
  counselor: [
    { label: 'الحالات النفسية', path: '/counselor/cases', icon: DocumentIcon },
    { label: 'ملاحظات المعلمين', path: '/counselor/teacher-notes', icon: ClipboardDocumentListIcon },
    { label: 'تقارير المعلمين', path: '/counselor/teacher-reports', icon: DocumentTextIcon },
    { label: 'طلبات الجلسات', path: '/counselor/sessions', icon: CalendarDaysIcon },
    { label: 'الدردشة', path: '/counselor/chat', icon: ChatBubbleLeftRightIcon },
    { label: 'نصائح وتوصيات', path: '/counselor/advices', icon: LightBulbIcon },
    { label: 'متابعة التقدم', path: '/counselor/progress', icon: ArrowTrendingUpIcon },
  ],
  admin: [
    { label: 'لوحة التحكم', path: '/admin/dashboard', icon: HomeIcon },
    { label: 'المستخدمين', path: '/admin/users', icon: UsersIcon },
    { label: 'إدارة الطلاب', path: '/admin/students', icon: AcademicCapIcon },
    { label: 'الإدارة المالية', path: '/admin/finance', icon: BanknotesIcon },
    { label: 'الدردشة', path: '/admin/chat', icon: ChatBubbleLeftRightIcon },
    { label: 'مراقبة الرسائل', path: '/admin/monitor', icon: EyeIcon },
    { label: 'إشعارات جماعية', path: '/admin/notifications', icon: BellIcon },
    { label: 'التقارير', path: '/admin/reports', icon: ChartBarIcon },
  ],
};

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const items = useMemo(() => menuItems[user?.role] || [], [user?.role]);

  return (
    <aside
      dir="rtl"
      className={`bg-white shadow-xl border-l transition-all duration-300 flex flex-col shrink-0 z-40
        ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Brand Section */}
      <div className={`p-6 flex items-center gap-3 border-b bg-gradient-to-br from-blue-600 to-indigo-700 text-white
        ${collapsed ? 'justify-center' : ''}`}>

<div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300">
  <AcademicCapIcon className="w-6 h-6 text-white" />
</div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight">نفسيتي</span>
            <span className="text-[10px] opacity-80 uppercase tracking-wider">نظام المتابعة النفسية</span>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className={`p-4 border-b bg-gray-50/50 ${collapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3'}`}>
        <div className="relative">
<div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white shadow-sm">
  <ShieldCheckIcon className="w-6 h-6 text-white" />
</div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-800 truncate">{user?.full_name}</span>
            <span className="text-[11px] text-blue-600 font-medium">{roleNames[user?.role]}</span>
          </div>
        )}
        {!collapsed && (
          <div className="mr-auto">
            <NotificationBell />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }
                    ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  {/* استبدال الإيموجي بمكون Heroicons */}
                  <item.icon 
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110`} 
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap flex-1">{item.label}</span>
                  )}
                  {!collapsed && isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t mt-auto">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors
            ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'تسجيل خروج' : ''}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
          {!collapsed && <span>تسجيل خروج</span>}
        </button>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`mt-4 flex items-center justify-center h-10 w-full rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors group
            ${collapsed ? '' : 'px-4'}`}
        >
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform duration-500 ${
              collapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;