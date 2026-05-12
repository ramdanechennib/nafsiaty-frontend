import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { adviceAPI, caseAPI, chatAPI, sessionRequestAPI, behavioralNoteAPI, studentAPI, adminAPI, reportAPI } from '../services/api';
import ChatWindow from '../components/common/ChatWindow';
import { 
  ClipboardDocumentListIcon, DocumentIcon,
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const statusMeta = {
  open: { label: 'مفتوحة', color: 'bg-red-500', icon: '🔓' },
  in_progress: { label: 'قيد المتابعة', color: 'bg-amber-500', icon: '⏳' },
  closed: { label: 'مغلقة', color: 'bg-green-600', icon: '✅' },
  urgent: { label: 'عاجلة', color: 'bg-red-700', icon: '🚨' },
};

const getPaymentStatusInfo = (status) => {
  const s = (status || '').toLowerCase();
  
  switch(s) {
    case 'completed': 
    case 'success':
      return { label: 'مدفوع ✅', color: 'bg-green-100 text-green-700' };
    case 'pending_verification': 
    case 'verifying':
      return { label: 'قيد التحقق ⏳', color: 'bg-amber-100 text-amber-700' };
    case 'cash_pending': 
    case 'cash':
      return { label: 'انتظار نقدي 💵', color: 'bg-blue-100 text-blue-700' };
    case 'failed': 
    case 'rejected':
      return { label: 'فشل الدفع ❌', color: 'bg-red-100 text-red-700' };
    case 'pending':
    case 'waiting':
      return { label: 'قيد الانتظار ⏳', color: 'bg-gray-100 text-gray-600' };
    default: 
      return { label: status || 'غير مدفوع ❌', color: 'bg-red-50 text-red-600' };
  }
};

const CounselorDashboard = () => {
  const location = useLocation();
  
  // State for Active Tab (Synced with URL)
  const [activeTab, setActiveTab] = useState('cases'); 

  // Data States
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [caseQuery, setCaseQuery] = useState('');
  const [caseStatus, setCaseStatus] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false);

  // Teacher Notes Feed
  const [teacherNotes, setTeacherNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [studentSpecificNotes, setStudentSpecificNotes] = useState([]);

  const [newSession, setNewSession] = useState({
    session_date: '',
    duration_minutes: 30,
    notes: '',
    progress_assessment: '',
  });

  const [allTeacherNotes, setAllTeacherNotes] = useState([]);
  const [loadingAllNotes, setLoadingAllNotes] = useState(false);

  const [allReports, setAllReports] = useState([]);
  const [loadingAllReports, setLoadingAllReports] = useState(false);

  const [sessionRequests, setSessionRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [showQuickEvalModal, setShowQuickEvalModal] = useState(false);
  const [quickEvalData, setQuickEvalData] = useState({ case_id: '', student_name: '', assessment: '' });
  const [newCaseData, setNewCaseData] = useState({
    student_id: '',
    title: '',
    description: '',
    severity_level: 3,
  });

  const [newAdvice, setNewAdvice] = useState({ title: '', content: '', category: '' });
  const [sendingAdvice, setSendingAdvice] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatStudentId, setChatStudentId] = useState('');

  const [advices, setAdvices] = useState([]);
  const [loadingAdvices, setLoadingAdvices] = useState(false);

  // ==========================================
  // 1. Dynamic Data Fetching based on Route
  // ==========================================
  
  // Sync URL with Tab State & Trigger Data Load
  useEffect(() => {
    const path = location.pathname;
    let nextTab = 'cases';
    
    if (path.includes('/counselor/sessions')) nextTab = 'requests';
    else if (path.includes('/counselor/chat')) nextTab = 'chat';
    else if (path.includes('/counselor/advices')) nextTab = 'advices';
    else if (path.includes('/counselor/teacher-notes')) nextTab = 'teacher-notes';
    else if (path.includes('/counselor/teacher-reports')) nextTab = 'teacher-reports';
    else if (path.includes('/counselor/progress')) nextTab = 'progress';
    
    setActiveTab(nextTab);

    // Load specific data based on the active tab
    if (nextTab === 'cases') {
      loadCases();
    }
    if (nextTab === 'requests') loadSessionRequests();
    if (nextTab === 'chat') loadConversations();
    if (nextTab === 'teacher-notes') loadAllTeacherNotes();
    if (nextTab === 'teacher-reports') loadAllReports();
    if (nextTab === 'advices') loadAdvices();
    
    // Always load students and stats in background
    loadStudents();
    loadStats();

  }, [location.pathname]);

  // Load Case Details & Student Notes when ID changes
  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null);
      setStudentSpecificNotes([]);
      return;
    }
    loadCaseDetails(selectedCaseId);
  }, [selectedCaseId]);

  // ==========================================
  // 2. API Handlers
  // ==========================================

  const loadAdvices = async () => {
    setLoadingAdvices(true);
    try {
      const res = await adviceAPI.getAll();
      setAdvices(res?.data?.data || []);
    } catch (err) { console.error('loadAdvices error:', err); }
    finally { setLoadingAdvices(false); }
  };

  const loadAllTeacherNotes = async () => {
    setLoadingAllNotes(true);
    try {
      // جلب جميع الملاحظات السلوكية التي سجلها المعلمون
      const res = await behavioralNoteAPI.getAll(); 
      setAllTeacherNotes(res.data.data || []);
    } catch (err) { console.error('loadAllTeacherNotes error:', err); }
    finally { setLoadingAllNotes(false); }
  };

  const loadAllReports = async () => {
    setLoadingAllReports(true);
    try {
      const res = await reportAPI.getAll();
      setAllReports(res.data.data || []);
    } catch (err) { console.error('loadAllReports error:', err); }
    finally { setLoadingAllReports(false); }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await caseAPI.getStats();
      setStats(res?.data?.data || null);
    } catch (err) { console.error('loadStats error:', err); } 
    finally { setLoadingStats(false); }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await studentAPI.getAllStudents();
      setStudents(res?.data?.data || []);
    } catch (err) { console.error('loadStudents error:', err); }
    finally { setLoadingStudents(false); }
  };

  const handleOpenAddCaseModal = () => {
    setNewCaseData({ student_id: '', student_name: '', title: '', description: '', severity_level: 3 });
    loadStudents(); // التأكد من تحميل القائمة عند فتح النافذة
    setShowAddCaseModal(true);
  };

  const createNewCase = async (e) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      await caseAPI.create({
        ...newCaseData,
        counselor_id: currentUser.id,
      });
      alert('✅ تم إنشاء الحالة بنجاح');
      setShowAddCaseModal(false);
      setNewCaseData({ student_id: '', title: '', description: '', severity_level: 3 });
      await loadCases();
    } catch (err) {
      console.error('createNewCase error:', err);
      alert('❌ فشل إنشاء الحالة');
    }
  };

  const submitQuickEval = async (e) => {
    e.preventDefault();
    try {
      await caseAPI.addSession(quickEvalData.case_id, {
        session_date: new Date().toISOString().split('T')[0],
        duration_minutes: 30,
        notes: 'تقييم سريع من لوحة المتابعة',
        progress_assessment: quickEvalData.assessment
      });
      alert('✅ تم تسجيل التقييم بنجاح');
      setShowQuickEvalModal(false);
      setQuickEvalData({ case_id: '', student_name: '', assessment: '' });
      await loadCases(); // تحديث القائمة لرؤية التقييم الجديد
    } catch (err) {
      console.error('submitQuickEval error:', err);
      alert('❌ فشل تسجيل التقييم');
    }
  };

  const loadCases = async () => {
    setLoadingCases(true);
    try {
      // جلب جميع الحالات المتاحة للمستشار (الخاصة به وغير المعينة)
      const res = await caseAPI.getMyCases();
      setCases(res?.data?.data || []);
    } catch (err) { console.error('loadCases error:', err); } 
    finally { setLoadingCases(false); }
  };

  const assignToMe = async (caseId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      await caseAPI.update(caseId, { counselor_id: currentUser.id, status: 'in_progress' });
      alert('✅ تم تعيين الحالة لك بنجاح');
      await loadCases();
      if (selectedCaseId === caseId) await loadCaseDetails(caseId);
    } catch (err) {
      console.error('assignToMe error:', err);
      alert('فشل تعيين الحالة');
    }
  };

  const loadCaseDetails = async (caseId) => {
    setLoadingCaseDetails(true);
    try {
      const res = await caseAPI.getById(caseId);
      const caseData = res?.data?.data || null;
      setSelectedCase(caseData);
      
      if (caseData?.student_id) {
        const notesRes = await behavioralNoteAPI.getByStudent(caseData.student_id);
        setStudentSpecificNotes(notesRes?.data?.data || []);
      }
    } catch (err) { console.error('loadCaseDetails error:', err); } 
    finally { setLoadingCaseDetails(false); }
  };

  const loadTeacherNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await behavioralNoteAPI.getAll();
      setTeacherNotes(res?.data?.data || []);
    } catch (err) { console.error('loadTeacherNotes error:', err); }
    finally { setLoadingNotes(false); }
  };

  const loadSessionRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await sessionRequestAPI.getMy();
      setSessionRequests(res?.data?.data || []);
    } catch (err) { console.error('loadSessionRequests error:', err); } 
    finally { setLoadingRequests(false); }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await chatAPI.getConversations();
      setConversations(res?.data?.data || []);
    } catch (err) { console.error('loadConversations error:', err); } 
    finally { setLoadingConversations(false); }
  };

  // ==========================================
  // 3. Action Handlers (With Auto-Refresh)
  // ==========================================

  const respondToSession = async (requestId, status) => {
    try {
      await sessionRequestAPI.respond(requestId, { status });
      alert(status === 'accepted' ? 'تم قبول الطلب' : 'تم رفض الطلب');
      await loadSessionRequests(); // Refresh list immediately
    } catch (err) { console.error('respondToSession error:', err); }
  };

  const updateCaseStatus = async (caseId, status) => {
    try {
      await caseAPI.update(caseId, { status });
      // Optimistic update or refresh
      await loadCases(); 
      if (selectedCaseId === caseId) await loadCaseDetails(caseId);
    } catch (err) { console.error('updateCaseStatus error:', err); }
  };

  const addSession = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    try {
      await caseAPI.addSession(selectedCaseId, {
        ...newSession,
        duration_minutes: Number(newSession.duration_minutes) || 30,
      });
      setNewSession({ session_date: '', duration_minutes: 30, notes: '', progress_assessment: '' });
      await loadCaseDetails(selectedCaseId); // Refresh details to show new session
      alert('✅ تم إضافة الجلسة بنجاح');
    } catch (err) { console.error('addSession error:', err); }
  };

  const sendAdvice = async (e) => {
    e.preventDefault();
    setSendingAdvice(true);
    try {
      await adviceAPI.create({ ...newAdvice, target_role: 'parent' });
      setNewAdvice({ title: '', content: '', category: '' });
      alert('✅ تم إرسال النصيحة بنجاح');
    } catch (err) { console.error('sendAdvice error:', err); } 
    finally { setSendingAdvice(false); }
  };

  const filteredCases = useMemo(() => {
    const q = caseQuery.trim().toLowerCase();
    return (cases || []).filter((c) => {
      if (caseStatus && c.status !== caseStatus) return false;
      if (!q) return true;
      const hay = [c.title, c.student_name, c.class_name, c.description].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [cases, caseQuery, caseStatus]);

  // ج. مكون الدردشة
  const ChatView = () => {
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [search, setSearch] = useState('');
    const [staffList, setStaffList] = useState([]); // قائمة المعلمين والطاقم
    const [searchResults, setSearchResults] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
      loadConversations();
      loadStaff(); // جلب المعلمين عند التحميل
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
        // استدعاء بدون search لجلب المعلمين (حسب منطق الـ Backend الجديد)
        const res = await chatAPI.getUsersToChat('');
        setStaffList(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoadingStaff(false); }
    };

    return (
      <div className="h-[calc(100vh-200px)] flex flex-col animate-fade-in bg-white rounded-3xl overflow-hidden shadow-xl border">
        <div className="flex-1 flex overflow-hidden">
          {/* قائمة المستخدمين */}
          <div className="w-80 border-l flex flex-col bg-gray-50/30">
            <div className="p-4 bg-white border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث بالاسم..."
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

                  {/* الزملاء المتاحون (المعلمون والإدارة) */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-widest">المعلمين والطاقم المدرسي</div>
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
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">اختر شخصاً لمراسلته</p>
                <p className="text-xs mt-1">يمكنك مراسلة أي مستخدم في النظام بالبحث عن اسمه</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // د. مكون متابعة التقدم المحسن
  const ProgressTracking = () => {
    return (
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
              متابعة تقدم الحالات النفسية
            </h2>
            <p className="text-gray-500 mt-1 font-medium">نظرة شاملة على تطور حالة التلاميذ ونتائج الجلسات الإرشادية.</p>
          </div>
          <button 
            onClick={loadCases} 
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-bold hover:bg-blue-100 transition-all shadow-sm"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loadingCases ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
        </div>

        {loadingCases ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <div className="animate-spin text-4xl mb-4">⌛</div>
            <span>جاري تحليل التقدم...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
            <div className="text-6xl mb-6 opacity-20 grayscale">📈</div>
            <h3 className="text-xl font-bold text-gray-800">لا توجد حالات مسجلة حالياً</h3>
            <p className="text-gray-500 mt-2 max-w-sm">بمجرد فتح حالات نفسية وإضافة جلسات، ستتمكن من تتبع تقدم التلاميذ هنا.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest">التلميذ</th>
                    <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest">الحالة</th>
                    <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest text-center">عدد الجلسات</th>
                    <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest">آخر تقييم للتقدم</th>
                    <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-6">
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{c.student_name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{c.class_name}</div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white ${statusMeta[c.status]?.color || 'bg-gray-400'}`}>
                          {statusMeta[c.status]?.label || c.status}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-xs border border-blue-100">
                          {c.session_count || 0}
                        </span>
                      </td>
                      <td className="p-6 max-w-md">
                        <p className="text-sm text-gray-600 italic line-clamp-1">
                          {c.latest_progress || 'لا يوجد تقييم مسجل بعد'}
                        </p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setSelectedCaseId(c.id); setActiveTab('cases'); window.history.pushState({}, '', '/counselor/cases'); }}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                          >
                            التفاصيل
                          </button>
                          <button 
                            onClick={() => {
                              setQuickEvalData({ case_id: c.id, student_name: c.student_name, assessment: '' });
                              setShowQuickEvalModal(true);
                            }}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                          >
                            <span>📝</span> تقييم سريع
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* قسم الملاحظات التعليمية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>💡</span> كيف تملأ هذا القسم؟
                </h3>
                <div className="space-y-4 text-blue-50 text-sm leading-relaxed">
                  <p>• المعلومات هنا تُجلب تلقائياً من <strong>"الجلسات المنفذة"</strong> التي تضيفها في صفحة كل حالة.</p>
                  <p>• كلما كتبت <strong>"تقييم التقدم"</strong> بدقة عند نهاية كل جلسة، أصبح هذا الجدول أكثر فائدة.</p>
                  <p>• الهدف هو مقارنة حالة التلميذ عند الافتتاح مع وضعه الحالي بعد عدة جلسات.</p>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100">
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <span>🚀</span> لمن تبعث هذه التقارير؟
                </h3>
                <div className="space-y-4 text-amber-800 text-sm leading-relaxed">
                  <p>• <strong>إلى الأباء:</strong> استخدم قسم "النصائح" أو "الدردشة" لإرسال ملخص التقدم لولي الأمر لتعزيز التعاون.</p>
                  <p>• <strong>إلى الإدارة:</strong> المعلومات هنا تظهر للأدمن في قسم التقارير، مما يساعدهم على رؤية إنجازاتك كمستشار.</p>
                  <p>• <strong>إلى المعلم:</strong> شارك النتائج الإيجابية مع المعلم لتحسين تعامله مع التلميذ داخل الفصل.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // هـ. مكون مراقبة ملاحظات المعلمين المحسن
  const TeacherNotesMonitoring = () => {
    return (
      <div className="p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
              مراقبة ملاحظات المعلمين
            </h2>
            <p className="text-gray-500 mt-1 font-medium">متابعة بلاغات المعلمين حول سلوك التلاميذ للتدخل المبكر.</p>
          </div>
          <button 
            onClick={loadAllTeacherNotes} 
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-bold hover:bg-blue-100 transition-all shadow-sm"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loadingAllNotes ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
        </div>

        {loadingAllNotes ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <div className="animate-spin text-4xl mb-4">⌛</div>
            <span className="text-xs font-black uppercase tracking-widest">جاري جلب ملاحظات المعلمين...</span>
          </div>
        ) : allTeacherNotes.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
            <div className="text-6xl mb-6 opacity-20 grayscale">📝</div>
            <h3 className="text-xl font-bold text-gray-800">لا توجد ملاحظات مسجلة</h3>
            <p className="text-gray-500 mt-2 max-w-sm">لم يقم المعلمون بتسجيل أي ملاحظات سلوكية مؤخراً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {allTeacherNotes.map((n) => (
              <div key={n.id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-2 h-full ${n.is_positive ? 'bg-green-400' : n.severity >= 4 ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{n.student_name}</h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded">{n.class_name}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    n.is_positive ? 'bg-green-50 text-green-700 border-green-100' : 
                    n.severity >= 4 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {n.is_positive ? '🌟 إيجابي' : '⚠️ تنبيه'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 font-medium leading-relaxed mb-8 h-20 overflow-hidden line-clamp-4 group-hover:line-clamp-none transition-all">
                  {n.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase mb-0.5">المعلم المبلّغ</span>
                    <span className="text-xs font-bold text-gray-800">{n.teacher_name}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setNewCaseData({
                          student_id: n.student_id,
                          student_name: n.student_name, // أضفنا الاسم هنا
                          title: `متابعة: ${n.behavior_type || 'سلوك تلميذ'}`,
                          description: `بناءً على ملاحظة المعلم ${n.teacher_name}: ${n.description}`,
                          severity_level: n.severity
                        });
                        setShowAddCaseModal(true);
                        if (students.length === 0) loadStudents(); // التأكد من تحميل القائمة
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="فتح حالة نفسية لمتابعة هذا التلميذ"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedConversation({ contact_id: n.teacher_id, contact_name: n.teacher_name });
                        setActiveTab('chat');
                        window.history.pushState({}, '', '/counselor/chat');
                      }}
                      className="p-2 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                      title="مراسلة المعلم للاستفسار"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // و. مكون مراقبة تقارير المعلمين
  const TeacherReportsMonitoring = () => {
    return (
      <div className="p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
              مراقبة تقارير المعلمين
            </h2>
            <p className="text-gray-500 mt-1 font-medium">عرض التقارير التي يرسلها المعلمون لأولياء الأمور للوقوف على الحالة التعليمية والسلوكية.</p>
          </div>
          <button 
            onClick={loadAllReports} 
            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all shadow-sm"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loadingAllReports ? 'animate-spin' : ''}`} />
            تحديث التقارير
          </button>
        </div>

        {loadingAllReports ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <div className="animate-spin text-4xl mb-4 text-indigo-600">⌛</div>
            <span className="text-xs font-black uppercase tracking-widest">جاري جلب التقارير...</span>
          </div>
        ) : allReports.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
            <div className="text-6xl mb-6 opacity-20 grayscale">📄</div>
            <h3 className="text-xl font-bold text-gray-800">لا توجد تقارير مسجلة</h3>
            <p className="text-gray-500 mt-2 max-w-sm">لم يقم المعلمون بإرسال أي تقارير مؤخراً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allReports.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 opacity-10 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{r.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded">{r.student_name}</span>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{r.report_type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-xl">
                    {new Date(r.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                
                <div className="bg-gray-50/50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    {r.content}
                  </p>
                </div>

                {r.recommendations && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-xs text-amber-800 italic">
                    <span className="font-bold not-italic block mb-1">💡 التوصيات:</span>
                    {r.recommendations}
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase mb-0.5">الكاتب</span>
                    <span className="text-xs font-bold text-gray-800">{r.author_name}</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setNewCaseData({
                        student_id: r.student_id,
                        student_name: r.student_name, // أضفنا الاسم هنا
                        title: `متابعة تقرير: ${r.title}`,
                        description: `بناءً على تقرير المعلم ${r.author_name}: ${r.content}`,
                        severity_level: 2
                      });
                      setShowAddCaseModal(true);
                      if (students.length === 0) loadStudents(); // التأكد من تحميل القائمة
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    فتح حالة متابعة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Stats Component
  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {[
        { label: 'إجمالي الحالات', key: 'total_cases', color: 'blue', icon: '📁' },
        { label: 'مفتوحة', key: 'open_cases', color: 'red', icon: '🔓' },
        { label: 'قيد المتابعة', key: 'in_progress_cases', color: 'amber', icon: '⏳' },
        { label: 'عاجلة', key: 'urgent_cases', color: 'rose', icon: '🚨' },
        { label: 'مغلقة', key: 'closed_cases', color: 'green', icon: '✅' },
      ].map((it) => (
        <div key={it.key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-xl bg-${it.color}-50 text-xl`}>{it.icon}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${it.color}-50 text-${it.color}-600`}>
              {loadingStats ? '...' : (stats?.[it.key] ?? 0)}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-500">{it.label}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            مرحباً بك، <span className="text-blue-600">أيها المستشار</span> 👋
          </h1>
          <p className="mt-2 text-gray-600 font-medium">
            إليك نظرة سريعة على ما يحتاج إلى اهتمامك اليوم.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { loadStats(); loadCases(); loadSessionRequests(); }} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm" title="تحديث الكل">
            🔄
          </button>
          <div className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'cases', label: 'الحالات النفسية', icon: DocumentTextIcon },
          { id: 'teacher-notes', label: 'ملاحظات المعلمين', icon: ClipboardDocumentListIcon },
          { id: 'teacher-reports', label: 'تقارير المعلمين', icon: DocumentIcon },
          { id: 'requests', label: 'طلبات الجلسات', icon: ClockIcon },
          { id: 'chat', label: 'الدردشة', icon: ChatBubbleLeftRightIcon },
          { id: 'advices', label: 'نصائح وتوصيات', icon: LightBulbIcon },
          { id: 'progress', label: 'متابعة التقدم', icon: ChartBarIcon },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              const base = '/counselor/';
              const pathMap = {
                'cases': 'cases',
                'teacher-notes': 'teacher-notes',
                'teacher-reports': 'teacher-reports',
                'requests': 'sessions',
                'chat': 'chat',
                'advices': 'advices',
                'progress': 'progress'
              };
              window.history.pushState({}, '', base + pathMap[t.id]);
              setActiveTab(t.id);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap shadow-sm
              ${activeTab === t.id 
                ? 'bg-blue-600 text-white shadow-blue-200' 
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'text-white' : 'text-gray-400'}`} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden min-h-[600px]">
        
        {activeTab === 'teacher-notes' && <TeacherNotesMonitoring />}
         {activeTab === 'teacher-reports' && <TeacherReportsMonitoring />}
         {activeTab === 'progress' && <ProgressTracking />}
         
         {/* Cases View */}
         {activeTab === 'cases' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-[600px]">
             {/* Sidebar: List */}
             <div className="lg:col-span-4 border-l border-gray-100 bg-gray-50/30">
               <div className="p-6 border-b border-gray-100 bg-white">
                 <button
                   onClick={handleOpenAddCaseModal}
                   className="w-full mb-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                 >
                   <span>➕</span> فتح حالة نفسية جديدة
                 </button>
                 <div className="relative mb-4">
                   <input
                     value={caseQuery}
                     onChange={(e) => setCaseQuery(e.target.value)}
                     placeholder="ابحث عن حالة..."
                     className="w-full pl-4 pr-10 py-3 bg-gray-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                   />
                   <span className="absolute left-3 top-3.5 opacity-40">🔍</span>
                 </div>
                 <div className="flex gap-2">
                   <select
                     value={caseStatus}
                     onChange={(e) => setCaseStatus(e.target.value)}
                     className="flex-1 px-3 py-2 bg-gray-100 border-transparent rounded-xl text-sm outline-none"
                   >
                     <option value="">كل الحالات</option>
                     <option value="urgent">عاجلة</option>
                     <option value="open">مفتوحة</option>
                     <option value="in_progress">قيد المتابعة</option>
                     <option value="closed">مغلقة</option>
                   </select>
                 </div>
               </div>

               <div className="overflow-y-auto max-h-[500px] p-4 space-y-3 custom-scrollbar">
                 {loadingCases ? (
                   <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                     <div className="animate-spin text-2xl">⏳</div>
                     <span className="text-sm">جاري تحميل الحالات...</span>
                   </div>
                 ) : filteredCases.length === 0 ? (
                   <div className="text-center py-10 px-4 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                     <div className="text-4xl mb-2">📁</div>
                     <p className="text-gray-500 text-sm mb-4">لا توجد حالات مسجلة حالياً</p>
                     <button 
                        onClick={() => setActiveTab('teacher-notes')}
                        className="text-xs font-bold text-blue-600 hover:underline"
                     >
                        💡 تحقق من ملاحظات المعلمين لفتح حالة
                     </button>
                   </div>
                 ) : (
                  filteredCases.map((c) => {
                    const meta = statusMeta[c.status] || { label: c.status, color: 'bg-gray-500' };
                    const active = selectedCaseId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCaseId(c.id)}
                        className={`w-full text-right p-4 rounded-2xl transition-all duration-300 border-2 relative overflow-hidden
                          ${active 
                            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100 translate-x-1' 
                            : 'border-transparent bg-white hover:bg-gray-50 hover:border-gray-200'}`}
                      >
                        {!c.counselor_id && (
                          <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                            غير معينة
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg text-white ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {c.severity_level && `مستوى: ${c.severity_level}/5`}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1 truncate">{c.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>👦 {c.student_name}</span>
                          <span className="opacity-30">•</span>
                          <span>🏫 {c.class_name}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Content: Details */}
            <div className="lg:col-span-8 flex flex-col">
              {!selectedCaseId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
                  <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-6 animate-pulse">
                    👈
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">اختر حالة للمتابعة</h2>
                  <p className="text-gray-500 max-w-sm">
                    قم باختيار حالة من القائمة الجانبية لعرض كامل التفاصيل وإدارة جلسات المتابعة النفسية.
                  </p>
                </div>
              ) : (loadingCaseDetails || !selectedCase) ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="animate-spin text-4xl mb-4">⌛</div>
                  <p className="text-gray-500 font-medium">جاري تحميل تفاصيل الحالة...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedCase?.title}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusMeta[selectedCase?.status]?.color}`}>
                          {statusMeta[selectedCase?.status]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium flex items-center gap-2">
                          <AcademicCapIcon className="w-4 h-4" /> {selectedCase?.student_name}
                        </span>
                        <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium flex items-center gap-2">
                          <UserGroupIcon className="w-4 h-4" /> {selectedCase?.class_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link 
                        to="/counselor/advices" 
                        className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100 flex items-center gap-2"
                      >
                        <LightBulbIcon className="w-4 h-4" /> توجيه للأب
                      </Link>
                      <Link 
                        to="/counselor/chat" 
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" /> تواصل مع المعلم
                      </Link>
                      
                      {!selectedCase?.counselor_id ? (
                        <button
                          onClick={() => assignToMe(selectedCase?.id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 flex items-center gap-2"
                        >
                          🤝 استلام الحالة
                        </button>
                      ) : (
                        <select
                          value={selectedCase?.status}
                          onChange={(e) => updateCaseStatus(selectedCase?.id, e.target.value)}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="urgent">عاجلة 🚨</option>
                          <option value="open">مفتوحة 🔓</option>
                          <option value="in_progress">قيد المتابعة ⏳</option>
                          <option value="closed">مغلقة ✅</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50/50 rounded-2xl p-6 mb-8 border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5" /> وصف الحالة
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedCase?.description}
                    </p>
                  </div>

                  {/* Teacher Observations for this Student */}
                  <div className="mb-10">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                      ملاحظات المعلمين لهذا التلميذ
                    </h4>
                    {studentSpecificNotes.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm italic">لا توجد ملاحظات سلوكية مسجلة من المعلمين لهذا التلميذ.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentSpecificNotes.map((note) => (
                          <div key={note.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${note.is_positive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                {note.teacher_name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(note.created_at).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                            <h5 className="font-bold text-gray-800 mb-2">{note.behavior_type}</h5>
                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                              {note.description}
                            </p>
                            <div className="flex items-center gap-2">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < (note.severity || 0) ? (note.is_positive ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'}`}></div>
                              ))}
                              <span className="text-[10px] text-gray-400 mr-auto">مستوى الخطورة: {note.severity}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Sessions List */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                          الجلسات المنفذة
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600 font-bold">
                          {(selectedCase?.sessions || []).length} جلسات
                        </span>
                      </h4>
                      <div className="space-y-4">
                        {(selectedCase?.sessions || []).length === 0 ? (
                          <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm">لا توجد جلسات مسجلة بعد</p>
                          </div>
                        ) : (
                          selectedCase?.sessions?.map((s, idx) => (
                            <div key={s.id} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-blue-200 transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                  الجلسة #{selectedCase?.sessions?.length - idx}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(s.session_date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                                {s.notes}
                              </p>
                              {s.progress_assessment && (
                                <div className="mt-3 pt-3 border-t border-gray-50 flex items-start gap-2">
                                  <span className="text-xs font-bold text-green-600">التقييم:</span>
                                  <span className="text-xs text-gray-600 italic">{s.progress_assessment}</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Add Session Form */}
                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 h-fit sticky top-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>➕</span> إضافة جلسة جديدة
                      </h4>
                      <form onSubmit={addSession} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">تاريخ الجلسة</label>
                            <input
                              type="datetime-local"
                              value={newSession.session_date}
                              onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                              required
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">المدة (بالدقائق)</label>
                            <input
                              type="number"
                              min={5}
                              value={newSession.duration_minutes}
                              onChange={(e) => setNewSession({ ...newSession, duration_minutes: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">ملاحظات الجلسة</label>
                          <textarea
                            value={newSession.notes}
                            onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                            rows={3}
                            placeholder="ماذا حدث خلال الجلسة؟"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">تقييم التقدم</label>
                          <textarea
                            value={newSession.progress_assessment}
                            onChange={(e) => setNewSession({ ...newSession, progress_assessment: e.target.value })}
                            rows={2}
                            placeholder="كيف كان تجاوب التلميذ؟"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          />
                        </div>
                        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all">
                          حفظ الجلسة والمتابعة
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher Notes View (Feed) */}
        {activeTab === 'teacher-notes' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
                  ملاحظات المعلمين (التدفق المباشر)
                </h2>
                <p className="text-gray-500 mt-1 font-medium">آخر الملاحظات السلوكية التي تم تسجيلها من قبل المعلمين في المدرسة.</p>
              </div>
              <button 
                onClick={loadTeacherNotes} 
                className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-bold hover:bg-blue-100 transition-all shadow-sm"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loadingNotes ? 'animate-spin' : ''}`} />
                تحديث التدفق
              </button>
            </div>

            {loadingNotes ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <div className="animate-spin text-4xl mb-4">⌛</div>
                <span>جاري تحميل الملاحظات...</span>
              </div>
            ) : teacherNotes.length === 0 ? (
              <div className="flex flex-col items-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                <div className="text-6xl mb-6 opacity-20 grayscale">📝</div>
                <h3 className="text-xl font-bold text-gray-800">لا توجد ملاحظات حالياً</h3>
                <p className="text-gray-500 mt-2 max-w-sm text-center">بمجرد قيام المعلمين بتسجيل أي ملاحظة سلوكية حول التلاميذ، ستظهر هنا فوراً للمتابعة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {teacherNotes.map((note) => (
                  <div key={note.id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative group overflow-hidden">
                    <div className={`absolute top-0 right-0 w-2 h-full ${note.is_positive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                          {note.is_positive ? '🌟' : '⚠️'}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 leading-tight">{note.student_name}</h4>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{note.class_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {new Date(note.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl p-4 mb-5 border border-transparent group-hover:border-gray-100 transition-colors">
                      <div className="text-xs font-black text-gray-400 mb-2 uppercase flex items-center gap-1">
                        <ClipboardDocumentListIcon className="w-3.5 h-3.5" /> {note.behavior_type}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all">
                        {note.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">بواسطة المعلم</span>
                        <span className="text-xs font-bold text-gray-700">{note.teacher_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          to="/counselor/chat" 
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="تواصل مع المعلم"
                        >
                          <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        </Link>
                        <button 
                          className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                          title="فتح ملف التلميذ"
                        >
                          <AcademicCapIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests View */}
        {activeTab === 'requests' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📅 طلبات الجلسات الإرشادية</h2>
                <p className="text-gray-500 mt-1">طلبات جديدة من المعلمين وأولياء الأمور تحتاج إلى ردك.</p>
              </div>
              <button onClick={loadSessionRequests} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                تحديث القائمة
              </button>
            </div>

            {loadingRequests ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <div className="animate-spin text-4xl mb-4">⌛</div>
                <span>جاري تحميل الطلبات...</span>
              </div>
            ) : sessionRequests.length === 0 ? (
              <div className="flex flex-col items-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-800">لا توجد طلبات حالياً</h3>
                <p className="text-gray-500 mt-2">ستظهر هنا أي طلبات جلسات جديدة يتم إرسالها إليك.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sessionRequests.map((r) => (
                  <div key={r.id} className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl">👤</div>
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{r.requester_name}</h4>
                          <span className="text-[10px] font-bold text-blue-600 uppercase">مقدم الطلب</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">
                          {r.status === 'pending' ? 'قيد الانتظار' : r.status}
                        </span>
                        {(() => {
                          const pInfo = getPaymentStatusInfo(r.payment_status);
                          return (
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase ${pInfo.color}`}>
                              {pInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">👦 التلميذ:</span>
                        <span className="font-bold text-gray-700">{r.student_name}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 whitespace-nowrap">📝 السبب:</span>
                        <span className="text-gray-700 leading-relaxed">{r.reason}</span>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">التاريخ المفضل</span>
                        <span className="text-xs font-bold text-gray-800">
                          {r.preferred_date ? new Date(r.preferred_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : 'غير محدد'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => respondToSession(r.id, 'accepted')}
                        className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                      >
                        قبول ✅
                      </button>
                      <button
                        onClick={() => respondToSession(r.id, 'rejected')}
                        className="flex-1 py-3 bg-white border border-red-100 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all active:scale-95"
                      >
                        رفض ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat View */}
        {activeTab === 'chat' && (
          <ChatView />
        )}

        {/* Teacher Notes Monitoring View */}
        {activeTab === 'teacher-notes' && (
          <TeacherNotesMonitoring />
        )}

        {/* Advices View */}
        {activeTab === 'advices' && (
          <div className="p-8 md:p-12 flex flex-col items-center">
            <div className="max-w-2xl w-full">
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">💡</div>
                <h2 className="text-3xl font-bold text-gray-900">إرسال نصيحة تربوية</h2>
                <p className="text-gray-500 mt-2">شارك خبرتك مع أولياء الأمور للمساعدة في تحسين بيئة الطالب.</p>
              </div>

              <form onSubmit={sendAdvice} className="space-y-6 bg-gray-50/50 p-8 rounded-[40px] border border-gray-100 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-2">عنوان النصيحة</label>
                    <input
                      type="text"
                      value={newAdvice.title}
                      onChange={(e) => setNewAdvice({ ...newAdvice, title: e.target.value })}
                      required
                      placeholder="مثال: كيفية التعامل مع القلق قبل الامتحانات"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-2">الفئة</label>
                    <select
                      value={newAdvice.category}
                      onChange={(e) => setNewAdvice({ ...newAdvice, category: e.target.value })}
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    >
                      <option value="">بدون تحديد</option>
                      <option value="family">للأسرة 🏠</option>
                      <option value="school">للمدرسة 🏫</option>
                      <option value="general">عام 🌍</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-2">موجه إلى</label>
                    <div className="px-5 py-4 bg-gray-100 border border-transparent rounded-2xl text-sm font-bold text-gray-500 flex items-center gap-2">
                      <span>👥</span> أولياء الأمور
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-2">محتوى النصيحة</label>
                  <textarea
                    value={newAdvice.content}
                    onChange={(e) => setNewAdvice({ ...newAdvice, content: e.target.value })}
                    rows={8}
                    required
                    placeholder="اكتب نصيحتك هنا بشكل مفصل ومفيد..."
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingAdvice}
                  className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {sendingAdvice ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <span>إرسال النصيحة الآن</span>
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Progress Tracking View */}
        {activeTab === 'progress' && (
          <ProgressTracking />
        )}

        {/* Empty State for Analysis (Placeholder) */}
        {activeTab === 'analysis' && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 grayscale">
              🧪
            </div>
            <h3 className="text-xl font-bold text-gray-800">قيد التطوير</h3>
            <p className="text-gray-500 mt-2 max-w-xs">هذا القسم سيكون متاحاً قريباً لتوفير أدوات تحليل متقدمة.</p>
          </div>
        )}
      </div>

      {/* Add Case Modal */}
      {showAddCaseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="text-xl font-bold">فتح حالة نفسية جديدة</h3>
              <button onClick={() => setShowAddCaseModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={createNewCase} className="p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 mr-1">
                  <label className="block text-xs font-bold text-gray-500">التلميذ المستهدف</label>
                  {!newCaseData.student_name && (
                    <button 
                      type="button" 
                      onClick={loadStudents}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowPathIcon className={`w-3 h-3 ${loadingStudents ? 'animate-spin' : ''}`} />
                      تحديث القائمة
                    </button>
                  )}
                </div>

                {newCaseData.student_name ? (
                  <div className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                        {newCaseData.student_name[0]}
                      </div>
                      <span className="text-sm font-bold text-blue-900">{newCaseData.student_name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setNewCaseData({ ...newCaseData, student_id: '', student_name: '' })}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      تغيير التلميذ
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={newCaseData.student_id}
                    onChange={(e) => {
                      const selected = students.find(s => s.id == e.target.value);
                      setNewCaseData({ ...newCaseData, student_id: e.target.value, student_name: selected?.full_name || '' });
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                    disabled={loadingStudents}
                  >
                    <option value="">
                      {loadingStudents ? 'جاري تحميل قائمة التلاميذ...' : '-- اختر من قائمة التلاميذ --'}
                    </option>
                    {students.length > 0 ? (
                      students.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                      ))
                    ) : !loadingStudents && (
                      <option value="" disabled>لا يوجد تلاميذ مسجلين حالياً</option>
                    )}
                  </select>
                )}
                
                {students.length === 0 && !loadingStudents && !newCaseData.student_name && (
                  <p className="mt-2 text-[10px] text-amber-600 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100">
                    ⚠️ لم يتم العثور على تلاميذ. يرجى التأكد من إضافة تلاميذ للنظام من قبل الإدارة أولاً.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">عنوان الحالة</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: صعوبات تعلم، تنمر، قلق امتحانات..."
                  value={newCaseData.title}
                  onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">وصف تفصيلي</label>
                <textarea
                  required
                  rows={4}
                  placeholder="اشرح طبيعة الحالة والملاحظات الأولية..."
                  value={newCaseData.description}
                  onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">مستوى الخطورة (1-5)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={newCaseData.severity_level}
                    onChange={(e) => setNewCaseData({ ...newCaseData, severity_level: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-white
                    ${newCaseData.severity_level <= 2 ? 'bg-green-500' : newCaseData.severity_level <= 3 ? 'bg-amber-500' : 'bg-red-600'}`}>
                    {newCaseData.severity_level}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCaseModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                  فتح الحالة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Evaluation Modal */}
      {showQuickEvalModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-up border border-gray-100">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">📝</div>
                <div>
                  <h3 className="text-lg font-black">تقييم تقدم التلميذ</h3>
                  <p className="text-[10px] text-blue-100 opacity-80">تسجيل ملاحظة سريعة حول حالة التلميذ</p>
                </div>
              </div>
              <button onClick={() => setShowQuickEvalModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={submitQuickEval} className="p-8 space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-black text-blue-400 uppercase block mb-1">التلميذ</span>
                <span className="text-sm font-bold text-blue-900">{quickEvalData.student_name}</span>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-3 mr-1 tracking-widest">ما هو تقييمك لحالة التلميذ اليوم؟</label>
                <textarea
                  required
                  rows={5}
                  placeholder="مثال: يظهر التلميذ تحسناً ملحوظاً في التفاعل الاجتماعي، أو: يحتاج لمزيد من الدعم في ضبط النفس..."
                  value={quickEvalData.assessment}
                  onChange={(e) => setQuickEvalData({ ...quickEvalData, assessment: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickEvalModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all text-sm"
                >
                  حفظ التقييم ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorDashboard;