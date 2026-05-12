import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ChatWindow = ({ contactId, contactName, studentId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // تحميل الرسائل عند فتح المحادثة
  useEffect(() => {
    if (contactId) {
      loadMessages();
      
      // إعداد التحديث التلقائي كل 5 ثوانٍ
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [contactId]);

  // التمرير تلقائياً لأسفل عند وصول رسائل جديدة
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // تم التعديل ليراقب طول المصفوفة

  const loadMessages = async () => {
    // لا نريد إظهار الـ loading في كل تحديث تلقائي لتجنب الوميض
    if (messages.length === 0) setLoading(true);
    try {
      const params = studentId ? { student_id: studentId } : {};
      const res = await chatAPI.getMessages(contactId, params);
      const fetchedMessages = res?.data?.data || [];
      
      // تحديث الرسائل فقط إذا كان هناك تغيير
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(fetchedMessages)) {
          return fetchedMessages;
        }
        return prev;
      });
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !contactId) return;

    const content = newMessage;
    setNewMessage('');
    setSending(true);
    try {
      const payload = {
        content: content,
        receiver_id: contactId,
      };
      
      if (studentId) {
        payload.student_id = studentId;
      }

      await chatAPI.send(payload);
      await loadMessages(); 
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(content); // استعادة الرسالة في حال الفشل
      alert('فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!contactId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-4">💬</div>
        <p className="font-bold text-gray-500">اختر جهة اتصال لبدء الدردشة</p>
        <p className="text-xs mt-1">تواصل مع المعلمين أو المستشارين بسهولة</p>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/50">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
              {contactName?.[0] || '👤'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{contactName}</h3>
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              متصل الآن
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadMessages} 
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 text-gray-400 hover:text-blue-600" 
            title="تحديث"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
            <span className="text-xs text-gray-400 font-medium">جاري تحميل المحادثة...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-3">✉️</div>
            <p className="text-sm font-medium">لا توجد رسائل بعد</p>
            <p className="text-[10px]">ابدأ المحادثة الآن!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[9px] text-gray-400 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span className={`text-[9px] ${msg.is_read ? 'text-blue-500' : 'text-gray-300'}`}>
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="اكتب رسالتك هنا..."
              className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-sm resize-none custom-scrollbar max-h-32"
              rows={1}
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex-shrink-0"
          >
            {sending ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5 transform rotate-[-45deg] mr-0.5" />
            )}
          </button>
        </form>
        <p className="text-[9px] text-gray-400 mt-2 text-center">اضغط Enter للإرسال، و Shift + Enter لسطر جديد</p>
      </div>
    </div>
  );
};


export default ChatWindow;