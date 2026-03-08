import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Scan, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Users, 
  UserCog, 
  FileBarChart,
  Menu,
  X,
  Search,
  Plus,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Scanner from './pages/Scanner';
import CheckOut from './pages/CheckOut';
import CheckIn from './pages/CheckIn';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean, key?: string }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20" 
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")} />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/inventory", icon: Package, label: "Inventory" },
    { to: "/scan", icon: Scan, label: "Scan Equipment" },
    { to: "/checkout", icon: ArrowUpRight, label: "Check-Out" },
    { to: "/checkin", icon: ArrowDownLeft, label: "Check-In" },
    { to: "/transactions", icon: History, label: "Transactions" },
    { to: "/customers", icon: Users, label: "Customers" },
    { to: "/staff", icon: UserCog, label: "Staff" },
    { to: "/reports", icon: FileBarChart, label: "Reports" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F3] font-sans text-zinc-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-zinc-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CineWare</h1>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Warehouse Pro</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100">
          <Link 
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-200 group",
              location.pathname === "/settings" 
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20" 
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <SettingsIcon size={20} className={cn(location.pathname === "/settings" ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")} />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Package className="text-zinc-900" size={24} />
          <span className="font-bold">CineWare</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="lg:hidden fixed inset-0 bg-white z-40 pt-20 px-6"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl",
                    location.pathname === item.to ? "bg-zinc-900 text-white" : "text-zinc-600"
                  )}
                >
                  <item.icon size={24} />
                  <span className="font-semibold text-lg">{item.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 pt-24 lg:pt-10 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/checkout" element={<CheckOut />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
