import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  FileText, 
  Plus, 
  ChevronRight,
  Menu,
  X,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { View, Class, Student, Subject } from "./types";
import { cn } from "./utils";
import Dashboard from "./components/Dashboard";
import ClassManager from "./components/ClassManager";
import StudentManager from "./components/StudentManager";
import SubjectManager from "./components/SubjectManager";
import AssessmentEntry from "./components/AssessmentEntry";
import Analytics from "./components/Analytics";
import Reporting from "./components/Reporting";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "Classes", icon: GraduationCap },
    { id: "subjects", label: "Subjects & DSKP", icon: BookOpen },
    { id: "assessment", label: "Daily Assessment", icon: ClipboardCheck },
    { id: "analytics", label: "Tracking", icon: BarChart3 },
    { id: "reports", label: "Reporting", icon: FileText },
  ];

  const renderView = () => {
    switch (currentView) {
      case "dashboard": return <Dashboard onSelectClass={(c) => { setSelectedClass(c); setCurrentView("students"); }} />;
      case "classes": return <ClassManager onSelectClass={(c) => { setSelectedClass(c); setCurrentView("students"); }} />;
      case "students": return selectedClass ? <StudentManager classData={selectedClass} /> : <ClassManager onSelectClass={(c) => { setSelectedClass(c); setCurrentView("students"); }} />;
      case "subjects": return selectedClass ? <SubjectManager classData={selectedClass} /> : <ClassManager onSelectClass={(c) => { setSelectedClass(c); setCurrentView("subjects"); }} />;
      case "assessment": return <AssessmentEntry />;
      case "analytics": return <Analytics />;
      case "reports": return <Reporting />;
      default: return <Dashboard onSelectClass={(c) => { setSelectedClass(c); setCurrentView("students"); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-stone-900 text-stone-100 flex-shrink-0 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-stone-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="text-white w-5 h-5" />
          </div>
          {isSidebarOpen && <h1 className="font-bold text-lg tracking-tight truncate">PBD Tracker</h1>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                currentView === item.id 
                  ? "bg-emerald-500 text-white" 
                  : "hover:bg-stone-800 text-stone-400 hover:text-stone-100"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-stone-800 rounded-lg text-stone-400"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-stone-500">
            <span className="text-sm font-medium uppercase tracking-wider">
              {navItems.find(n => n.id === currentView)?.label}
            </span>
            {selectedClass && (currentView === "students" || currentView === "subjects") && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-stone-900 font-semibold">{selectedClass.year} {selectedClass.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-stone-900">Teacher Account</p>
              <p className="text-xs text-stone-500">Active Session</p>
            </div>
            <div className="w-10 h-10 bg-stone-200 rounded-full border border-stone-300 flex items-center justify-center">
              <Users className="w-5 h-5 text-stone-500" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView + (selectedClass?.id || "")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
