import React, { useState, useEffect, useRef } from "react";
import { Users, Plus, Upload, Camera, FileText, Trash2, Save, X, Check } from "lucide-react";
import { Class, Student } from "../types";
import { parseStudentList } from "../services/geminiService";

interface StudentManagerProps {
  classData: Class;
}

export default function StudentManager({ classData }: StudentManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newName, setNewName] = useState("");
  const [capturingStudentId, setCapturingStudentId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    fetch(`/api/classes/${classData.id}/students`).then(res => res.json()).then(setStudents);
  }, [classData.id]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/classes/${classData.id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, notes: "" }),
    });
    if (res.ok) {
      const data = await res.json();
      setStudents([...students, { id: data.id, class_id: classData.id, name: newName, photo_url: null, notes: "" }]);
      setNewName("");
      setIsAdding(false);
    }
  };

  const startCamera = async (studentId: number) => {
    setCapturingStudentId(studentId);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCapturingStudentId(null);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturingStudentId(null);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current && capturingStudentId) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append("photo", blob, "photo.jpg");
            const res = await fetch(`/api/students/${capturingStudentId}/photo`, {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              setStudents(students.map(s => s.id === capturingStudentId ? { ...s, photo_url: data.photo_url } : s));
              stopCamera();
            }
          }
        }, "image/jpeg");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        const names = await parseStudentList(base64, file.type);
        
        for (const name of names) {
          await fetch(`/api/classes/${classData.id}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, notes: "" }),
          });
        }
        
        // Refresh list
        const res = await fetch(`/api/classes/${classData.id}/students`);
        const data = await res.json();
        setStudents(data);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Student List</h2>
          <p className="text-stone-500">{classData.year} {classData.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl font-semibold transition-all"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Processing..." : "Import List (PDF/Image)"}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,image/*" />
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-lg">
          <form onSubmit={handleManualAdd} className="flex gap-4">
            <input
              autoFocus
              required
              type="text"
              placeholder="Enter student name"
              className="flex-1 p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button type="submit" className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold">Add</button>
            <button type="button" onClick={() => setIsAdding(false)} className="p-3 text-stone-400 hover:text-stone-600"><X /></button>
          </form>
        </div>
      )}

      {capturingStudentId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-bold">Take Student Photo</h3>
              <button onClick={stopCamera} className="p-2 hover:bg-stone-100 rounded-full"><X /></button>
            </div>
            <div className="aspect-square bg-stone-900 relative">
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

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Student Name</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Notes</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {students.map((s, i) => (
              <tr key={s.id} className="hover:bg-stone-50 transition-colors group">
                <td className="px-6 py-4 text-sm font-mono text-stone-400">#{s.id.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden border border-stone-200">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    <span className="font-bold text-stone-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-stone-500 italic">{s.notes || "No notes"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startCamera(s.id)}
                      className="p-2 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                  No students found. Add manually or import a list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
