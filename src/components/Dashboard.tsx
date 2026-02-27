import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { GraduationCap, Users, BookOpen, ClipboardCheck, TrendingUp, ChevronRight } from "lucide-react";
import { Class } from "../types";
import { TP_COLORS, cn } from "../utils";

interface DashboardProps {
  onSelectClass: (c: Class) => void;
}

export default function Dashboard({ onSelectClass }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    fetch("/api/stats").then(res => res.json()).then(setStats);
    fetch("/api/classes").then(res => res.json()).then(setClasses);
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64 text-stone-400">Loading dashboard...</div>;

  const chartData = stats.tpDistribution.map((d: any) => ({
    name: `TP${d.tp_level}`,
    value: d.count,
    color: TP_COLORS[d.tp_level as keyof typeof TP_COLORS].split(" ")[0].replace("bg-", "#").replace("-100", "") // Rough conversion
  }));

  // Better color mapping for charts
  const COLORS = {
    TP1: "#ef4444",
    TP2: "#f97316",
    TP3: "#eab308",
    TP4: "#3b82f6",
    TP5: "#6366f1",
    TP6: "#10b981",
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Classes", value: stats.totalClasses, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Subjects", value: "Active", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Assessments", value: stats.tpDistribution.reduce((a: any, b: any) => a + b.count, 0), icon: ClipboardCheck, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TP Distribution Chart */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Mastery Level Distribution (TP1–TP6)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#ccc"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Registered Classes</h3>
          <div className="space-y-4">
            {classes.length === 0 ? (
              <p className="text-stone-400 text-center py-8">No classes registered yet.</p>
            ) : (
              classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectClass(c)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <GraduationCap className="w-5 h-5 text-stone-500 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{c.year} {c.name}</p>
                      <p className="text-xs text-stone-500">Teacher: {c.teacher_name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
