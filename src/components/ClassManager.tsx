import React, { useState, useEffect } from "react";
import { GraduationCap, Plus, Search, ChevronRight } from "lucide-react";
import { Class } from "../types";

interface ClassManagerProps {
  onSelectClass: (c: Class) => void;
}

export default function ClassManager({ onSelectClass }: ClassManagerProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newClass, setNewClass] = useState({ year: "", name: "", teacher_name: "" });

  useEffect(() => {
    fetch("/api/classes").then(res => res.json()).then(setClasses);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClass),
    });
    if (res.ok) {
      const data = await res.json();
      setClasses([...classes, { ...newClass, id: data.id }]);
      setIsAdding(false);
      setNewClass({ year: "", name: "", teacher_name: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-stone-900">Class Management</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add New Class
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-6">Create New Class</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-600 uppercase tracking-wider">Year / Level</label>
              <input
                required
                type="text"
                placeholder="e.g. Year 1, Form 4"
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newClass.year}
                onChange={e => setNewClass({ ...newClass, year: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-600 uppercase tracking-wider">Class Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Amanah, Creative"
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newClass.name}
                onChange={e => setNewClass({ ...newClass, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-600 uppercase tracking-wider">Teacher Name</label>
              <input
                required
                type="text"
                placeholder="Full Name"
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newClass.teacher_name}
                onChange={e => setNewClass({ ...newClass, teacher_name: e.target.value })}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 rounded-xl font-semibold text-stone-600 hover:bg-stone-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-md"
              >
                Save Class
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="bg-stone-100 text-stone-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                {c.year}
              </span>
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-1">{c.name}</h3>
            <p className="text-stone-500 text-sm mb-6">Teacher: {c.teacher_name}</p>
            <button
              onClick={() => onSelectClass(c)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 text-white font-semibold hover:bg-emerald-600 transition-all"
            >
              Manage Class
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
