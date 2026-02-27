import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Plus, Upload, FileText, Trash2, ChevronDown, ChevronUp, Edit3, ChevronRight, Sparkles, Loader2, Check, X } from "lucide-react";
import { Class, Subject, DSKPItem } from "../types";
import { parseDSKP, suggestDSKP } from "../services/geminiService";
import { cn } from "../utils";

interface SubjectManagerProps {
  classData: Class;
}

export default function SubjectManager({ classData }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [dskpItems, setDskpItems] = useState<DSKPItem[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isUploadingDSKP, setIsUploadingDSKP] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ sk: string; sp: string; selected: boolean }[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/classes/${classData.id}/subjects`).then(res => res.json()).then(setSubjects);
  }, [classData.id]);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/subjects/${selectedSubject.id}/dskp`).then(res => res.json()).then(setDskpItems);
    } else {
      setDskpItems([]);
    }
  }, [selectedSubject]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/classes/${classData.id}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubjectName }),
    });
    if (res.ok) {
      const data = await res.json();
      const newSub = { id: data.id, class_id: classData.id, name: newSubjectName };
      setSubjects([...subjects, newSub]);
      setNewSubjectName("");
      setIsAddingSubject(false);
      setSelectedSubject(newSub);
    }
  };

  const handleDSKPUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject) return;

    setIsUploadingDSKP(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        const items = await parseDSKP(base64, file.type);
        
        for (const item of items) {
          await fetch(`/api/subjects/${selectedSubject.id}/dskp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
        }
        
        // Refresh list
        const res = await fetch(`/api/subjects/${selectedSubject.id}/dskp`);
        const data = await res.json();
        setDskpItems(data);
        setIsUploadingDSKP(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("DSKP Parse Error:", error);
      setIsUploadingDSKP(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedSubject) return;
    setIsSuggesting(true);
    try {
      const suggestions = await suggestDSKP(selectedSubject.name, classData.year);
      setAiSuggestions(suggestions.map((s: any) => ({ ...s, selected: true })));
      setShowAiModal(true);
    } catch (error) {
      console.error("AI Suggestion Error:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddAiSuggestions = async () => {
    if (!selectedSubject) return;
    const toAdd = aiSuggestions.filter(s => s.selected);
    
    for (const item of toAdd) {
      await fetch(`/api/subjects/${selectedSubject.id}/dskp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sk: item.sk, sp: item.sp }),
      });
    }

    // Refresh list
    const res = await fetch(`/api/subjects/${selectedSubject.id}/dskp`);
    const data = await res.json();
    setDskpItems(data);
    setShowAiModal(false);
    setAiSuggestions([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Subjects Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900">Subjects</h2>
          <button 
            onClick={() => setIsAddingSubject(true)}
            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {isAddingSubject && (
          <form onSubmit={handleAddSubject} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <input
              autoFocus
              required
              type="text"
              placeholder="Subject Name (e.g. BM, English)"
              className="w-full p-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingSubject(false)} className="text-sm text-stone-500 px-3 py-1">Cancel</button>
              <button type="submit" className="text-sm bg-stone-900 text-white px-4 py-1 rounded-lg">Save</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                selectedSubject?.id === sub.id 
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md" 
                  : "bg-white text-stone-700 border-stone-200 hover:border-emerald-300"
              )}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={cn("w-5 h-5", selectedSubject?.id === sub.id ? "text-emerald-100" : "text-stone-400")} />
                <span className="font-bold">{sub.name}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4", selectedSubject?.id === sub.id ? "text-emerald-100" : "text-stone-300")} />
            </button>
          ))}
          {subjects.length === 0 && !isAddingSubject && (
            <p className="text-center py-8 text-stone-400 text-sm italic">No subjects added yet.</p>
          )}
        </div>
      </div>

      {/* DSKP Content */}
      <div className="lg:col-span-2 space-y-6">
        {selectedSubject ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-900">{selectedSubject.name} DSKP</h2>
                <p className="text-stone-500">Standard Kandungan & Pembelajaran</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAiSuggest}
                  disabled={isSuggesting || isUploadingDSKP}
                  className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-6 py-2 rounded-xl font-semibold hover:bg-emerald-200 transition-all shadow-sm disabled:opacity-50"
                >
                  {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isSuggesting ? "Thinking..." : "Suggest with AI"}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingDSKP || isSuggesting}
                  className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-stone-800 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingDSKP ? "Parsing DSKP..." : "Import DSKP (PDF)"}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleDSKPUpload} accept=".pdf" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">DSKP Structure</span>
                <span className="text-xs font-bold text-stone-400">{dskpItems.length} Items</span>
              </div>
              <div className="divide-y divide-stone-100">
                {dskpItems.map((item, idx) => (
                  <div key={item.id} className="p-6 hover:bg-stone-50 transition-colors group">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-mono text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-tighter mb-1">Standard Kandungan (SK)</p>
                          <p className="text-stone-900 font-semibold leading-relaxed">{item.sk}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-stone-100">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-tighter mb-1">Standard Pembelajaran (SP)</p>
                          <p className="text-stone-600 text-sm leading-relaxed">{item.sp}</p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                        <button className="p-2 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {dskpItems.length === 0 && !isUploadingDSKP && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-stone-400">No DSKP items found for this subject.</p>
                    <p className="text-stone-400 text-sm">Upload a PDF to auto-extract SK/SP items.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-stone-200 rounded-3xl bg-white/50">
            <BookOpen className="w-16 h-16 text-stone-200 mb-4" />
            <h3 className="text-xl font-bold text-stone-400">Select a Subject</h3>
            <p className="text-stone-400 max-w-xs">Choose a subject from the left panel to manage its DSKP standards.</p>
          </div>
        )}
      </div>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">AI Suggestions</h3>
                  <p className="text-sm text-emerald-700 font-medium">Based on {selectedSubject?.name} Year {classData.year}</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {aiSuggestions.map((suggestion, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    const newSuggestions = [...aiSuggestions];
                    newSuggestions[idx].selected = !newSuggestions[idx].selected;
                    setAiSuggestions(newSuggestions);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                    suggestion.selected 
                      ? "border-emerald-500 bg-emerald-50 shadow-sm" 
                      : "border-stone-100 bg-stone-50 hover:border-stone-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                      suggestion.selected ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-400"
                    )}>
                      {suggestion.selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Standard Kandungan</p>
                        <p className="text-stone-900 font-semibold">{suggestion.sk}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Standard Pembelajaran</p>
                        <p className="text-stone-600 text-sm">{suggestion.sp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowAiModal(false)} 
                className="px-6 py-2 text-stone-500 font-semibold hover:text-stone-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddAiSuggestions}
                className="bg-emerald-500 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Selected ({aiSuggestions.filter(s => s.selected).length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
