import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { adminAPI, studentAPI, paymentAPI, chatAPI, reportAPI } from '../services/api';
import ChatWindow from '../components/common/ChatWindow';
import { 
  UserGroupIcon, ChartBarIcon, ChatBubbleLeftRightIcon, LightBulbIcon, HeartIcon,
  AcademicCapIcon, ClipboardDocumentIcon, PaperAirplaneIcon, ExclamationTriangleIcon, MagnifyingGlassIcon,
  DocumentIcon,ClipboardDocumentListIcon, BeakerIcon, CalendarDaysIcon, ArrowTrendingUpIcon,
  HomeIcon, UsersIcon, EyeIcon, BellIcon, Cog6ToothIcon, BanknotesIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

// ==========================================
// 1. المكونات الفرعية (Sub-Components)
// ==========================================

// أ. لوحة التحكم والإحصائيات المحسنة
const DashboardStats = ({ stats, financialStats }) => (
  <div className="animate-fade-in">
    <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
      <ChartBarIcon className="w-8 h-8 text-blue-600" />
      إحصائيات النظام الشاملة
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'أولياء الأمور', value: stats.parent_count, icon: '👨‍👩‍👧‍👦', color: 'blue' },
        { label: 'المعلمون', value: stats.teacher_count, icon: '👨‍🏫', color: 'indigo' },
        { label: 'المستشارون', value: stats.counselor_count, icon: '🩺', color: 'purple' },
        { label: 'التلاميذ', value: stats.student_count, icon: '🎓', color: 'cyan' },
        { label: 'إجمالي الدخل', value: `${financialStats?.total_revenue || 0} د.ج`, icon: '💰', color: 'green' },
        { label: 'حالات عاجلة', value: stats.urgent_cases, icon: '🚨', color: 'red' },
        { label: 'رسائل غير مقروءة', value: stats.unread_messages, icon: '📩', color: 'amber' },
        { label: 'طلبات معلقة', value: stats.pending_requests, icon: '⏳', color: 'gray' },
      ].map((stat, idx) => (
        <div key={idx} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-1.5 h-full bg-${stat.color}-500 opacity-20 group-hover:opacity-100 transition-opacity`}></div>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-2xl`}>
              {stat.icon}
            </div>
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">
            {stat.value || 0}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// حـ. الإدارة المالية
const FinancialManagement = ({ payments, stats, loading, onVerify }) => {
  const getStatusInfo = (status) => {
    const s = (status || '').toLowerCase();
    
    switch(s) {
      case 'completed': 
      case 'success':
        return { label: 'تم الدفع بنجاح ✅', color: 'bg-green-100 text-green-700' };
      case 'pending_verification': 
      case 'verifying':
        return { label: 'قيد التحقق (بطاقة) ⏳', color: 'bg-amber-100 text-amber-700' };
      case 'cash_pending': 
      case 'cash':
        return { label: 'انتظار الدفع النقدي 💵', color: 'bg-blue-100 text-blue-700' };
      case 'failed': 
      case 'rejected':
        return { label: 'عملية فاشلة ❌', color: 'bg-red-100 text-red-700' };
      case 'pending': 
      case 'waiting':
        return { label: 'قيد الانتظار ⏳', color: 'bg-gray-100 text-gray-600' };
      default: 
        return { label: status || 'غير محدد', color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">الإدارة المالية</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-100 p-6 rounded-2xl">
          <div className="text-green-600 text-sm font-bold mb-1">إجمالي الدخل المؤكد</div>
          <div className="text-3xl font-black text-green-700">{stats?.total_revenue || 0} <span className="text-sm">د.ج</span></div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
          <div className="text-blue-600 text-sm font-bold mb-1">عدد المعاملات</div>
          <div className="text-3xl font-black text-blue-700">{stats?.total_transactions || 0}</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl">
          <div className="text-purple-600 text-sm font-bold mb-1">دافعون فريدون</div>
          <div className="text-3xl font-black text-purple-700">{stats?.unique_payers || 0}</div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">سجل المعاملات والتحقق</h3>
      {loading ? <p className="text-gray-500">جاري التحميل...</p> : (
        <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">ولي الأمر</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">الطالب</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">المبلغ</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">الطريقة</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length > 0 ? payments.map((p) => {
                const info = getStatusInfo(p.status);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{p.parent_name}</div>
                      {p.card_info && <div className="text-[10px] text-gray-400">صاحب البطاقة: {p.card_info.holder}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.student_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-green-600">{p.amount} د.ج</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.payment_method === 'card' ? '💳 بطاقة' : '💵 نقدي'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${info.color}`}>{info.label}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(p.status === 'pending_verification' || p.status === 'cash_pending') && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onVerify(p.id, 'completed')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm"
                          >
                            تأكيد ✅
                          </button>
                          <button 
                            onClick={() => onVerify(p.id, 'failed')}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition"
                          >
                            رفض ❌
                          </button>
                        </div>
                      )}
                      {p.status === 'completed' && <span className="text-green-500 text-xs font-bold">تم التأكيد</span>}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">لا توجد معاملات مالية مسجلة بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ب. إدارة المستخدمين
const UserManagement = ({ users, loading, newUser, setNewUser, createUser, creatingUser, roleBadgeClass, statusBadgeClass, onDeleteUser, onUpdateUser }) => {
  const [editingUser, setEditingUser] = useState(null);

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await onUpdateUser(editingUser.id, editingUser);
    setEditingUser(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">إدارة المستخدمين</h2>
      
      {/* نموذج إنشاء أو تعديل مستخدم */}
      <div className="mb-8 bg-gray-50 p-6 rounded-xl border">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {editingUser ? `تعديل المستخدم: ${editingUser.full_name}` : 'إضافة مستخدم جديد'}
        </h3>
        <form onSubmit={editingUser ? handleUpdate : createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input 
            type="email" 
            placeholder="البريد الإلكتروني" 
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
            value={editingUser ? editingUser.email : newUser.email} 
            onChange={(e) => editingUser ? setEditingUser({ ...editingUser, email: e.target.value }) : setNewUser({ ...newUser, email: e.target.value })} 
          />
          <input 
            type="text" 
            placeholder="الاسم الكامل" 
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
            value={editingUser ? editingUser.full_name : newUser.full_name} 
            onChange={(e) => editingUser ? setEditingUser({ ...editingUser, full_name: e.target.value }) : setNewUser({ ...newUser, full_name: e.target.value })} 
          />
          <input 
            type="text" 
            placeholder="الهاتف" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
            value={editingUser ? editingUser.phone || '' : newUser.phone} 
            onChange={(e) => editingUser ? setEditingUser({ ...editingUser, phone: e.target.value }) : setNewUser({ ...newUser, phone: e.target.value })} 
          />
          {!editingUser && (
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
              value={newUser.password} 
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
            />
          )}
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white" 
            value={editingUser ? editingUser.role : newUser.role} 
            onChange={(e) => editingUser ? setEditingUser({ ...editingUser, role: e.target.value }) : setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="parent">ولي أمر</option>
            <option value="teacher">معلم</option>
            <option value="counselor">مستشار</option>
            <option value="admin">إدارة</option>
          </select>
          {editingUser && (
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white" 
              value={editingUser.is_active ? 'active' : 'inactive'} 
              onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === 'active' })}
            >
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>
          )}
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={creatingUser} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              {editingUser ? 'تحديث البيانات' : (creatingUser ? 'جاري الإنشاء...' : 'إنشاء مستخدم')}
            </button>
            {editingUser && (
              <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>

      {/* جدول المستخدمين */}
      {loading ? <p className="text-gray-500">جاري التحميل...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={roleBadgeClass(user.role)}>{user.role}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={statusBadgeClass(user.is_active)}>{user.is_active ? 'نشط' : 'معطل'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900">تعديل</button>
                    <button onClick={() => onDeleteUser(user.id)} className="text-red-600 hover:text-red-900">حذف</button>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">لا يوجد مستخدمين لعرضهم</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ج. إدارة الطلاب والمجموعات
const StudentManagement = ({ 
  students, groups, teachers, parentsList, 
  newStudent, setNewStudent, handleCreateStudent,
  newGroup, setNewGroup, handleCreateGroup,
  groupTeacher, setGroupTeacher, handleAssignTeacherToGroup,
  onUpdateStudent, onDeleteStudent
}) => {
  const [editingStudent, setEditingStudent] = useState(null);

  const handleEdit = (student) => {
    // تنسيق التاريخ ليتناسب مع input type="date"
    const formattedDate = student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '';
    setEditingStudent({ ...student, date_of_birth: formattedDate });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await onUpdateStudent(editingStudent.id, editingStudent);
    setEditingStudent(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">🎓 إدارة الطلاب والربط مع الأولياء</h2>
      
      {/* إدارة المجموعات */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ... (بقية كود المجموعات يبقى كما هو) */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">➕ إنشاء Group</h3>
          <form onSubmit={handleCreateGroup} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="اسم المجموعة (مثال: 1AM-A)" required className="w-full px-4 py-2 border rounded-lg" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
            <input type="text" placeholder="class_name (اختياري)" className="w-full px-4 py-2 border rounded-lg" value={newGroup.class_name} onChange={(e) => setNewGroup({ ...newGroup, class_name: e.target.value })} />
            <input type="text" placeholder="السنة الدراسية" className="w-full px-4 py-2 border rounded-lg" value={newGroup.school_year} onChange={(e) => setNewGroup({ ...newGroup, school_year: e.target.value })} />
            <div className="sm:col-span-2">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">إنشاء Group</button>
            </div>
          </form>
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">المجموعات الحالية:</div>
            <div className="flex flex-wrap gap-2">
              {(groups || []).map((g) => (
                <span key={g.id} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{g.name}</span>
              ))}
              {(!groups || groups.length === 0) && <span className="text-sm text-gray-500">لا توجد مجموعات بعد</span>}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">👨‍🏫 ربط معلم بـ Group</h3>
          <form onSubmit={handleAssignTeacherToGroup} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة</label>
              <select required className="w-full px-4 py-2 border rounded-lg bg-white" value={groupTeacher.group_id} onChange={(e) => setGroupTeacher({ ...groupTeacher, group_id: e.target.value })}>
                <option value="">-- اختر Group --</option>
                {(groups || []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المعلم</label>
              <select required className="w-full px-4 py-2 border rounded-lg bg-white" value={groupTeacher.teacher_id} onChange={(e) => setGroupTeacher({ ...groupTeacher, teacher_id: e.target.value })}>
                <option value="">-- اختر المعلم --</option>
                {(teachers || []).map((t) => (<option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المادة (subject)</label>
              <input type="text" required className="w-full px-4 py-2 border rounded-lg" value={groupTeacher.subject} onChange={(e) => setGroupTeacher({ ...groupTeacher, subject: e.target.value })} placeholder="مثال: رياضيات" />
            </div>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">حفظ الربط</button>
          </form>
        </div>
      </div>
      
      {/* نموذج إضافة أو تعديل طالب */}
      <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-4">
          {editingStudent ? `تعديل بيانات الطالب: ${editingStudent.full_name}` : 'إضافة طالب وربطه بولي أمر'}
        </h3>
        <form onSubmit={editingStudent ? handleUpdate : handleCreateStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="اسم الطالب الكامل" 
            required 
            className="w-full px-4 py-2 border rounded-lg" 
            value={editingStudent ? editingStudent.full_name : newStudent.full_name} 
            onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, full_name: e.target.value }) : setNewStudent({ ...newStudent, full_name: e.target.value })} 
          />
          <input 
            type="date" 
            required 
            className="w-full px-4 py-2 border rounded-lg" 
            value={editingStudent ? editingStudent.date_of_birth : newStudent.date_of_birth} 
            onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, date_of_birth: e.target.value }) : setNewStudent({ ...newStudent, date_of_birth: e.target.value })} 
          />
          <select 
            className="w-full px-4 py-2 border rounded-lg bg-white" 
            value={editingStudent ? editingStudent.gender : newStudent.gender} 
            onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, gender: e.target.value }) : setNewStudent({ ...newStudent, gender: e.target.value })}
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
          <input 
            type="text" 
            placeholder="الفصل (مثال: الأولى ثانوي)" 
            required 
            className="w-full px-4 py-2 border rounded-lg" 
            value={editingStudent ? editingStudent.class_name : newStudent.class_name} 
            onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, class_name: e.target.value }) : setNewStudent({ ...newStudent, class_name: e.target.value })} 
          />
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ربط بـ Group (مهم لظهور التلميذ عند المعلم)</label>
            <select 
              className="w-full px-4 py-2 border rounded-lg bg-white" 
              value={editingStudent ? editingStudent.group_id : newStudent.group_id} 
              onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, group_id: e.target.value }) : setNewStudent({ ...newStudent, group_id: e.target.value })}
            >
              <option value="">-- اختر Group --</option>
              {(groups || []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ربط بولي الأمر (اختياري)</label>
            <select 
              className="w-full px-4 py-2 border rounded-lg bg-white" 
              value={editingStudent ? editingStudent.parent_id : newStudent.parent_id} 
              onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, parent_id: e.target.value }) : setNewStudent({ ...newStudent, parent_id: e.target.value })}
            >
              <option value="">-- اختر ولي الأمر لربط الحساب --</option>
              {parentsList.map(parent => (<option key={parent.id} value={parent.id}>{parent.full_name} ({parent.email})</option>))}
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              {editingStudent ? '💾 تحديث بيانات الطالب' : '💾 حفظ وربط الطالب'}
            </button>
            {editingStudent && (
              <button type="button" onClick={() => setEditingStudent(null)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>

      {/* جدول الطلاب الحاليين */}
      <h3 className="text-lg font-medium text-gray-800 mb-2">قائمة الطلاب المسجلين</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفصل</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الميلاد</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجنس</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.length > 0 ? students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.class_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.date_of_birth}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                  <button onClick={() => handleEdit(student)} className="text-blue-600 hover:text-blue-900">تعديل</button>
                  <button onClick={() => onDeleteStudent(student.id)} className="text-red-600 hover:text-red-900">حذف</button>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="text-center py-4 text-gray-500">لا يوجد طلاب</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// د. مراقبة الرسائل
const MessageMonitor = ({ messages, loading, onDeleteMessage, onUpdateMessage }) => {
  const [editingMessage, setEditingMessage] = useState(null);

  const handleEdit = (msg) => {
    setEditingMessage({ ...msg });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await onUpdateMessage(editingMessage.id, { content: editingMessage.content });
    setEditingMessage(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">مراقبة الرسائل</h2>
      
      {editingMessage && (
        <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 mb-4">تعديل محتوى الرسالة</h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <textarea 
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
              rows="3" 
              value={editingMessage.content} 
              onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
            />
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">تحديث الرسالة</button>
              <button type="button" onClick={() => setEditingMessage(null)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500">جاري التحميل...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرسل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستقبل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المحتوى</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.length > 0 ? messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{msg.sender_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{msg.receiver_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{msg.content}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(msg.created_at).toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    <button onClick={() => handleEdit(msg)} className="text-blue-600 hover:text-blue-900">تعديل</button>
                    <button onClick={() => onDeleteMessage(msg.id)} className="text-red-600 hover:text-red-900">حذف</button>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">لا توجد رسائل لعرضها</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// و. نظام الدردشة الشامل
const UniversalChatView = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]); // قائمة الاتصال الافتراضية
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search]);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await chatAPI.getUsersToChat('');
      setStaffList(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingContacts(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await chatAPI.getUsersToChat(search);
      setUsers(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
      <div className="flex-1 flex overflow-hidden">
        {/* قائمة المستخدمين */}
        <div className="w-80 border-l border-gray-100 flex flex-col bg-gray-50/30">
          <div className="p-6 bg-white border-b border-gray-100">
            <h3 className="font-black text-xl text-gray-800 mb-4 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
              المراسلة
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="بحث عن مستخدم بالاسم..."
                className="w-full pr-10 pl-4 py-2.5 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {search.trim() ? (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">نتائج البحث</div>
                {loading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                ) : users.length > 0 ? users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedContact(u)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                      ${selectedContact?.id === u.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 translate-x-1' : 'bg-white hover:bg-blue-50 text-gray-700 shadow-sm'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                      ${selectedContact?.id === u.id ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                      {u.full_name[0]}
                    </div>
                    <div className="text-right flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{u.full_name}</div>
                      <div className={`text-[10px] uppercase font-black opacity-70`}>{u.role}</div>
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-10 text-gray-400 text-xs italic">لا يوجد مستخدمين بهذا الاسم</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">الموظفين وأولياء الأمور</div>
                {loadingContacts ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                ) : staffList.length > 0 ? staffList.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedContact(u)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                      ${selectedContact?.id === u.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 translate-x-1' : 'bg-white hover:bg-blue-50 text-gray-700 shadow-sm border border-gray-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                      ${selectedContact?.id === u.id ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                      {u.full_name[0]}
                    </div>
                    <div className="text-right flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{u.full_name}</div>
                      <div className={`text-[10px] uppercase font-black opacity-70`}>{u.role}</div>
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-10 text-gray-400 text-xs italic">لا توجد جهات اتصال متاحة</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* نافذة الدردشة */}
        <div className="flex-1 bg-white relative">
          {selectedContact ? (
            <ChatWindow
              contactId={selectedContact.id}
              contactName={selectedContact.full_name}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">✉️</div>
              <h4 className="text-xl font-bold text-gray-600 mb-2">ابدأ محادثة جديدة</h4>
              <p className="text-sm max-w-xs">اختر أي مستخدم من القائمة الجانبية لبدء المراسلة الفورية معه بشكل خاص.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// هـ. الإشعارات
const NotificationSender = ({ notification, setNotification, sendNotification }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 mb-4">إرسال إشعارات جماعية</h2>
    <form onSubmit={sendNotification} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
        <input type="text" value={notification.title} onChange={(e) => setNotification({ ...notification, title: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
        <textarea value={notification.content} onChange={(e) => setNotification({ ...notification, content: e.target.value })} rows="4" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الفئة المستهدفة</label>
        <select value={notification.target_role} onChange={(e) => setNotification({ ...notification, target_role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white">
          <option value="">الكل</option>
          <option value="parent">أولياء الأمور</option>
          <option value="teacher">المعلمون</option>
          <option value="counselor">المستشارون</option>
        </select>
      </div>
      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow">إرسال الإشعار</button>
    </form>
  </div>
);

// و. التقارير
const ReportsList = ({ reports, loading }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 mb-4">جميع التقارير</h2>
    {loading ? <p className="text-gray-500">جاري التحميل...</p> : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التلميذ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكاتب</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.length > 0 ? reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.student_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.author_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.report_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(report.created_at).toLocaleDateString('ar-EG')}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{report.status}</span></td>
              </tr>
            )) : <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">لا توجد تقارير لعرضها</td></tr>}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ز. الإعدادات
const SettingsPanel = () => (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 mb-4">إعدادات النظام</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">اسم المدرسة</h3>
        <input type="text" defaultValue="مدرسة النور" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">تفعيل الإشعارات</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
          <span>مفعلة</span>
        </label>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">مدة الجلسة الافتراضية (دقيقة)</h3>
        <input type="number" defaultValue="30" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">الحد الأقصى للخطورة</h3>
        <input type="number" defaultValue="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
      </div>
    </div>
    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow">حفظ الإعدادات</button>
  </div>
);


// ==========================================
// 2. المكون الرئيسي (Main Component)
// ==========================================

const AdminDashboard = () => {
  const location = useLocation(); // Hook لتحديد المسار الحالي
  
  // --- States ---
  const [stats, setStats] = useState({});
  const [financialStats, setFinancialStats] = useState({});
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState({ title: '', content: '', target_role: '' });
  
  // New User State
  const [newUser, setNewUser] = useState({ email: '', full_name: '', phone: '', password: '', role: 'parent' });
  const [creatingUser, setCreatingUser] = useState(false);

  // Student Management States
  const [students, setStudents] = useState([]);
  const [parentsList, setParentsList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [newStudent, setNewStudent] = useState({ full_name: '', date_of_birth: '', gender: 'male', class_name: '', school_year: '2024/2025', parent_id: '', group_id: '' });
  const [newGroup, setNewGroup] = useState({ name: '', class_name: '', school_year: '2024/2025' });
  const [groupTeacher, setGroupTeacher] = useState({ group_id: '', teacher_id: '', subject: '' });

  // --- Effects ---
  
  // تحميل الإحصائيات الأولية عند فتح الصفحة
  useEffect(() => {
    loadDashboard();
    loadFinancialStats();
  }, []);

  // تحميل البيانات الخاصة بالقسم الحالي عند تغيير الرابط
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const path = location.pathname;
        if (path.includes('/admin/users')) await loadUsers();
        else if (path.includes('/admin/monitor')) await loadMessages();
        else if (path.includes('/admin/reports')) await loadReports();
        else if (path.includes('/admin/students')) await loadStudentsAndParents();
        else if (path.includes('/admin/finance')) await loadPayments();
        // dashboard, notifications, settings لا تحتاج تحميل بيانات ثقيلة عادة
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.pathname]); 

  // --- API Handlers ---

  const loadDashboard = async () => {
    try {
      const { data } = await adminAPI.getDashboard();
      setStats(data.data || {});
    } catch (err) { console.error('Failed to load dashboard stats', err); }
  };

  const loadFinancialStats = async () => {
    try {
      const { data } = await paymentAPI.getStats();
      setFinancialStats(data.data || {});
    } catch (err) { console.error('Failed to load financial stats', err); }
  };

  const loadPayments = async () => {
    try {
      const { data } = await paymentAPI.getAll();
      setPayments(Array.isArray(data.data) ? data.data : []);
    } catch (err) { console.error('Failed to load payments', err); setPayments([]); }
  };

  const handleVerifyPayment = async (id, status) => {
    try {
      await paymentAPI.verify(id, status);
      alert(status === 'completed' ? '✅ تم تأكيد الدفع بنجاح' : '❌ تم رفض العملية');
      loadPayments();
      loadFinancialStats();
    } catch (err) {
      console.error(err);
      alert('❌ خطأ في تحديث الحالة');
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) { console.error('Failed to load users', err); setUsers([]); }
  };

  const loadMessages = async () => {
    try {
      const { data } = await adminAPI.monitorMessages();
      setMessages(Array.isArray(data.data) ? data.data : []);
    } catch (err) { console.error('Failed to load messages', err); setMessages([]); }
  };

  const loadReports = async () => {
    try {
      const { data } = await reportAPI.getAll();
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch (err) { console.error('Failed to load reports', err); setReports([]); }
  };

  const loadStudentsAndParents = async () => {
    try {
      const [studentsRes, parentsRes, groupsRes, teachersRes] = await Promise.all([
        studentAPI.getAllStudents(),
        studentAPI.getParentsList(),
        adminAPI.getGroups(),
        adminAPI.getTeachers(),
      ]);
      setStudents(studentsRes.data.data || []);
      setParentsList(parentsRes.data.data || []);
      setGroups(groupsRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
    } catch (err) { console.error(err); }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.sendNotification(notification);
      setNotification({ title: '', content: '', target_role: '' });
      alert('تم إرسال الإشعار بنجاح');
    } catch (err) { alert('خطأ في الإرسال'); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await adminAPI.createUser(newUser);
      setNewUser({ email: '', full_name: '', phone: '', password: '', role: 'parent' });
      await loadUsers();
      alert('تم إنشاء المستخدم بنجاح');
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert('فشل إنشاء المستخدم');
    } finally { setCreatingUser(false); }
  };

  const handleUpdateUser = async (id, data) => {
    try {
      await adminAPI.updateUser(id, data);
      alert('✅ تم تحديث بيانات المستخدم');
      loadUsers();
    } catch (err) { alert('❌ فشل تحديث المستخدم'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    try {
      await adminAPI.deleteUser(id);
      alert('✅ تم حذف المستخدم');
      loadUsers();
    } catch (err) { alert('❌ فشل حذف المستخدم'); }
  };

  const handleUpdateMessage = async (id, data) => {
    try {
      await adminAPI.updateMessage(id, data);
      alert('✅ تم تعديل الرسالة');
      loadMessages();
    } catch (err) { alert('❌ فشل تعديل الرسالة'); }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await adminAPI.deleteMessage(id);
      alert('✅ تم حذف الرسالة');
      loadMessages();
    } catch (err) { alert('❌ فشل حذف الرسالة'); }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await studentAPI.createWithParent(newStudent);
      alert('✅ تم إضافة الطالب وربطه بنجاح');
      setNewStudent({ full_name: '', date_of_birth: '', gender: 'male', class_name: '', school_year: '2024/2025', parent_id: '', group_id: '' });
      loadStudentsAndParents();
    } catch (err) { alert('❌ فشل إضافة الطالب'); }
  };

  const handleUpdateStudent = async (id, data) => {
    try {
      await studentAPI.update(id, data);
      alert('✅ تم تحديث بيانات التلميذ');
      loadStudentsAndParents();
    } catch (err) { alert('❌ فشل تحديث بيانات التلميذ'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التلميذ؟')) return;
    try {
      await studentAPI.delete(id);
      alert('✅ تم حذف التلميذ');
      loadStudentsAndParents();
    } catch (err) { alert('❌ فشل حذف التلميذ'); }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createGroup(newGroup);
      alert('✅ تم إنشاء المجموعة');
      setNewGroup({ name: '', class_name: '', school_year: '2024/2025' });
      await loadStudentsAndParents();
    } catch (err) { console.error(err?.response?.data || err); alert('❌ فشل إنشاء المجموعة'); }
  };

  const handleAssignTeacherToGroup = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.assignGroupTeacher(groupTeacher.group_id, { teacher_id: groupTeacher.teacher_id, subject: groupTeacher.subject });
      alert('✅ تم ربط المعلم بالمجموعة');
      setGroupTeacher({ group_id: '', teacher_id: '', subject: '' });
    } catch (err) { console.error(err?.response?.data || err); alert('❌ فشل ربط المعلم'); }
  };

  // --- Helper Functions for Styling ---
  const roleBadgeClass = (role) => {
    const base = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (role) {
      case 'parent': return `${base} bg-green-100 text-green-700`;
      case 'teacher': return `${base} bg-blue-100 text-blue-700`;
      case 'counselor': return `${base} bg-purple-100 text-purple-700`;
      case 'admin': return `${base} bg-red-100 text-red-700`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  };

  const statusBadgeClass = (isActive) => {
    const base = 'px-2 py-1 rounded-full text-xs font-medium';
    return isActive ? `${base} bg-green-100 text-green-700` : `${base} bg-gray-100 text-gray-500`;
  };

  // --- Render Logic based on Route ---
  const renderContent = () => {
    const path = location.pathname;
    
    if (path.includes('/admin/users')) {
      return <UserManagement 
        users={users} loading={loading} 
        newUser={newUser} setNewUser={setNewUser} 
        createUser={createUser} creatingUser={creatingUser}
        roleBadgeClass={roleBadgeClass} statusBadgeClass={statusBadgeClass} 
        onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser}
      />;
    }
    
    if (path.includes('/admin/students')) {
      return <StudentManagement 
        students={students} groups={groups} teachers={teachers} parentsList={parentsList}
        newStudent={newStudent} setNewStudent={setNewStudent} handleCreateStudent={handleCreateStudent}
        newGroup={newGroup} setNewGroup={setNewGroup} handleCreateGroup={handleCreateGroup}
        groupTeacher={groupTeacher} setGroupTeacher={setGroupTeacher} handleAssignTeacherToGroup={handleAssignTeacherToGroup}
        onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent}
      />;
    }

    if (path.includes('/admin/monitor')) {
      return <MessageMonitor 
        messages={messages} loading={loading} 
        onUpdateMessage={handleUpdateMessage} onDeleteMessage={handleDeleteMessage}
      />;
    }

    if (path.includes('/admin/notifications')) {
      return <NotificationSender notification={notification} setNotification={setNotification} sendNotification={sendNotification} />;
    }

    if (path.includes('/admin/reports')) {
      return <ReportsList reports={reports} loading={loading} />;
    }

    if (path.includes('/admin/settings')) {
      return <SettingsPanel />;
    }

    if (path.includes('/admin/finance')) {
      return <FinancialManagement payments={payments} stats={financialStats} loading={loading} onVerify={handleVerifyPayment} />;
    }

    if (path.includes('/admin/chat')) {
      return <UniversalChatView />;
    }

    // Default: Dashboard Stats
    return <DashboardStats stats={stats} financialStats={financialStats} />;
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">لوحة الإدارة</h1>
      <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;