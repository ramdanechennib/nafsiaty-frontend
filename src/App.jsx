import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './app.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="loading">⏳ جاري التحميل...</div>;
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={`/${user.role}`} />;
    }
    return children;
};

const Layout = ({ children }) => (
    <div className="app-layout">
        <div className="app-body">
            <Sidebar />
            <main className="app-content">
                {children}
            </main>
        </div>
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route
                    path="/parent/*"
                    element={
                        <ProtectedRoute allowedRoles={['parent']}>
                            <Layout><ParentDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/teacher/*"
                    element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                            <Layout><TeacherDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/counselor/*"
                    element={
                        <ProtectedRoute allowedRoles={['counselor']}>
                            <Layout><CounselorDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Layout><AdminDashboard /></Layout>
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;