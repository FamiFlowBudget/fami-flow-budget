
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import Budgets from './pages/Budgets';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Family from './pages/Family';
import Reports from './pages/Reports';
import Import from './pages/Import';
import TripPlanner from './pages/TripPlanner';
import Achievements from './pages/Achievements';
import FAQ from './pages/FAQ';
import AddExpenseModal from './components/AddExpenseModal';
import AddBudgetModal from './components/AddBudgetModal';
import EditExpenseModal from './components/EditExpenseModal';
import EditBudgetModal from './components/EditBudgetModal';
import AddCategoryModal from './components/AddCategoryModal';
import EditCategoryModal from './components/EditCategoryModal';
import EditMemberModal from './components/EditMemberModal';
import AddMemberModal from './components/AddMemberModal';
import PhotoViewerModal from './components/PhotoViewerModal';
import AddAccountModal from './components/AddAccountModal';
import EditAccountModal from './components/EditAccountModal';
import PageGuide from './components/PageGuide';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import ConfirmProfile from './pages/ConfirmProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { Gasto, Presupuesto, Miembro, Categoria, Cuenta } from './types';

const MainAppView: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isExpenseEditModalOpen, setExpenseEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Gasto | null>(null);
  const [isBudgetEditModalOpen, setBudgetEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Presupuesto | null>(null);
  const [isCategoryEditModalOpen, setCategoryEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [isMemberEditModalOpen, setMemberEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Miembro | null>(null);
  const [isMemberAddModalOpen, setMemberAddModalOpen] = useState(false);
  const [isPhotoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoToView, setPhotoToView] = useState<string | null>(null);
  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [isAccountEditModalOpen, setAccountEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Cuenta | null>(null);
  
  // Tutorial State
  const [isTutorialManualOpen, setIsTutorialManualOpen] = useState(false);

  // Hooks for mobile/desktop detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to top on navigation change (Mobile only)
  useEffect(() => {
    if (isMobile) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, isMobile]);

  const handleEditExpense = (gasto: Gasto) => {
    setEditingExpense(gasto);
    setExpenseEditModalOpen(true);
  };

  const handleEditBudget = (presupuesto: Presupuesto) => {
    setEditingBudget(presupuesto);
    setBudgetEditModalOpen(true);
  };

  const handleEditCategory = (categoria: Categoria) => {
    setEditingCategory(categoria);
    setCategoryEditModalOpen(true);
  };
  
  const handleEditMember = (miembro: Miembro) => {
    setEditingMember(miembro);
    setMemberEditModalOpen(true);
  };

  const handleEditAccount = (cuenta: Cuenta) => {
    setEditingAccount(cuenta);
    setAccountEditModalOpen(true);
  };

  const openCategoryModal = () => setCategoryModalOpen(true);

  const handlePhotoClick = (photoUrl: string) => {
    setPhotoToView(photoUrl);
    setPhotoViewerOpen(true);
  };

  return (
    <>
      {/* Header: Modified to adapt to mobile dark theme */}
      <Header 
        onAddExpense={() => setExpenseModalOpen(true)} 
        onToggleSidebar={onToggleSidebar} 
        isMobile={isMobile}
        onOpenTutorial={() => setIsTutorialManualOpen(true)}
      />
      
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isMobile ? 'bg-[#09090b] min-h-[calc(100vh-80px)] pb-24 text-gray-100' : ''}`}>
        <div className="max-w-screen-xl mx-auto w-full">
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses onAddExpense={() => setExpenseModalOpen(true)} onEditExpense={handleEditExpense} />} />
                <Route path="/budget" element={<Budgets onAddBudget={() => setBudgetModalOpen(true)} onEditBudget={handleEditBudget} />} />
                <Route path="/accounts" element={<Accounts onAddAccount={() => setAccountModalOpen(true)} onEditAccount={handleEditAccount} />} />
                <Route path="/categories" element={<Categories onAddCategory={openCategoryModal} onEditCategory={handleEditCategory} />} />
                <Route path="/family" element={<Family onEditMember={handleEditMember} onAddMember={() => setMemberAddModalOpen(true)} onPhotoClick={handlePhotoClick} />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/import" element={<Import />} />
                <Route path="/trip-planner" element={<TripPlanner />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNav onAddExpense={() => setExpenseModalOpen(true)} />
      )}

      {/* Global Page Guide Tutorial */}
      <PageGuide 
        forceOpen={isTutorialManualOpen} 
        onCloseManual={() => setIsTutorialManualOpen(false)} 
      />

      {/* Modals */}
      <AddExpenseModal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} onAddCategory={openCategoryModal} />
      <AddBudgetModal isOpen={isBudgetModalOpen} onClose={() => setBudgetModalOpen(false)} onAddCategory={openCategoryModal} />
      <AddCategoryModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      <AddAccountModal isOpen={isAccountModalOpen} onClose={() => setAccountModalOpen(false)} />
      <EditExpenseModal isOpen={isExpenseEditModalOpen} onClose={() => setExpenseEditModalOpen(false)} expenseToEdit={editingExpense} />
      <EditBudgetModal isOpen={isBudgetEditModalOpen} onClose={() => setBudgetEditModalOpen(false)} budgetToEdit={editingBudget} />
      <EditCategoryModal isOpen={isCategoryEditModalOpen} onClose={() => setCategoryEditModalOpen(false)} categoryToEdit={editingCategory} />
      <EditAccountModal isOpen={isAccountEditModalOpen} onClose={() => setAccountEditModalOpen(false)} accountToEdit={editingAccount} />
      <EditMemberModal isOpen={isMemberEditModalOpen} onClose={() => setMemberEditModalOpen(false)} memberToEdit={editingMember} onPhotoClick={handlePhotoClick} />
      <AddMemberModal isOpen={isMemberAddModalOpen} onClose={() => setMemberAddModalOpen(false)} onPhotoClick={handlePhotoClick} />
      <PhotoViewerModal isOpen={isPhotoViewerOpen} onClose={() => setPhotoViewerOpen(false)} photoUrl={photoToView} />
    </>
  );
};

const ProtectedLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <DataProvider>
           <div className="flex min-h-screen relative">
              {/* Sidebar is HIDDEN on mobile in Stitch design, replaced by BottomNav */}
              {!isMobile && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}
              
              <div className={`flex-1 flex flex-col transition-colors duration-300 ${isMobile ? 'bg-[#09090b]' : 'bg-[var(--bg-secondary)]'}`}>
                 <MainAppView onToggleSidebar={() => setSidebarOpen(true)}/>
              </div>
            </div>
        </DataProvider>
      );
};

const AppRoutes: React.FC = () => {
  const { session, miembroProfile, loading, user } = useAuth();

  if (loading) {
    return (
       <div className="flex justify-center items-center h-screen w-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin" style={{ borderColor: 'var(--color-accent)' }}></div>
            <p className="mt-4 text-lg text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Public Routes available even when logged out
  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // Logged-in users who are new
  if (!miembroProfile) {
    const needsProfileConfirmation = !user?.user_metadata?.nombre || user.user_metadata.nombre === user.email;

    if (needsProfileConfirmation) {
      return (
        <Routes>
          <Route path="/confirm-profile" element={<ConfirmProfile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<Navigate to="/confirm-profile" replace />} />
        </Routes>
      );
    }
    
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Fully authenticated
  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
      <Route path="/confirm-profile" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
