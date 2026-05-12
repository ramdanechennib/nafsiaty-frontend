import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { behavioralNoteAPI, reportAPI, sessionRequestAPI, studentAPI, chatAPI, adviceAPI } from '../services/api';
import ChatWindow from '../components/common/ChatWindow';

// استيراد الأيقونات
import { 
    UserGroupIcon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    ChartBarIcon,
    PlusCircleIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    AcademicCapIcon,
    ArrowPathIcon,
    UsersIcon,
    MagnifyingGlassIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';
// ==========================================
// 1. المكونات الفرعية (Sub-Components)
// ==========================================

// أ. مكون الملاحظات السلوكية
const BehavioralNotes = ({ selectedStudent, notes, loadingNotes, loadNotes, newNote, setNewNote, addBehavioralNote, sending, onRequestIntervention }) => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
        {/* نموذج الإضافة */}
        <div className="lg:col-span-4">
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-xl shadow-gray-100/50 sticky top-6">
                <div className="font-black text-xl text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <PlusCircleIcon className="w-6 h-6" />
                    </div>
                    إضافة ملاحظة سلوكية
                </div>
                <form onSubmit={addBehavioralNote} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">نوع السلوك</label>
                        <select
                            value={newNote.behavior_type}
                            onChange={(e) => setNewNote({ ...newNote, behavior_type: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-bold"
                        >
                            <option value="">اختر النوع...</option>
                            <option value="positive">🌟 إيجابي</option>
                            <option value="negative">⚠️ سلبي</option>
                            <option value="neutral">➖ محايد</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الوصف والتفاصيل</label>
                        <textarea
                            value={newNote.description}
                            onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                            rows={4}
                            required
                            placeholder="اكتب ملاحظاتك حول سلوك التلميذ..."
                            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-medium resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الخطورة (1-5)</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={newNote.severity}
                                onChange={(e) => setNewNote({ ...newNote, severity: parseInt(e.target.value || '1', 10) })}
                                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-bold"
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={newNote.is_positive}
                                        onChange={(e) => setNewNote({ ...newNote, is_positive: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 border-gray-200 rounded-lg focus:ring-blue-500/20"
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors">إيجابي</span>
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {sending ? 'جاري الحفظ...' : <> <CheckCircleIcon className="w-5 h-5" /> حفظ الملاحظة </>}
                    </button>
                </form>
            </div>
        </div>

        {/* قائمة الملاحظات */}
        <div className="lg:col-span-8">
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-xl shadow-gray-100/50">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
                            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                            سجل الملاحظات التاريخي
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 font-bold">متابعة التغيرات السلوكية للتلميذ عبر الزمن</p>
                    </div>
                    <button 
                        onClick={() => loadNotes(selectedStudent.id)} 
                        className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100" 
                        title="تحديث"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 bg-gray-50/30">
                    {loadingNotes ? (
                        <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
                            <div className="animate-spin text-3xl">⏳</div>
                            <span className="text-xs font-black uppercase tracking-widest">جاري تحميل السجل...</span>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl opacity-30">📜</div>
                            <h4 className="text-lg font-bold text-gray-800">لا توجد ملاحظات حالياً</h4>
                            <p className="text-gray-400 text-sm mt-2">ابدأ بإضافة أول ملاحظة من النموذج الجانبي</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {notes.map((n) => (
                                <div key={n.id} className={`group bg-white border border-gray-100 rounded-[28px] p-6 transition-all hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden`}>
                                    <div className={`absolute top-0 right-0 w-2 h-full transition-all group-hover:w-3 ${n.is_positive ? 'bg-green-400' : n.severity >= 4 ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                                            n.is_positive ? 'bg-green-50 text-green-700' : 
                                            n.severity >= 4 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {n.behavior_type === 'positive' ? '🌟 إيجابي' : n.behavior_type === 'negative' ? '⚠️ سلبي' : '➖ محايد'}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                            {n.note_date ? new Date(n.note_date).toLocaleDateString('ar-EG') : ''}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm text-gray-700 font-medium leading-relaxed mb-6 h-12 overflow-hidden group-hover:h-auto transition-all">
                                        {n.description}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < n.severity ? (n.is_positive ? 'bg-green-400' : 'bg-red-400') : 'bg-gray-100'}`}></div>
                                            ))}
                                        </div>
                                        
                                        {!n.is_positive && n.severity >= 3 && (
                                            <button 
                                                onClick={() => onRequestIntervention(n)}
                                                className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                                            >
                                                🚑 طلب تدخل
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// ب. مكون التقارير
const ReportSender = ({ selectedStudent, newReport, setNewReport, sendReport, sending }) => (
    <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                إرسال تقرير جديد للطالب: <span className="text-blue-600">{selectedStudent.full_name}</span>
            </h2>
            <form onSubmit={sendReport} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">نوع التقرير</label>
                        <select
                            value={newReport.report_type}
                            onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                            <option value="behavioral">سلوكي</option>
                            <option value="academic">أكاديمي</option>
                            <option value="psychological">نفسي</option>
                            <option value="general">عام</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                        <input
                            type="text"
                            value={newReport.title}
                            onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                            required
                            placeholder="مثال: تقرير سلوكي شهري"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">محتوى التقرير</label>
                    <textarea
                        value={newReport.content}
                        onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                        rows={6}
                        required
                        placeholder="اكتب تفاصيل التقرير هنا..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التوصيات والمقترحات (اختياري)</label>
                    <textarea
                        value={newReport.recommendations}
                        onChange={(e) => setNewReport({ ...newReport, recommendations: e.target.value })}
                        rows={3}
                        placeholder="ما هي الخطوات المقترحة للتعامل مع هذه الحالة؟"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={sending}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold shadow-md shadow-blue-200 flex items-center gap-2"
                    >
                        {sending ? 'جاري الإرسال...' : <> <CheckCircleIcon className="w-5 h-5" /> إرسال التقرير </>}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

// ج. مكون طلب الجلسة
const SessionRequester = ({ selectedStudent, sessionRequest, setSessionRequest, requestSession, sending }) => (
    <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                <CalendarDaysIcon className="w-6 h-6 text-amber-600" />
                طلب جلسة إرشادية للطالب: <span className="text-amber-600">{selectedStudent.full_name}</span>
            </h2>
            <form onSubmit={requestSession} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سبب الطلب وتفاصيل الحالة</label>
                    <textarea
                        value={sessionRequest.reason}
                        onChange={(e) => setSessionRequest({ ...sessionRequest, reason: e.target.value })}
                        rows={6}
                        required
                        placeholder="اشرح سبب حاجتك لجلسة مع المستشار..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-100 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ والوقت المفضل (اختياري)</label>
                    <input
                        type="datetime-local"
                        value={sessionRequest.preferred_date}
                        onChange={(e) => setSessionRequest({ ...sessionRequest, preferred_date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-100 outline-none"
                    />
                </div>
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={sending}
                        className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 font-bold shadow-md shadow-amber-200 flex items-center gap-2"
                    >
                        {sending ? 'جاري الإرسال...' : <> <CalendarDaysIcon className="w-5 h-5" /> إرسال الطلب </>}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

// د. مكون المتابعة والإحصائيات
const FollowUpStats = ({ selectedStudent, notes, studentDetails }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-blue-600 font-bold">الملاحظات السلوكية</div>
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{notes.length}</div>
            <div className="text-xs text-gray-500 mt-2">إجمالي الملاحظات المسجلة</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-purple-600 font-bold">أولياء الأمور</div>
                <UserGroupIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
                {Array.isArray(studentDetails?.parents) ? studentDetails.parents.filter(Boolean).length : 0}
            </div>
            <div className="text-xs text-gray-500 mt-2">مرتبطون بالحساب</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-green-600 font-bold">بيانات الطالب</div>
                <AcademicCapIcon className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-1 text-sm text-gray-700">
                <div><span className="font-bold text-gray-900">الفصل:</span> {selectedStudent.class_name || '-'}</div>
                <div><span className="font-bold text-gray-900">المجموعة:</span> {selectedStudent.group_name || '-'}</div>
            </div>
        </div>
    </div>
);

// هـ. مكون الدردشة المحسن للمعلم
const TeacherChatView = ({ selectedConversation: initialConversation }) => {
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(initialConversation || null);
    const [search, setSearch] = useState('');
    const [staffList, setStaffList] = useState([]); // قائمة المستشارين والطاقم
    const [searchResults, setSearchResults] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (initialConversation) {
            setSelectedConversation(initialConversation);
        }
    }, [initialConversation]);

    useEffect(() => {
        loadConversations();
        loadStaff(); // جلب المستشارين عند التحميل
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

    const loadConversations = async () => {
        setLoadingConversations(true);
        try {
            const res = await chatAPI.getConversations();
            setConversations(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingConversations(false); }
    };

    const loadStaff = async () => {
        setLoadingStaff(true);
        try {
            const res = await chatAPI.getUsersToChat('');
            setStaffList(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingStaff(false); }
    };

    return (
        <div className="h-[600px] flex flex-col animate-fade-in bg-white rounded-2xl overflow-hidden shadow-sm border">
            <div className="flex-1 flex overflow-hidden">
                {/* قائمة المحادثات والبحث */}
                <div className="w-80 border-l flex flex-col bg-gray-50/30">
                    <div className="p-4 bg-white border-b">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="بحث عن شخص بالاسم..."
                                className="w-full pr-10 pl-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-all"
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
                                                    className={`w-full text-right p-3 rounded-xl transition-all relative
                                                        ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 border-b border-gray-50'}`}
                                                >
                                                    <div className="font-bold text-sm">{c.contact_name}</div>
                                                    <div className={`text-xs mt-1 truncate ${active ? 'text-blue-50' : 'text-gray-500'}`}>
                                                        {c.last_message || "ابدأ المحادثة..."}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* الزملاء المتاحون (المستشارون والإدارة) */}
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">المستشارين والطاقم المدرسي</div>
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
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-all bg-white border border-gray-50"
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">{u.full_name[0]}</div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-gray-800">{u.full_name}</div>
                                                        <div className={`text-[10px] text-gray-500 uppercase`}>{u.role}</div>
                                                    </div>
                                                </button>
                                            ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-gray-500 italic">لا توجد جهات اتصال متاحة حالياً</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* نافذة الدردشة */}
                <div className="flex-1 bg-white relative">
                    {selectedConversation ? (
                        <ChatWindow
                            contactId={selectedConversation.contact_id}
                            contactName={selectedConversation.contact_name}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-bold">اختر شخصاً لمراسلته</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// و. مكون نصائح المستشارين (للمعلمين)
const CounselorAdvices = ({ advices, loading }) => (
    <div className="animate-fade-in">
        <div className="mb-8">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <LightBulbIcon className="w-8 h-8 text-amber-500" />
                توجيهات المستشارين النفسيين
            </h3>
            <p className="text-sm text-gray-500 mt-1">نصائح عامة وتوجيهات من الطاقم النفسي لمساعدتك في التعامل مع التلاميذ.</p>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : advices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advices.map(adv => (
                    <div key={adv.id} className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-[32px] border border-amber-100 hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-amber-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="font-black text-amber-900 text-lg group-hover:text-amber-700 transition-colors">{adv.title}</h4>
                            <LightBulbIcon className="w-6 h-6 text-amber-300 group-hover:text-amber-500 transition-all" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-6 font-medium">{adv.content}</p>
                        <div className="pt-4 border-t border-amber-100/50 flex justify-between items-center text-[10px] font-bold text-amber-600/60">
                            <span>✍️ المستشار التربوي</span>
                            <span>{new Date(adv.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-6 grayscale opacity-20">💡</div>
                <h4 className="text-lg font-bold text-gray-800">لا توجد نصائح حالياً</h4>
                <p className="text-gray-400 text-sm mt-2">بمجرد نشر المستشارين لنصائح جديدة، ستظهر هنا.</p>
            </div>
        )}
    </div>
);

// ==========================================
// 2. المكون الرئيسي (Main Component)
// ==========================================

const TeacherDashboard = () => {
  const location = useLocation();
  
  // States
  const [students, setStudents] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  
  // Data States
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [advices, setAdvices] = useState([]);
  const [loadingAdvices, setLoadingAdvices] = useState(false);
  const [adminContact, setAdminContact] = useState(null);

  // Form States
  const [newNote, setNewNote] = useState({ behavior_type: '', description: '', severity: 1, is_positive: false });
  const [newReport, setNewReport] = useState({ title: '', content: '', recommendations: '', report_type: 'behavioral' });
  const [sessionRequest, setSessionRequest] = useState({ reason: '', preferred_date: '' });
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Effects
  useEffect(() => { 
    loadStudents(); 
    loadAdvices();
    loadAdminContact();
  }, []);

  useEffect(() => {
    if (!selectedStudent?.id) {
      setStudentDetails(null);
      setNotes([]);
      return;
    }
    loadStudentDetails(selectedStudent.id);
    loadNotes(selectedStudent.id);
  }, [selectedStudent?.id]);

  // Handlers
  const loadStudents = async () => {
    try {
      const res = await studentAPI.getMyStudents();
      const studentsData = res?.data?.data || res?.data?.rows || [];
      setStudents(studentsData);
      if (studentsData.length > 0 && !selectedStudent) setSelectedStudent(studentsData[0]);
    } catch (err) { console.error(err); setStudents([]); }
  };

  const loadAdvices = async () => {
    setLoadingAdvices(true);
    try {
      const res = await adviceAPI.getAll();
      setAdvices(res?.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingAdvices(false); }
  };

  const loadAdminContact = async () => {
    try {
      const res = await chatAPI.getSchoolContact();
      setAdminContact(res?.data?.data || null);
    } catch (err) { console.error(err); }
  };

  const groups = useMemo(() => {
    const map = new Map();
    for (const s of students || []) {
      if (s.group_id && !map.has(s.group_id)) {
        map.set(s.group_id, { id: s.group_id, name: s.group_name || 'Group', subject: s.subject });
      }
    }
    return Array.from(map.values());
  }, [students]);

  const visibleStudents = useMemo(() => {
    if (!groupId) return students || [];
    return (students || []).filter((s) => s.group_id === groupId);
  }, [students, groupId]);

  const loadStudentDetails = async (studentId) => {
    try {
      const res = await studentAPI.getById(studentId);
      setStudentDetails(res?.data?.data || res?.data?.student || null);
    } catch (err) { console.error('loadStudentDetails error:', err); setStudentDetails(null); }
  };

  const loadNotes = async (studentId) => {
    setLoadingNotes(true);
    try {
      const res = await behavioralNoteAPI.getByStudent(studentId);
      setNotes(res?.data?.data || []);
    } catch (err) { console.error('loadNotes error:', err); setNotes([]); } 
    finally { setLoadingNotes(false); }
  };

  const addBehavioralNote = async (e) => {
    e.preventDefault();
    if (!selectedStudent?.id) return;
    setSending(true);
    try {
      await behavioralNoteAPI.create({ ...newNote, student_id: selectedStudent.id });
      setNewNote({ behavior_type: '', description: '', severity: 1, is_positive: false });
      await loadNotes(selectedStudent.id);
      alert('✅ تم حفظ الملاحظة السلوكية بنجاح');
    } catch (err) {
      console.error('addBehavioralNote error:', err);
      alert('❌ فشل حفظ الملاحظة');
    } finally {
      setSending(false);
    }
  };

  const handleRequestIntervention = async (note) => {
     if (!window.confirm(`هل تريد إرسال طلب تدخل للمستشار بناءً على هذه الملاحظة؟\n\nالملاحظة: ${note.description}`)) return;
     
     try {
       // إنشاء طلب جلسة تلقائي من المعلم للمستشار
       await sessionRequestAPI.create({
         student_id: selectedStudent.id,
         reason: `تدخل عاجل بناءً على ملاحظة معلم: ${note.description}`,
         preferred_date: new Date().toISOString()
       });
       
       alert('🚀 تم إرسال طلب التدخل للمستشار بنجاح. سيظهر له الطلب في لوحة التحكم.');
     } catch (err) {
       console.error(err);
       alert('❌ فشل إرسال طلب التدخل');
     }
   };

  const sendReport = async (e) => {
    e.preventDefault();
    if (!selectedStudent?.id) return;
    setSending(true);
    try {
      await reportAPI.create({ ...newReport, student_id: selectedStudent.id });
      setNewReport({ title: '', content: '', recommendations: '', report_type: 'behavioral' });
      alert('✅ تم إرسال التقرير بنجاح');
    } catch (err) { console.error('sendReport error:', err); alert('❌ خطأ في إرسال التقرير'); } 
    finally { setSending(false); }
  };

  const requestSession = async (e) => {
    e.preventDefault();
    if (!selectedStudent?.id) return;
    setSending(true);
    try {
      await sessionRequestAPI.create({
        student_id: selectedStudent.id,
        reason: sessionRequest.reason,
        preferred_date: sessionRequest.preferred_date || null,
      });
      setSessionRequest({ reason: '', preferred_date: '' });
      alert('✅ تم إرسال طلب الجلسة للمستشار');
    } catch (err) { console.error('requestSession error:', err); alert('❌ خطأ في إرسال الطلب'); } 
    finally { setSending(false); }
  };

  // تحديد المحتوى بناءً على المسار
  const renderContent = () => {
    const path = location.pathname;
    
    // إذا لم يتم اختيار طالب، نظهر رسالة فقط في التبويبات التي تحتاج طالباً
    const NoStudentSelected = () => (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">🎓</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">الرجاء اختيار طالب للبدء</h3>
            <p className="max-w-xs text-sm mb-8">يجب عليك اختيار طالب من القائمة العلوية لتتمكن من إضافة الملاحظات أو التقارير.</p>
            
            {students.length === 0 && adminContact && (
                <div className="animate-fade-in">
                    <p className="text-xs text-amber-600 font-bold mb-4 bg-amber-50 px-4 py-2 rounded-xl">⚠️ يبدو أنه لم يتم تعيين أي طلاب لك بعد.</p>
                    <button 
                        onClick={() => {
                            setSelectedConversation({ contact_id: adminContact.id, contact_name: adminContact.full_name });
                            window.history.pushState({}, '', '/teacher/chat');
                        }}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        تواصل مع الإدارة لطلب التعيين
                    </button>
                </div>
            )}
        </div>
    );

    if (path.includes('/teacher/advices')) {
        return <CounselorAdvices advices={advices} loading={loadingAdvices} />;
    }

    if (path.includes('/teacher/notes')) {
        if (!selectedStudent) return <NoStudentSelected />;
        return <BehavioralNotes 
                        selectedStudent={selectedStudent} 
                        notes={notes} 
                        loadingNotes={loadingNotes} 
                        loadNotes={loadNotes}
                        newNote={newNote}
                        setNewNote={setNewNote}
                        addBehavioralNote={addBehavioralNote}
                        sending={sending}
                        onRequestIntervention={handleRequestIntervention}
                    />;
    }
    
    if (path.includes('/teacher/reports')) {
        if (!selectedStudent) return <NoStudentSelected />;
        return <ReportSender 
            selectedStudent={selectedStudent}
            newReport={newReport}
            setNewReport={setNewReport}
            sendReport={sendReport}
            sending={sending}
        />;
    }
    
    if (path.includes('/teacher/request-intervention')) {
        if (!selectedStudent) return <NoStudentSelected />;
        return <SessionRequester 
            selectedStudent={selectedStudent}
            sessionRequest={sessionRequest}
            setSessionRequest={setSessionRequest}
            requestSession={requestSession}
            sending={sending}
        />;
    }
    
    if (path.includes('/teacher/follow-up')) {
        if (!selectedStudent) return <NoStudentSelected />;
        return <FollowUpStats 
            selectedStudent={selectedStudent}
            notes={notes}
            studentDetails={studentDetails}
        />;
    }

    // الدردشة: يمكن الوصول إليها حتى بدون اختيار طالب (لرؤية المحادثات السابقة)
    if (path.includes('/teacher/chat')) {
        return <TeacherChatView />;
    }

    // Fallback to notes if path is just /teacher or unknown
    if (!selectedStudent) return <NoStudentSelected />;
    return <BehavioralNotes 
        selectedStudent={selectedStudent} 
        notes={notes} 
        loadingNotes={loadingNotes} 
        loadNotes={loadNotes}
        newNote={newNote}
        setNewNote={setNewNote}
        addBehavioralNote={addBehavioralNote}
        sending={sending}
    />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      
      {/* Header & Student Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                    لوحة المعلم
                </h1>
                <p className="text-sm text-gray-500 mt-1">إدارة الطلاب، الملاحظات، والتقارير.</p>
            </div>
            
            <div className="flex items-center gap-2">
                <select
                className="px-3 py-2 text-sm border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                >
                <option value="">كل المجموعات</option>
                {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                    {g.name}{g.subject ? ` • ${g.subject}` : ''}
                    </option>
                ))}
                </select>
                <button
                onClick={loadStudents}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                title="تحديث القائمة"
                >
                <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-1">
          {visibleStudents.length === 0 ? (
            <div className="w-full text-center py-10 text-gray-400 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[32px] font-bold italic">
              لا يوجد تلاميذ حالياً في هذه المجموعة
            </div>
          ) : (
            visibleStudents.map((s) => {
              const active = selectedStudent?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`relative min-w-[220px] p-5 rounded-[28px] border-2 transition-all duration-300 text-right group overflow-hidden
                    ${active 
                        ? 'border-blue-600 bg-white shadow-xl shadow-blue-500/10 scale-[1.02]' 
                        : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-gray-200/50'}`}
                >
                  {active && (
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600"></div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all
                        ${active ? 'bg-blue-600 text-white rotate-3' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                        {s.full_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-black text-sm truncate transition-colors ${active ? 'text-blue-600' : 'text-gray-800 group-hover:text-blue-700'}`}>
                            {s.full_name}
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{s.class_name || 'تلميذ'}</div>
                    </div>
                  </div>
                  
                  {s.group_name && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{s.group_name}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px] transition-all duration-300">
            {renderContent()}
      </div>
    </div>
  );
};

export default TeacherDashboard;