import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Modal from "./Modal.jsx";
import VirtualCardManager from "./VirtualCardManager.jsx";
import ProfileSettings from "./ProfileSettings.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardLayout() {
  const { logout } = useAuth();
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0B0B] text-slate-800 dark:text-zinc-200 transition-colors duration-300 font-sans flex overflow-hidden">
      {/* Persistent Sidebar */}
      <Sidebar openModal={setActiveModal} onLogout={logout} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Placeholder / Integrated in Dashboard if needed, otherwise Outlet handles it */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <Outlet />
        </div>
      </div>

      {/* Global Modals maintained at layout level */}
      <Modal isOpen={activeModal === 'cards'} onClose={() => setActiveModal(null)} title="Virtual Card Management">
        <VirtualCardManager />
      </Modal>

      <Modal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="Account Settings">
        <ProfileSettings />
      </Modal>
    </div>
  );
}
