import axios from 'axios';

const API = axios.create({
  baseURL: "https://nafsiaty-api.onrender.com/api",
});

// Request Interceptor
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => API.post('/auth/login', data),
    getProfile: () => API.get('/auth/profile'),
};

// Student API
export const studentAPI = {
    // ... الدوال الموجودة
    getAll: (params) => API.get('/students', { params }),
    getById: (id) => API.get(`/students/${id}`),
    getDashboard: (id) => API.get(`/students/${id}/dashboard`),
    getMyChildren: () => API.get('/students/my-children'),
    getMyStudents: () => API.get('/students/my-students'),
    
    // ➕ أضف هذه الدوال الجديدة
    createWithParent: (data) => API.post('/students', data),
    update: (id, data) => API.put(`/students/${id}`, data),
    delete: (id) => API.delete(`/students/${id}`),
    getAllStudents: () => API.get('/students/all'),
    getParentsList: () => API.get('/students/parents-list'),
};

// Cases API
export const caseAPI = {
    create: (data) => API.post('/cases', data),
    getAll: (params) => API.get('/cases', { params }),
    getMyCases: (params) => API.get('/cases/my-cases', { params }),
    getById: (id) => API.get(`/cases/${id}`),
    update: (id, data) => API.put(`/cases/${id}`, data),
    addSession: (caseId, data) => API.post(`/cases/${caseId}/sessions`, data),
    getStats: () => API.get('/cases/stats'),
};

// Reports API
export const reportAPI = {
    create: (data) => API.post('/reports', data),
    getAll: () => API.get('/reports/all'),
    getMyReports: () => API.get('/reports/my-reports'),
    getByStudent: (studentId) => API.get(`/reports/student/${studentId}`),
    markAsRead: (id) => API.put(`/reports/${id}/read`),
};

// Chat API
// Chat API
export const chatAPI = {
    send: (data) => API.post('/chat', data),
    getConversations: () => API.get('/chat/conversations'),
    
    // ✅ التصحيح هنا: استخدام المسار الصحيح الموجود في الـ Backend
    // الـ Backend يتوقع: /chat/conversation/:userId
    getMessages: (contactId, params) => 
        API.get(`/chat/conversation/${contactId}`, { params }),
        
    getConversation: (userId, params) => 
        API.get(`/chat/conversation/${userId}`, { params }),
    getUsersToChat: (search) => API.get('/chat/users-to-chat', { params: { search } }),
    getUnread: () => API.get('/chat/unread'),
    getSchoolContact: () => API.get('/chat/school-contact'),
    markAsRead: (messageId) => API.put(`/chat/read/${messageId}`),
};


// Admin API
export const adminAPI = {
    getDashboard: () => API.get('/admin/dashboard'),
    getUsers: () => API.get('/admin/users'),
    sendNotification: (data) => API.post('/admin/notifications', data),
    monitorMessages: () => API.get('/admin/monitor-messages'),
    getSettings: () => API.get('/admin/settings'),
    createUser: (data) => API.post('/admin/users', data),
    updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
    updateMessage: (id, data) => API.put(`/admin/messages/${id}`, data),
    deleteMessage: (id) => API.delete(`/admin/messages/${id}`),
    updateSetting: (key, data) => API.put(`/admin/settings/${key}`, data),

    // Groups
    getGroups: () => API.get('/admin/groups'),
    createGroup: (data) => API.post('/admin/groups', data),
    assignGroupStudents: (groupId, student_ids) => API.post(`/admin/groups/${groupId}/students`, { student_ids }),
    getTeachers: () => API.get('/admin/teachers'),
    assignGroupTeacher: (groupId, data) => API.post(`/admin/groups/${groupId}/teacher`, data),
};

// Advices API
export const adviceAPI = {
    getAll: () => API.get('/advices'),
    create: (data) => API.post('/advices', data),
};

// Behavioral Notes API
export const behavioralNoteAPI = {
    getAll: () => API.get('/behavioral-notes'),
    create: (data) => API.post('/behavioral-notes', data),
    getByStudent: (studentId) => API.get(`/behavioral-notes/student/${studentId}`),
};

// Session Requests API
export const sessionRequestAPI = {
    getMy: () => API.get('/session-requests/my'),
    create: (data) => API.post('/session-requests', data),
    respond: (id, data) => API.put(`/session-requests/${id}`, data),
};

// Payments API
export const paymentAPI = {
    process: (data) => API.post('/payments/process', data),
    getMy: () => API.get('/payments/my'),
    getAll: () => API.get('/payments/all'),
    getStats: () => API.get('/payments/stats'),
    verify: (id, status) => API.patch(`/payments/${id}/verify`, { status }),
};

export default API;