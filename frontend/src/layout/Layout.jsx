import React from "react";
import { Home, Users, Settings, Activity, LogOut } from "lucide-react"; // npm install lucide-react

const Sidebar = () => (
  <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed">
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-400">MediThon</h1>
    </div>

    <nav className="flex-1 px-4 space-y-2">
      <NavItem icon={<Home size={20} />} text="Dashboard" active />
      <NavItem icon={<Users size={20} />} text="Patients" />
      <NavItem icon={<Activity size={20} />} text="Analytics" />
      <NavItem icon={<Settings size={20} />} text="Settings" />
    </nav>

    <div className="p-4 border-t border-slate-800">
      <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full p-2">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  </div>
);

const NavItem = ({ icon, text, active }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
      active
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    {icon}
    <span className="font-medium">{text}</span>
  </div>
);

const Layout = ({ children }) => {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-slate-800">Overview</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Dr. Smith</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              DS
            </div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
