import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell
} from "recharts";
import { 
  Filter, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target, 
  Calendar,
  ChevronRight,
  Search
} from "lucide-react";
import { Class, Student, Subject, Assessment } from "../types";
import { cn, TP_COLORS } from "../utils";

export default function Analytics() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetch(`/api/classes/${selectedClassId}/subjects`).then(res => res.json()).then(setSubjects);
      fetch(`/api/classes/${selectedClassId}/students`).then(res => res.json()).then(setStudents);
      setSelectedSubjectId("");
      setSelectedStudentId("");
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchData();
  }, [selectedClassId, selectedSubjectId, selectedStudentId, selectedSkill, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClassId) params.append("class_id", selectedClassId);
    if (selectedSubjectId) params.append("subject_id", selectedSubjectId);
    if (selectedStudentId) params.append("student_id", selectedStudentId);
    if (selectedSkill) params.append("skill", selectedSkill);
    if (searchQuery) params.append("search", searchQuery);
    
    const res = await fetch(`/api/assessments?${params.toString()}`);
    const data = await res.json();
    setAssessments(data);
    setLoading(false);
  };

  const tpDistribution = [1, 2, 3, 4, 5, 6].map(level => ({
    name: `TP${level}`,
    count: assessments.filter(a => a.tp_level === level).length,
    color: TP_COLORS[level as keyof typeof TP_COLORS].split(" ")[0].replace("bg-", "#").replace("-100", "")
  }));

  const timelineData = assessments
    .slice()
    .reverse()
    .map(a => ({
      date: new Date(a.timestamp).toLocaleDateString(),
      tp: a.tp_level,
      student: a.student_name,
      subject: a.subject_name
    }));

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3 text-stone-400">
          <Filter className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            className="p-3 rounded-xl border border-stone-100 bg-stone-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
          >
            <option value="">All Classes</option>
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
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            disabled={!selectedClassId}
          >
            <option value="">All Students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TP Distribution */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            TP Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tpDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {tpDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? entry.color : "#f1f5f9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {tpDistribution.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-bold text-stone-400 uppercase mb-1">{d.name}</p>
                <p className="text-xl font-black text-stone-900">{d.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline / Progress */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Mastery Timeline
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorTp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 6]} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="tp" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-xs text-stone-400 text-center italic">
            Showing progress over time for selected filters.
          </p>
        </div>

        {/* Recent Assessments Table */}
        <div className="lg:col-span-12 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-900">Recent Assessment Records</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search records..." 
                className="pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 text-xs font-bold text-stone-500 uppercase tracking-widest border-b border-stone-100">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Standard (SK/SP)</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-900">{a.student_name}</td>
                    <td className="px-6 py-4 text-sm text-stone-600">{a.subject_name}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs font-bold text-stone-400 truncate">{a.sk}</p>
                      <p className="text-sm text-stone-600 truncate">{a.sp}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-black border", TP_COLORS[a.tp_level as keyof typeof TP_COLORS])}>
                        TP{a.tp_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-400">{new Date(a.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {a.evidence_url ? (
                        <a href={a.evidence_url} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline text-xs font-bold">View</a>
                      ) : (
                        <span className="text-stone-300 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">No assessment records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
