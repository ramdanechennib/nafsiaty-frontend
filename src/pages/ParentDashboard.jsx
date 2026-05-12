import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { studentAPI, reportAPI, caseAPI, adviceAPI, chatAPI, paymentAPI, sessionRequestAPI, behavioralNoteAPI } from '../services/api';
import ChatWindow from '../components/common/ChatWindow';

// استيراد الأيقونات
import { 
    UserGroupIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, LightBulbIcon, 
    ExclamationCircleIcon,ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon, AcademicCapIcon,
    ArrowPathIcon, BanknotesIcon, CreditCardIcon, CalendarDaysIcon, PlusIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// ==========================================
// 1. المكونات الفرعية (Sub-Components)
// ==========================================

// أ. مكون الحالة النفسية والملاحظات
const StatusView = ({ selectedChild, cases, notes, loading, onContactTeacher }) => {
    const getStatusConfig = (status) => {
        switch(status) {
            case 'open': return { color: 'bg-red-50 text-red-700 border-red-200', icon: <ExclamationCircleIcon className="w-5 h-5" />, label: 'مفتوحة' };
            case 'in_progress': return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <ClockIcon className="w-5 h-5" />, label: 'قيد المتابعة' };
            case 'closed': return { color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircleIcon className="w-5 h-5" />, label: 'مغلقة' };
            case 'urgent': return { color: 'bg-red-100 text-red-800 border-red-300 animate-pulse', icon: <ExclamationCircleIcon className="w-5 h-5" />, label: 'عاجلة جداً' };
            default: return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: null, label: status };
        }
    };

    return (
        <div className="animate-fade-in space-y-12">
            {/* الحالات النفسية */}
            <div>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                        سجل متابعة: <span className="text-blue-600">{selectedChild?.full_name}</span>
                    </h3>
                </div>
                
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cases.length > 0 ? cases.map(c => {
                            const statusConf = getStatusConfig(c.status);
                            return (
                                <div key={c.id} className="group border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all bg-white relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-2 h-full ${c.status === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-black text-gray-900 text-xl group-hover:text-blue-600 transition-colors">{c.title}</h4>
                                        <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full border ${statusConf.color}`}>
                                            {statusConf.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-6 leading-relaxed font-medium">{c.description}</p>
                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">👨‍⚕️</span>
                                            <span>{c.counselor_name || 'المستشار المدرسي'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">📅</span>
                                            <span>{new Date(c.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                                <CheckCircleIcon className="w-20 h-20 text-green-200 mb-4" />
                                <p className="text-xl font-black text-gray-600">كل شيء على ما يرام!</p>
                                <p className="text-sm font-medium mt-1">لا توجد حالات نفسية مسجلة حالياً.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ملاحظات المعلمين السلوكية */}
            <div className="pt-8 border-t border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
                    ملاحظات المعلمين اليومية
                </h3>
                
                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes && notes.length > 0 ? notes.map(n => (
                            <div key={n.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-1.5 h-full ${n.is_positive ? 'bg-green-400' : n.severity >= 4 ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                                        n.is_positive ? 'bg-green-50 text-green-700' : 
                                        n.severity >= 4 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {n.behavior_type === 'positive' ? '🌟 إيجابي' : n.behavior_type === 'negative' ? '⚠️ سلبي' : '➖ محايد'}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                        {new Date(n.created_at).toLocaleDateString('ar-EG')}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-gray-700 font-medium leading-relaxed mb-6">
                                    {n.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase mb-1">المعلم</span>
                                        <span className="text-xs font-bold text-blue-600">{n.teacher_name}</span>
                                    </div>
                                    <button 
                                        onClick={() => onContactTeacher(n.teacher_id, n.teacher_name)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="تواصل مع المعلم"
                                    >
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-16 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                                <div className="text-4xl mb-4 opacity-20 grayscale">📝</div>
                                <p className="text-gray-500 font-medium">لا توجد ملاحظات سلوكية مسجلة لابنك مؤخراً.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ب. مكون التقارير
const ReportsView = ({ reports, loading, onMarkAsRead }) => {
    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-black mb-8 text-gray-900 flex items-center gap-3">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                التقارير المدرسية والأكاديمية
            </h3>
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reports.length > 0 ? reports.map(r => (
                        <div key={r.id} 
                            className={`group relative border-2 rounded-[32px] p-8 transition-all duration-300 bg-white
                            ${!r.parent_read ? 'border-blue-500 shadow-xl shadow-blue-500/10 bg-blue-50/10' : 'border-gray-100 hover:border-blue-100 hover:shadow-lg'}`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-black text-gray-900 text-xl">{r.title}</h4>
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                            r.report_type === 'behavioral' ? 'bg-amber-50 text-amber-700' : 
                                            r.report_type === 'academic' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {r.report_type}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                                        <span>✍️ {r.author_name}</span>
                                        <span>•</span>
                                        <span>📅 {new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                </div>
                                
                                {!r.parent_read ? (
                                    <button 
                                        onClick={() => onMarkAsRead(r.id)}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        تأكيد القراءة والاستلام
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-2 text-green-600 text-xs font-black bg-green-50 px-4 py-2 rounded-xl">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        تم الاستلام والمراجعة
                                    </span>
                                )}
                            </div>
                            
                            <div className="bg-gray-50/50 rounded-2xl p-6 mb-6">
                                <p className="text-gray-700 leading-relaxed font-medium">{r.content}</p>
                            </div>
                            
                            {r.recommendations && (
                                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-sm text-amber-900 flex gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm">💡</div>
                                    <div>
                                        <strong className="block text-amber-900 mb-1 font-black">توصيات المعلم:</strong>
                                        <p className="font-medium opacity-90">{r.recommendations}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                            <DocumentTextIcon className="w-20 h-20 mx-auto text-gray-200 mb-6" />
                            <h4 className="text-lg font-bold text-gray-800">لا توجد تقارير حالياً</h4>
                            <p className="text-gray-400 text-sm mt-2">بمجرد إرسال المعلمين لتقارير جديدة حول ابنك، ستظهر هنا.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ج. مكون الدردشة
const ChatView = ({ admin, conversations, loadingConversations, selectedConversation, setSelectedConversation, loadConversations }) => {
    const [search, setSearch] = useState('');
    const [staffList, setStaffList] = useState([]); // قائمة الطاقم المدرسي
    const [searchResults, setSearchResults] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    useEffect(() => {
        if (search.trim()) {
            const delayDebounceFn = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const res = await chatAPI.getUsersToChat(search);
                    setSearchResults(res.data.data || []);
                } catch (err) { console.error(err); }
                finally { setIsSearching(false); }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [search]);

    const loadStaff = async () => {
        setLoadingStaff(true);
        try {
            const res = await chatAPI.getUsersToChat('');
            setStaffList(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingStaff(false); }
    };

    return (
        <div className="h-[600px] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
                    تواصل مع أي مستخدم بالاسم
                </h3>
                <button onClick={loadConversations} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" title="تحديث">
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* قائمة المحادثات والبحث */}
                <div className="lg:col-span-1 border rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">
                    <div className="p-4 border-b bg-gray-50 space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ابحث عن اسم الشخص (أدمن، معلم...)"
                                className="w-full pr-10 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {search.trim() ? (
                            <div className="p-2 space-y-1">
                                <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">نتائج البحث</div>
                                {isSearching ? (
                                    <div className="p-4 text-center text-xs text-gray-500">جاري البحث...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => {
                                                setSelectedConversation({ contact_id: u.id, contact_name: u.full_name });
                                                setSearch('');
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{u.full_name[0]}</div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-800">{u.full_name}</div>
                                                <div className="text-[10px] text-gray-500">{u.role}</div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-gray-500 italic">لا توجد نتائج</div>
                                )}
                            </div>
                        ) : (
                            <div className="p-2 space-y-4">
                                {/* المحادثات الأخيرة */}
                                {conversations.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">المحادثات الأخيرة</div>
                                        {conversations.map((c) => {
                                            const active = selectedConversation?.contact_id === c.contact_id;
                                            return (
                                                <button
                                                    key={c.contact_id}
                                                    onClick={() => setSelectedConversation(c)}
                                                    className={`w-full text-right p-3 rounded-lg transition-all relative
                                                        ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white hover:bg-gray-50 border-b border-gray-50'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className={`font-bold text-sm ${active ? 'text-white' : 'text-gray-800'}`}>{c.contact_name}</div>
                                                        {c.unread_count > 0 && !active && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                                                    </div>
                                                    <div className={`text-xs mt-1 truncate ${active ? 'text-blue-50' : 'text-gray-500'}`}>
                                                        {c.last_message || "ابدأ المحادثة..."}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* الطاقم المدرسي المتاح */}
                                 <div className="space-y-1">
                                     <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">الطاقم المدرسي والإدارة</div>
                                     {loadingStaff ? (
                                         <div className="p-4 text-center text-xs text-gray-500">جاري التحميل...</div>
                                     ) : staffList.filter(u => !conversations.some(c => c.contact_id === u.id)).length > 0 ? (
                                         staffList
                                             .filter(u => !conversations.some(c => c.contact_id === u.id))
                                             .map(u => (
                                                 <button
                                                     key={u.id}
                                                     onClick={() => {
                                                         setSelectedConversation({ contact_id: u.id, contact_name: u.full_name });
                                                         setSearch('');
                                                     }}
                                                     className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-all bg-white border border-gray-50"
                                                 >
                                                     <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{u.full_name[0]}</div>
                                                     <div className="text-right">
                                                         <div className="text-sm font-bold text-gray-800">{u.full_name}</div>
                                                         <div className={`text-[10px] text-gray-500 uppercase`}>{u.role}</div>
                                                     </div>
                                                 </button>
                                             ))
                                     ) : (
                                         <div className="p-4 text-center text-xs text-gray-500 italic">لا توجد جهات اتصال متاحة</div>
                                     )}
                                 </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* نافذة الدردشة */}
                <div className="lg:col-span-2 border rounded-xl overflow-hidden bg-gray-50 shadow-inner relative">
                    {selectedConversation ? (
                        <ChatWindow
                            contactId={selectedConversation.contact_id}
                            contactName={selectedConversation.contact_name}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-bold">تواصل مع أي شخص في المدرسة</p>
                            <p className="text-xs mt-1">ابحث عن الاسم في القائمة الجانبية وابدأ المراسلة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// د. مكون النصائح
const AdvicesView = ({ advices }) => (
    <div className="animate-fade-in">
        <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-yellow-500" />
            نصائح وإرشادات تربوية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advices.length > 0 ? advices.map(adv => (
                <div key={adv.id} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-blue-900 group-hover:text-blue-700 transition-colors">{adv.title}</h4>
                        <LightBulbIcon className="w-5 h-5 text-blue-300 group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">{adv.content}</p>
                    <div className="text-[10px] text-gray-400 text-left border-t pt-2 border-blue-100">
                        {new Date(adv.created_at).toLocaleDateString('ar-EG')}
                    </div>
                </div>
            )) : (
                <div className="col-span-3 text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                    لا توجد نصائح منشورة حالياً.
                </div>
            )}
        </div>
    </div>
);

// هـ. مكون الدفع والمالية
const PaymentView = ({ selectedChild, myPayments, loading, handlePay, isModal = false }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', holder: '' });
    const [showCardForm, setShowCardForm] = useState(false);

    const onPayClick = () => {
        if (paymentMethod === 'card') {
            setShowCardForm(true);
        } else {
            handlePay(2500, 'cash');
        }
    };

    const submitCardPayment = (e) => {
        e.preventDefault();
        handlePay(2500, 'card', cardData);
        setShowCardForm(false);
    };

    const getStatusInfo = (status) => {
        const s = (status || '').toLowerCase();

        switch(s) {
            case 'completed': 
            case 'success':
                return { label: 'تم الدفع بنجاح ✅', color: 'text-green-600 bg-green-50' };
            case 'pending_verification': 
            case 'verifying':
                return { label: 'قيد التحقق ⏳', color: 'text-amber-600 bg-amber-50' };
            case 'cash_pending': 
            case 'cash':
                return { label: 'انتظار الدفع النقدي 💵', color: 'text-blue-600 bg-blue-50' };
            case 'failed': 
            case 'rejected':
                return { label: 'فشلت العملية ❌', color: 'text-red-600 bg-red-50' };
            case 'pending': 
            case 'waiting':
                return { label: 'قيد الانتظار ⏳', color: 'text-gray-500 bg-gray-50' };
            default: 
                return { label: status || 'غير محدد', color: 'text-gray-600 bg-gray-50' };
        }
    };

    return (
        <div className="animate-fade-in">
            {!isModal && (
                <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <BanknotesIcon className="w-6 h-6 text-green-600" />
                    المدفوعات والاشتراكات
                </h3>
            )}

            <div className={`grid grid-cols-1 ${isModal ? '' : 'lg:grid-cols-3'} gap-8`}>
                {/* بطاقة الدفع السريع */}
                <div className="lg:col-span-1">
                    <div className={`bg-white border-2 border-blue-100 rounded-3xl p-6 ${isModal ? '' : 'shadow-sm'}`}>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <CreditCardIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-black text-xl text-gray-900 mb-2">جلسة تهيئة نفسية</h4>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            دفع رسوم الجلسة النفسية للابن <span className="font-bold text-blue-600">{selectedChild?.full_name}</span> لضمان المتابعة المستمرة.
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <label className="block text-sm font-bold text-gray-700">اختر طريقة الدفع:</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setPaymentMethod('card')}
                                    className={`py-3 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}
                                >
                                    💳 بطاقة بنكية
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`py-3 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'cash' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}
                                >
                                    💵 دفع نقدي
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-2xl">
                            <span className="text-sm font-bold text-gray-600">المبلغ المطلوب:</span>
                            <span className="text-2xl font-black text-blue-700">2,500 <span className="text-xs uppercase">د.ج</span></span>
                        </div>
                        
                        <button 
                            onClick={onPayClick}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span>تأكيد الطلب</span>
                            <BanknotesIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {showCardForm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-scale-up">
                                <h4 className="text-xl font-black text-gray-900 mb-2">إدخال بيانات البطاقة</h4>
                                <p className="text-sm text-gray-500 mb-6">سيتم تحويل المبلغ إلى الحساب البنكي: <span className="font-bold text-blue-600">12345678900987</span></p>
                                
                                <form onSubmit={submitCardPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 mr-2">اسم صاحب البطاقة</label>
                                        <input 
                                            required
                                            value={cardData.holder}
                                            onChange={(e) => setCardData({...cardData, holder: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="الاسم الكامل"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 mr-2">رقم البطاقة</label>
                                        <input 
                                            required
                                            maxLength="16"
                                            value={cardData.number}
                                            onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono"
                                            placeholder="0000 0000 0000 0000"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-2 mr-2">تاريخ الانتهاء</label>
                                            <input 
                                                required
                                                placeholder="MM/YY"
                                                value={cardData.expiry}
                                                onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-2 mr-2">رمز CVC</label>
                                            <input 
                                                required
                                                maxLength="3"
                                                value={cardData.cvc}
                                                onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono"
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">دفع</button>
                                        <button type="button" onClick={() => setShowCardForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">إلغاء</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* سجل المدفوعات */}
                {!isModal && (
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span>📜</span> سجل المعاملات الأخيرة
                        </h4>
                        {loading ? <p className="text-gray-400">جاري التحميل...</p> : (
                            <div className="space-y-3">
                                {myPayments.length > 0 ? myPayments.map(p => {
                                    const info = getStatusInfo(p.status);
                                    return (
                                        <div key={p.id} className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-blue-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">
                                                    {p.payment_method === 'card' ? '💳' : '💵'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm">{p.student_name}</div>
                                                    <div className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleString('ar-EG')}</div>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-blue-700 text-sm">{p.amount} د.ج</div>
                                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block uppercase mt-1 ${info.color}`}>
                                                    {info.label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                        لا توجد مدفوعات سابقة لهذا الابن
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


// و. مكون طلبات الجلسات
const SessionsView = ({ selectedChild, sessionRequests, loading, handleRequestSession, handlePayForSession }) => {
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [newRequest, setNewRequest] = useState({ reason: '', preferred_date: '' });

    const onSubmit = (e) => {
        e.preventDefault();
        handleRequestSession(newRequest);
        setNewRequest({ reason: '', preferred_date: '' });
        setShowRequestForm(false);
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'pending': return { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-700' };
            case 'accepted': return { label: 'مقبول', color: 'bg-green-100 text-green-700' };
            case 'rejected': return { label: 'مرفوض', color: 'bg-red-100 text-red-700' };
            default: return { label: status, color: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                    طلبات الجلسات الإرشادية
                </h3>
                <button 
                    onClick={() => setShowRequestForm(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    <PlusIcon className="w-5 h-5" />
                    طلب جلسة جديدة
                </button>
            </div>

            {showRequestForm && (
                <div className="mb-10 bg-blue-50/50 border border-blue-100 p-8 rounded-[32px] animate-scale-up">
                    <h4 className="text-xl font-black text-blue-900 mb-6">تقديم طلب استشارة</h4>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 mr-2">سبب الطلب / الملاحظات</label>
                            <textarea 
                                required
                                value={newRequest.reason}
                                onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                                rows={4}
                                className="w-full px-5 py-4 bg-white border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                                placeholder="يرجى وصف الحالة أو سبب رغبتكم في الجلسة..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 mr-2">التاريخ المفضل</label>
                            <input 
                                type="datetime-local"
                                value={newRequest.preferred_date}
                                onChange={(e) => setNewRequest({...newRequest, preferred_date: e.target.value})}
                                className="w-full px-5 py-4 bg-white border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200">إرسال الطلب</button>
                            <button type="button" onClick={() => setShowRequestForm(false)} className="px-10 py-4 bg-gray-200 text-gray-600 rounded-2xl font-bold">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <p className="text-center py-10">جاري التحميل...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sessionRequests.length > 0 ? sessionRequests.map(req => {
                        const status = getStatusLabel(req.status);
                        return (
                            <div key={req.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium">
                                        {new Date(req.requested_at).toLocaleDateString('ar-EG')}
                                    </div>
                                </div>
                                <p className="text-gray-800 font-bold mb-4 line-clamp-2 group-hover:line-clamp-none transition-all">{req.reason}</p>
                                
                                <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">التاريخ المفضل:</span>
                                        <span className="font-bold text-gray-700">{req.preferred_date ? new Date(req.preferred_date).toLocaleString('ar-EG') : 'غير محدد'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">حالة الدفع:</span>
                                        <span className={`font-black ${
                                            req.payment_status === 'completed' ? 'text-green-600' : 
                                            req.payment_status === 'pending_verification' ? 'text-amber-600' :
                                            req.payment_status === 'cash_pending' ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                            {req.payment_status === 'completed' ? 'تم الدفع بنجاح ✅' : 
                                             req.payment_status === 'pending_verification' ? 'قيد التحقق ⏳' :
                                             req.payment_status === 'cash_pending' ? 'انتظار الدفع النقدي 💵' : 'غير مدفوع ❌'}
                                        </span>
                                    </div>
                                </div>

                                {!req.payment_status || req.payment_status === 'failed' ? (
                                    <button 
                                        onClick={() => handlePayForSession(req.id)}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <BanknotesIcon className="w-4 h-4" />
                                        دفع الرسوم الآن
                                    </button>
                                ) : req.payment_status === 'pending_verification' || req.payment_status === 'cash_pending' ? (
                                    <div className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs text-center border border-amber-100">
                                        ⏳ عملية الدفع قيد التحقق
                                    </div>
                                ) : (
                                    <div className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-bold text-xs text-center border border-green-100">
                                        ✅ تم الدفع والاشتراك
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="col-span-2 text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                            <CalendarDaysIcon className="w-20 h-20 mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium">لا توجد طلبات جلسات سابقة.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ==========================================
// 2. المكون الرئيسي (Main Component)
// ==========================================

const ParentDashboard = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    
    // States
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [reports, setReports] = useState([]);
    const [cases, setCases] = useState([]);
    const [notes, setNotes] = useState([]);
    const [advices, setAdvices] = useState([]);
    const [myPayments, setMyPayments] = useState([]);
    const [sessionRequests, setSessionRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Chat States
    const [admin, setAdmin] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);

    // Payment Logic (Linked to Session Request)
    const [activeSessionToPay, setActiveSessionToPay] = useState(null);
    const [showLinkedPaymentModal, setShowLinkedPaymentModal] = useState(false);

    // تحميل البيانات الأولية
    useEffect(() => {
        loadChildren();
        loadAdvices();
        loadAdmin();
        loadMyPayments();
        loadSessionRequests();
    }, []);

    useEffect(() => {
        loadConversations();
    }, []);

    // تحميل بيانات الابن عند التغيير
    useEffect(() => {
        if (selectedChild) {
            loadChildData(selectedChild.id);
        }
    }, [selectedChild]);
    
    const loadAdmin = async () => {
        try {
            const { data } = await chatAPI.getSchoolContact();
            setAdmin(data.data);
        } catch (err) { console.error(err); }
    };

    const loadMyPayments = async () => {
        try {
            const { data } = await paymentAPI.getMy();
            setMyPayments(data.data || []);
        } catch (err) { console.error(err); }
    };

    const loadSessionRequests = async () => {
        try {
            const { data } = await sessionRequestAPI.getMy();
            setSessionRequests(data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleRequestSession = async (reqData) => {
        if (!selectedChild) return;
        try {
            const { data } = await sessionRequestAPI.create({
                student_id: selectedChild.id,
                reason: reqData.reason,
                preferred_date: reqData.preferred_date
            });
            alert('✅ تم تقديم الطلب بنجاح. يمكنك الآن الانتقال للدفع لضمان سرعة المعالجة.');
            loadSessionRequests();
            // Automatically prompt for payment
            setActiveSessionToPay(data.data.id);
            setShowLinkedPaymentModal(true);
        } catch (err) {
            console.error(err);
            alert('❌ فشل تقديم الطلب');
        }
    };

    const handlePay = async (amount, method, cardData = null, linkedRequestId = null) => {
        if (!selectedChild) return;
        try {
            await paymentAPI.process({
                student_id: selectedChild.id,
                session_request_id: linkedRequestId || activeSessionToPay,
                amount,
                payment_method: method,
                card_info: cardData
            });
            alert(method === 'card' ? '✅ تم إرسال معلومات الدفع. طلبك قيد التحقق الآن.' : '✅ تم تقديم طلب الدفع النقدي. يرجى التوجه للإدارة.');
            loadMyPayments();
            loadSessionRequests();
            setShowLinkedPaymentModal(false);
            setActiveSessionToPay(null);
        } catch (err) {
            console.error(err);
            alert('❌ فشل عملية الدفع');
        }
    };

    const loadConversations = async () => {
        setLoadingConversations(true);
        try {
            const res = await chatAPI.getConversations();
            const list = res?.data?.data || [];
            setConversations(list);
            // الحفاظ على المحادثة المحددة إذا كانت موجودة
            setSelectedConversation((prev) => {
                if (prev && list.some((c) => c.contact_id === prev.contact_id)) return prev;
                return list[0] || null;
            });
        } catch (err) { console.error('Error loading conversations:', err); } 
        finally { setLoadingConversations(false); }
    };

    const loadChildren = async () => {
        try {
            const { data } = await studentAPI.getMyChildren();
            const kids = data.data || data.rows || [];
            setChildren(kids);
            if (kids.length > 0) setSelectedChild(kids[0]);
        } catch (err) { console.error("Error loading children:", err); }
    };

    const loadChildData = async (studentId) => {
        setLoading(true);
        try {
            const { data } = await studentAPI.getDashboard(studentId);
            const dashboardData = data.data || {};
            
            setReports(dashboardData.reports || []);
            setCases(dashboardData.cases || []);
            setNotes(dashboardData.notes || []);
        } catch (err) {
            console.error("Error loading child ", err);
            setReports([]);
            setCases([]);
            setNotes([]);
        } finally { setLoading(false); }
    };

    const handleMarkReportAsRead = async (reportId) => {
        try {
            await reportAPI.markAsRead(reportId);
            if (selectedChild) {
                const reportsRes = await reportAPI.getByStudent(selectedChild.id);
                setReports(reportsRes.data.data || []);
            }
        } catch (err) { console.error(err); }
    };

    const loadAdvices = async () => {
        try {
            const { data } = await adviceAPI.getAll();
            setAdvices(data.data || []);
        } catch (err) { console.error("Error loading advices:", err); }
    };

    // تحديد المحتوى المعروض بناءً على المسار
    const renderContent = () => {
        const path = location.pathname;
        
        if (path.includes('/parent/reports')) {
            return <ReportsView reports={reports} loading={loading} onMarkAsRead={handleMarkReportAsRead} />;
        }

        if (path.includes('/parent/sessions')) {
            return (
                <SessionsView 
                    selectedChild={selectedChild} 
                    sessionRequests={sessionRequests.filter(r => r.student_id === selectedChild?.id)}
                    loading={loading}
                    handleRequestSession={handleRequestSession}
                    handlePayForSession={(requestId) => {
                        setActiveSessionToPay(requestId);
                        setShowLinkedPaymentModal(true);
                    }}
                />
            );
        }

        if (path.includes('/parent/chat')) {
            return (
                <ChatView 
                    admin={admin}
                    conversations={conversations}
                    loadingConversations={loadingConversations}
                    selectedConversation={selectedConversation}
                    setSelectedConversation={setSelectedConversation}
                    loadConversations={loadConversations}
                />
            );
        }
        
        if (path.includes('/parent/advices')) {
            return <AdvicesView advices={advices} />;
        }

        if (path.includes('/parent/payments')) {
            return (
                <PaymentView 
                    selectedChild={selectedChild} 
                    myPayments={myPayments.filter(p => p.student_id === selectedChild?.id)} 
                    loading={loading} 
                    handlePay={handlePay} 
                />
            );
        }
        
        // الافتراضي: الحالة النفسية (Status)
        return (
            <StatusView 
                selectedChild={selectedChild} 
                cases={cases} 
                notes={notes}
                loading={loading} 
                onContactTeacher={(id, name) => {
                    setSelectedConversation({ contact_id: id, contact_name: name });
                    // الانتقال لتبويب الدردشة
                    const chatLink = document.querySelector('a[href*="/parent/chat"]');
                    if (chatLink) chatLink.click();
                }}
            />
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto" dir="rtl">
            
            {/* 1. قسم اختيار الابن (ثابت في كل الصفحات) */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6 text-blue-600" />
                        اختر الابن للمتابعة
                    </h2>
                    {selectedChild && (
                        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border">
                            آخر تحديث: {new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {children.length > 0 ? (
                        children.map((child) => {
                            const isSelected = selectedChild?.id === child.id;
                            return (
                                <button
                                    key={child.id}
                                    onClick={() => setSelectedChild(child)}
                                    className={`relative min-w-[200px] p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group
                                        ${isSelected 
                                            ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                                            : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md opacity-80 hover:opacity-100'}`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 left-2 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                                    )}
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-colors
                                        ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100'}`}>
                                        👤
                                    </div>
                                    <div className="text-center">
                                        <span className={`block font-bold text-lg ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                            {child.full_name}
                                        </span>
                                        <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md mt-1 inline-block">
                                            {child.class_name}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="w-full bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6">👨‍👩‍👧‍👦</div>
                            <h3 className="text-2xl font-black text-gray-800 mb-3">لم يتم ربط أي أبناء بحسابك بعد</h3>
                            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                                يبدو أن حسابك جديد أو لم يتم ربطه بأبنائك في قاعدة البيانات. 
                                يرجى التواصل مع إدارة المدرسة فوراً لإتمام عملية الربط لتتمكن من متابعة حالتهم.
                            </p>
                            {admin && (
                                <button 
                                    onClick={() => {
                                        setSelectedConversation({ contact_id: admin.id, contact_name: admin.full_name });
                                        // الانتقال لتبويب الدردشة يدوياً عبر الرابط
                                        const chatLink = document.querySelector('a[href*="/parent/chat"]');
                                        if (chatLink) chatLink.click();
                                    }}
                                    className="px-10 py-4 bg-blue-600 text-white rounded-[20px] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3 hover:-translate-y-1"
                                >
                                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                    مراسلة الإدارة لربط الأبناء
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedChild && (
                <div className="animate-fade-in-up">
                    {/* 2. شريط الإحصائيات السريع (يظهر دائماً عند اختيار ابن) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">التقارير الواردة</p>
                                <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><DocumentTextIcon className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">الحالات النفسية</p>
                                <p className="text-2xl font-bold text-gray-800">{cases.length}</p>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><AcademicCapIcon className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">الرسائل غير المقروءة</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {reports.filter(r => !r.parent_read).length}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><ChatBubbleLeftRightIcon className="w-6 h-6" /></div>
                        </div>
                    </div>

                    {/* 3. منطقة المحتوى الديناميكي */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px] transition-all duration-300">
                        {renderContent()}
                    </div>
                </div>
            )}

            {/* Modal الدفع المرتبط بطلب جلسة */}
            {showLinkedPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl animate-scale-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        
                        <div className="relative">
                            <h4 className="text-2xl font-black text-gray-900 mb-2">إكمال عملية الدفع</h4>
                            <p className="text-gray-500 mb-8 font-medium">يرجى اختيار طريقة الدفع لتفعيل طلب الجلسة النفسية.</p>

                            <PaymentView 
                                selectedChild={selectedChild} 
                                myPayments={[]} // Not used in modal
                                loading={false} 
                                handlePay={(amount, method, cardData) => handlePay(amount, method, cardData, activeSessionToPay)} 
                                isModal={true}
                            />

                            <button 
                                onClick={() => {
                                    setShowLinkedPaymentModal(false);
                                    setActiveSessionToPay(null);
                                }}
                                className="mt-6 w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                            >
                                إغلاق والدفع لاحقاً
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentDashboard;