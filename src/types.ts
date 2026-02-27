export interface Class {
  id: number;
  year: string;
  name: string;
  teacher_name: string;
}

export interface Student {
  id: number;
  class_id: number;
  name: string;
  photo_url: string | null;
  notes: string;
}

export interface Subject {
  id: number;
  class_id: number;
  name: string;
}

export interface DSKPItem {
  id: number;
  subject_id: number;
  sk: string;
  sp: string;
}

export interface Assessment {
  id: number;
  student_id: number;
  subject_id: number;
  dskp_item_id: number;
  tp_level: number;
  skills: string;
  evidence_url: string | null;
  note: string;
  timestamp: string;
  student_name?: string;
  subject_name?: string;
  sk?: string;
  sp?: string;
}

export type View = "dashboard" | "classes" | "students" | "subjects" | "assessment" | "analytics" | "reports";
