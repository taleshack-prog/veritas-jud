import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login      from './pages/Login.jsx';
import Register   from './pages/Register.jsx';
import Chat       from './pages/Chat.jsx';
import Cases      from './pages/Cases.jsx';
import CaseDetail from './pages/CaseDetail.jsx';
import Documents  from './pages/Documents.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Profile    from './pages/Profile.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index          element={<Chat />} />
            <Route path="cases"   element={<Cases />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="documents" element={<Documents />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
