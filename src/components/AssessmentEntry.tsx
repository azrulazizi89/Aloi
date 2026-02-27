import React, { useState, useEffect, useRef } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Target, 
  CheckCircle2, 
  Camera, 
  Upload, 
  Calendar,
  MessageSquare,
  History,
  ChevronRight,
  ChevronLeft,
  Save,
  Languages,
  X
} from "lucide-react";
import { Class, Student, Subject, DSKPItem } from "../types";
import { cn, TP_LEVELS, TP_COLORS, LANGUAGE_SKILLS } from "../utils";

export default function AssessmentEntry() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [dskpItems, setDskpItems] = useState<DSKPItem[]>([]);
  const [selectedDskp, setSelectedDskp] = useState<DSKPItem | null>(null);
  
  const [tpLevel, setTpLevel] = useState<number | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkAssessments, setBulkAssessments] = useState<Record<number, { tp: number; note: string; skills: string[]; evidence?: File; preview?: string }>>({});
  const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [capturingFor, setCapturingFor] = useState<number | 'individual' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [activeBulkStudentId, setActiveBulkStudentId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    fetch("/api/classes").then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetch(`/api/classes/${selectedClass.id}/students`).then(res => res.json()).then(setStudents);
      fetch(`/api/classes/${selectedClass.id}/subjects`).then(res => res.json()).then(setSubjects);
      setSelectedStudent(null);
      setSelectedSubject(null);
      setSelectedDskp(null);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/subjects/${selectedSubject.id}/dskp`).then(res => res.json()).then(setDskpItems);
      setSelectedDskp(null);
    }
  }, [selectedSubject]);

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isBulkMode && activeBulkStudentId) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBulkAssessments(prev => ({
            ...prev,
            [activeBulkStudentId]: {
              ...(prev[activeBulkStudentId] || { tp: 0, note: "" }),
              evidence: file,
              preview: reader.result as string
            }
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setEvidence(file);
        const reader = new FileReader();
        reader.onloadend = () => setEvidencePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const startCamera = async (target: number | 'individual' = 'individual') => {
    setCapturingFor(target);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCapturingFor(null);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturingFor(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && capturingFor) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });
            const reader = new FileReader();
            reader.onloadend = () => {
              if (capturingFor === 'individual') {
                setEvidence(file);
                setEvidencePreview(reader.result as string);
              } else {
                setBulkAssessments(prev => ({
                  ...prev,
                  [capturingFor]: {
                    ...(prev[capturingFor] || { tp: 0, note: "" }),
                    evidence: file,
                    preview: reader.result as string
                  }
                }));
              }
              stopCamera();
            };
            reader.readAsDataURL(file);
          }
        }, "image/jpeg");
      }
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedSubject || !selectedDskp || tpLevel === null) {
      alert("Please complete all required fields.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("student_id", selectedStudent.id.toString());
    formData.append("subject_id", selectedSubject.id.toString());
    formData.append("dskp_item_id", selectedDskp.id.toString());
    formData.append("tp_level", tpLevel.toString());
    formData.append("skills", selectedSkills.join(","));
    formData.append("note", note);
    formData.append("timestamp", new Date(assessmentDate).toISOString());
    if (evidence) formData.append("evidence", evidence);

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Reset entry fields but keep student/subject/dskp for next student if needed
        setTpLevel(null);
        setSelectedSkills([]);
        setNote("");
        setEvidence(null);
        setEvidencePreview(null);
        // Maybe move to next student automatically?
        const currentIndex = students.findIndex(s => s.id === selectedStudent.id);
        if (currentIndex < students.length - 1) {
          setSelectedStudent(students[currentIndex + 1]);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async () => {
    if (!selectedSubject || !selectedDskp) return;

    const assessmentsToSave = Object.entries(bulkAssessments)
      .filter(([_, data]) => (data as any).tp > 0)
      .map(([studentId, data]) => ({
        student_id: Number(studentId),
        tp_level: (data as any).tp,
        note: (data as any).note,
        skills: ((data as any).skills || []).join(","),
      }));

    if (assessmentsToSave.length === 0) {
      alert("No assessments to save.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("subject_id", selectedSubject.id.toString());
    formData.append("dskp_item_id", selectedDskp.id.toString());
    formData.append("timestamp", new Date(assessmentDate).toISOString());
    formData.append("assessments", JSON.stringify(assessmentsToSave));

    // Add files
    Object.entries(bulkAssessments).forEach(([studentId, data]) => {
      if ((data as any).evidence) {
        formData.append(`evidence_${studentId}`, (data as any).evidence);
      }
    });

    try {
      const res = await fetch("/api/assessments/bulk", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setBulkAssessments({});
        alert("Bulk assessment saved successfully!");
      }
    } catch (error) {
      console.error("Bulk save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Step Indicator / Selection Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Assessment Date
            </label>
            <input 
              type="date" 
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap className="w-3 h-3" /> 1. Select Class
            </label>
            <select 
              className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedClass?.id || ""}
              onChange={(e) => setSelectedClass(classes.find(c => c.id === Number(e.target.value)) || null)}
            >
              <option value="">Choose Class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.year} {c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> 2. Select Subject
            </label>
            <select 
              disabled={!selectedClass}
              className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              value={selectedSubject?.id || ""}
              onChange={(e) => setSelectedSubject(subjects.find(s => s.id === Number(e.target.value)) || null)}
            >
              <option value="">Choose Subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3" /> 3. Select SK/SP
            </label>
            <select 
              disabled={!selectedSubject}
              className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              value={selectedDskp?.id || ""}
              onChange={(e) => setSelectedDskp(dskpItems.find(d => d.id === Number(e.target.value)) || null)}
            >
              <option value="">Choose Standard...</option>
              {dskpItems.map(d => <option key={d.id} value={d.id}>{d.sk.substring(0, 40)}...</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedDskp && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex gap-4 items-start flex-1">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">Current Standard</p>
              <p className="text-stone-900 font-bold">{selectedDskp.sk}</p>
              <p className="text-stone-600 text-sm">{selectedDskp.sp}</p>
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-2xl border border-stone-200 flex gap-1 shadow-sm">
            <button
              onClick={() => setIsBulkMode(false)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                !isBulkMode ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600"
              )}
            >
              Individual
            </button>
            <button
              onClick={() => setIsBulkMode(true)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                isBulkMode ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600"
              )}
            >
              Bulk Mode
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {!isBulkMode ? (
          <>
            {/* Student Selector */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                <Users className="w-5 h-5 text-stone-400" />
                Students
              </h3>
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden max-h-[600px] overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 border-b border-stone-50 transition-all text-left",
                      selectedStudent?.id === student.id ? "bg-stone-900 text-white" : "hover:bg-stone-50"
                    )}
                  >
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-stone-200">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className={cn("w-5 h-5", selectedStudent?.id === student.id ? "text-stone-600" : "text-stone-400")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{student.name}</p>
                      <p className={cn("text-xs", selectedStudent?.id === student.id ? "text-stone-400" : "text-stone-500")}>
                        ID: {student.id.toString().padStart(4, '0')}
                      </p>
                    </div>
                    {selectedStudent?.id === student.id && <ChevronRight className="w-5 h-5 text-emerald-500" />}
                  </button>
                ))}
                {students.length === 0 && (
                  <div className="p-8 text-center text-stone-400 italic">Select a class first</div>
                )}
              </div>
            </div>

            {/* Assessment Entry Form */}
            <div className="lg:col-span-8 space-y-6">
              {selectedStudent ? (
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-stone-900">Assess: {selectedStudent.name}</h3>
                    <div className="flex items-center gap-2 text-stone-400">
                      <History className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Auto-timestamped</span>
                    </div>
                  </div>

                  {/* TP Level Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Mastery Level (TP1–TP6)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {TP_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setTpLevel(level)}
                          className={cn(
                            "h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all",
                            tpLevel === level 
                              ? "ring-4 ring-emerald-500/20 border-emerald-500 bg-emerald-50 text-emerald-700" 
                              : "border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200"
                          )}
                        >
                          <span className="text-2xl font-black">TP{level}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Skills (Optional) */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                      <Languages className="w-3 h-3" /> Skill Tagging (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_SKILLS.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={cn(
                            "px-4 py-2 rounded-full border text-sm font-bold transition-all",
                            selectedSkills.includes(skill)
                              ? "bg-stone-900 text-white border-stone-900"
                              : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                          )}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evidence & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                          <Camera className="w-3 h-3" /> Evidence
                        </label>
                        <div className="flex gap-2">
                          <button 
                            onClick={startCamera}
                            className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                          >
                            Use Camera
                          </button>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:underline"
                          >
                            Gallery
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => evidencePreview ? setEvidencePreview(null) : fileInputRef.current?.click()}
                        className="aspect-video rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative group"
                      >
                        {evidencePreview ? (
                          <>
                            <img src={evidencePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <p className="text-white font-bold text-sm">Remove Photo</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-stone-300 mb-2" />
                            <p className="text-xs font-bold text-stone-400 uppercase">Capture / Upload</p>
                          </>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleEvidenceChange} accept="image/*" />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Observation Note
                      </label>
                      <textarea
                        placeholder="Add a short note about student performance..."
                        className="w-full h-[140px] p-4 rounded-2xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                    <button 
                      onClick={() => {
                        const currentIndex = students.findIndex(s => s.id === selectedStudent.id);
                        if (currentIndex > 0) setSelectedStudent(students[currentIndex - 1]);
                      }}
                      disabled={students.findIndex(s => s.id === selectedStudent.id) === 0}
                      className="flex items-center gap-2 text-stone-400 hover:text-stone-900 font-bold disabled:opacity-0"
                    >
                      <ChevronLeft className="w-5 h-5" /> Previous
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={isSaving || tpLevel === null}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:shadow-none"
                    >
                      {isSaving ? "Saving..." : (
                        <>
                          <Save className="w-6 h-6" />
                          Submit Assessment
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => {
                        const currentIndex = students.findIndex(s => s.id === selectedStudent.id);
                        if (currentIndex < students.length - 1) setSelectedStudent(students[currentIndex + 1]);
                      }}
                      disabled={students.findIndex(s => s.id === selectedStudent.id) === students.length - 1}
                      className="flex items-center gap-2 text-stone-400 hover:text-stone-900 font-bold disabled:opacity-0"
                    >
                      Next <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-stone-200 rounded-3xl bg-white/50">
                  <Users className="w-16 h-16 text-stone-200 mb-4" />
                  <h3 className="text-xl font-bold text-stone-400">Select a Student</h3>
                  <p className="text-stone-400 max-w-xs">Pick a student from the list to begin assessment for the selected standard.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-stone-900">Bulk Assessment</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const firstData = bulkAssessments[students[0]?.id];
                      if (firstData) {
                        const newBulk = { ...bulkAssessments };
                        students.forEach(s => {
                          newBulk[s.id] = {
                            ...(newBulk[s.id] || { tp: 0, note: "", skills: [] }),
                            tp: firstData.tp
                          };
                        });
                        setBulkAssessments(newBulk);
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                  >
                    Apply first student's TP to all
                  </button>
                  <button
                    onClick={() => {
                      const firstData = bulkAssessments[students[0]?.id];
                      if (firstData && firstData.skills) {
                        const newBulk = { ...bulkAssessments };
                        students.forEach(s => {
                          newBulk[s.id] = {
                            ...(newBulk[s.id] || { tp: 0, note: "", skills: [] }),
                            skills: [...firstData.skills]
                          };
                        });
                        setBulkAssessments(newBulk);
                      }
                    }}
                    className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Apply first student's Skills to all
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50 text-xs font-bold text-stone-500 uppercase tracking-widest border-b border-stone-100">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Mastery Level (TP1–TP6)</th>
                      <th className="px-6 py-4">Skills</th>
                      <th className="px-6 py-4">Evidence & Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                              {student.photo_url ? (
                                <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <span className="font-bold text-stone-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {TP_LEVELS.map((level) => (
                              <button
                                key={level}
                                onClick={() => setBulkAssessments(prev => ({ 
                                  ...prev, 
                                  [student.id]: { 
                                    ...(prev[student.id] || { tp: 0, note: "", skills: [] }), 
                                    tp: level 
                                  } 
                                }))}
                                className={cn(
                                  "w-10 h-10 rounded-lg border-2 flex items-center justify-center font-black text-xs transition-all",
                                  bulkAssessments[student.id]?.tp === level
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200"
                                )}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {LANGUAGE_SKILLS.map((skill) => (
                              <button
                                key={skill}
                                onClick={() => {
                                  setBulkAssessments(prev => {
                                    const current = prev[student.id] || { tp: 0, note: "", skills: [] };
                                    const currentSkills = current.skills || [];
                                    const newSkills = currentSkills.includes(skill)
                                      ? currentSkills.filter(s => s !== skill)
                                      : [...currentSkills, skill];
                                    return {
                                      ...prev,
                                      [student.id]: { ...current, skills: newSkills }
                                    };
                                  });
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-md text-[10px] font-bold border transition-all",
                                  bulkAssessments[student.id]?.skills?.includes(skill)
                                    ? "bg-stone-900 text-white border-stone-900"
                                    : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
                                )}
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => startCamera(student.id)}
                                  className={cn(
                                    "p-2 rounded-lg border transition-all",
                                    bulkAssessments[student.id]?.preview ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-stone-50 border-stone-100 text-stone-400"
                                  )}
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setActiveBulkStudentId(student.id);
                                    bulkFileInputRef.current?.click();
                                  }}
                                  className={cn(
                                    "p-2 rounded-lg border transition-all",
                                    bulkAssessments[student.id]?.evidence ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-stone-50 border-stone-100 text-stone-400"
                                  )}
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                              </div>
                              {bulkAssessments[student.id]?.preview && (
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-stone-200">
                                  <img src={bulkAssessments[student.id]?.preview} className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => setBulkAssessments(prev => ({
                                      ...prev,
                                      [student.id]: { ...prev[student.id], evidence: undefined, preview: undefined }
                                    }))}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Add note..."
                              className="flex-1 p-2 text-sm rounded-lg border border-stone-100 bg-stone-50 outline-none focus:ring-1 focus:ring-emerald-500"
                              value={bulkAssessments[student.id]?.note || ""}
                              onChange={(e) => setBulkAssessments(prev => ({
                                ...prev,
                                [student.id]: {
                                  ...(prev[student.id] || { tp: 0, note: "", skills: [] }),
                                  note: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <input type="file" ref={bulkFileInputRef} className="hidden" onChange={handleEvidenceChange} accept="image/*" />

              <div className="pt-6 border-t border-stone-100 flex justify-end">
                <button
                  onClick={handleBulkSave}
                  disabled={isSaving || Object.keys(bulkAssessments).length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSaving ? "Saving..." : (
                    <>
                      <Save className="w-6 h-6" />
                      Save All Assessments
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {capturingFor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-bold">Capture Evidence</h3>
              <button onClick={stopCamera} className="p-2 hover:bg-stone-100 rounded-full"><X /></button>
            </div>
            <div className="aspect-video bg-stone-900 relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-6 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
              >
                <Camera className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
