import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  Calendar, 
  Filter,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { Class, Student, Subject, Assessment } from "../types";
import { cn, TP_COLORS } from "../utils";

export default function Reporting() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetch(`/api/classes/${selectedClassId}/subjects`).then(res => res.json()).then(setSubjects);
      fetchData();
    }
  }, [selectedClassId, selectedSubjectId, selectedSkill]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClassId) params.append("class_id", selectedClassId);
    if (selectedSubjectId) params.append("subject_id", selectedSubjectId);
    if (selectedSkill) params.append("skill", selectedSkill);
    
    const res = await fetch(`/api/assessments?${params.toString()}`);
    const data = await res.json();
    setAssessments(data);
    setLoading(false);
  };

  const exportCSV = () => {
    if (assessments.length === 0) return;
    const headers = ["Student", "Subject", "SK", "SP", "TP Level", "Skills", "Note", "Timestamp"];
    
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, "\"\"")}"`;
      }
      return str;
    };

    const rows = assessments.map(a => [
      escapeCSV(a.student_name),
      escapeCSV(a.subject_name),
      escapeCSV(a.sk),
      escapeCSV(a.sp),
      escapeCSV(`TP${a.tp_level}`),
      escapeCSV(a.skills),
      escapeCSV(a.note),
      escapeCSV(new Date(a.timestamp).toLocaleString())
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `PBD_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Reporting & Export</h2>
          <p className="text-stone-500">Generate PBD reports and student portfolios.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold transition-all"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-md">
            <Printer className="w-5 h-5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Config */}
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3" /> Report Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select 
                className="p-3 rounded-xl border border-stone-100 bg-stone-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
              >
                <option value="">Select Class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.year} {c.name}</option>)}
              </select>
              <select 
                className="p-3 rounded-xl border border-stone-100 bg-stone-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select 
                className="p-3 rounded-xl border border-stone-100 bg-stone-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
              >
                <option value="">All Categories (Skills)</option>
                <option value="Reading">Reading</option>
                <option value="Writing">Writing</option>
                <option value="Listening">Listening</option>
                <option value="Speaking">Speaking</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Time Period
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="p-3 rounded-xl border border-stone-100 bg-stone-50 text-sm font-bold outline-none" />
              <input type="date" className="p-3 rounded-xl border border-stone-100 bg-stone-50 text-sm font-bold outline-none" />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-100">
          <h3 className="text-lg font-bold mb-6">Report Preview</h3>
          <div className="space-y-4">
            {assessments.map((a) => (
              <div key={a.id} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex gap-6 items-start group">
                <div className="w-16 h-16 bg-white rounded-xl border border-stone-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {a.evidence_url ? (
                    <img src={a.evidence_url} alt="Evidence" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-stone-200" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-stone-900">{a.student_name}</p>
                    <span className={cn("px-3 py-1 rounded-full text-xs font-black border", TP_COLORS[a.tp_level as keyof typeof TP_COLORS])}>
                      TP{a.tp_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-tighter">
                    <span>{a.subject_name}</span>
                    <span>•</span>
                    <span>{new Date(a.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-stone-600 line-clamp-2">
                    <span className="font-bold text-stone-900">Standard:</span> {a.sp}
                  </p>
                  {a.note && (
                    <p className="text-sm text-stone-500 italic">"{a.note}"</p>
                  )}
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-emerald-500 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {assessments.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-stone-100 rounded-3xl">
                <FileText className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400">No data available for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
