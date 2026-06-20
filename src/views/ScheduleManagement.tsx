/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash, 
  Edit2, 
  AlertCircle, 
  Table, 
  Layers, 
  Sliders, 
  Play, 
  Trash2, 
  Check, 
  RefreshCw, 
  Sparkles, 
  CalendarDays, 
  Coffee, 
  Search, 
  Settings,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  Download,
  X,
  FileText,
  AlertTriangle,
  Move
} from 'lucide-react';
import { store } from '../dataStore';
import { ConferenceSession, Role, SpeakerRegistration, ConferenceShift, VirtualSection } from '../types';

// ==================== HELPER FUNCTIONS ====================

const SAMPLE_PAPERS: any[] = [];


function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.trim().split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

function isTimeOverlapping(s1: ConferenceSession, s2: ConferenceSession): boolean {
  if (s1.date !== s2.date) return false;
  const start1 = parseTimeToMinutes(s1.startTime);
  const end1 = parseTimeToMinutes(s1.endTime);
  const start2 = parseTimeToMinutes(s2.startTime);
  const end2 = parseTimeToMinutes(s2.endTime);
  return Math.max(start1, start2) < Math.min(end1, end2);
}

const isGenericSpeaker = (name: string): boolean => {
  const n = (name || '').trim().toLowerCase();
  return (
    n === '' ||
    n.includes('chưa gán') ||
    n.includes('chợ rẫy') ||
    n.includes('chủ tọa') ||
    n.includes('hội tiếp tân') ||
    n.includes('toàn thể') ||
    n.includes('hậu cần') ||
    n.includes('ban phục vụ') ||
    n.includes('ban hỗ trợ') ||
    n.includes('thư ký') ||
    n.includes('đại hội') ||
    n.includes('chuyên môn')
  );
};

interface ScheduleConflict {
  type: 'room' | 'speaker';
  key: string;
  message: string;
  sessions: ConferenceSession[];
}

function detectConflicts(sessionsList: ConferenceSession[]): ScheduleConflict[] {
  const result: ScheduleConflict[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < sessionsList.length; i++) {
    for (let j = i + 1; j < sessionsList.length; j++) {
      const s1 = sessionsList[i];
      const s2 = sessionsList[j];

      if (isTimeOverlapping(s1, s2)) {
        if (s1.roomName === s2.roomName) {
          const conflictKey = `room-${s1.date}-${s1.roomName}-${s1.startTime}-${s2.startTime}`;
          const reverseKey = `room-${s1.date}-${s1.roomName}-${s2.startTime}-${s1.startTime}`;
          if (!checked.has(conflictKey) && !checked.has(reverseKey)) {
            checked.add(conflictKey);
            result.push({
              type: 'room',
              key: conflictKey,
              message: `Hội trường "${s1.roomName}" bị trùng lịch ngày ${s1.date}: Các phiên "${s1.title}" (${s1.startTime} - ${s1.endTime}) và "${s2.title}" (${s2.startTime} - ${s2.endTime}) diễn ra đồng thời.`,
              sessions: [s1, s2]
            });
          }
        }

        if (
          s1.speakerName && 
          s2.speakerName && 
          s1.speakerName.trim().toLowerCase() === s2.speakerName.trim().toLowerCase() &&
          !isGenericSpeaker(s1.speakerName)
        ) {
          const conflictKey = `speaker-${s1.date}-${s1.speakerName.replace(/\s+/g, '')}-${s1.startTime}-${s2.startTime}`;
          const reverseKey = `speaker-${s1.date}-${s1.speakerName.replace(/\s+/g, '')}-${s2.startTime}-${s1.startTime}`;
          if (!checked.has(conflictKey) && !checked.has(reverseKey)) {
            checked.add(conflictKey);
            result.push({
              type: 'speaker',
              key: conflictKey,
              message: `Báo cáo viên "${s1.speakerName}" bị trùng lịch ngày ${s1.date}: Thuyết giảng cùng lúc tại "${s1.roomName}" (${s1.startTime} - ${s1.endTime}) và "${s2.roomName}" (${s2.startTime} - ${s2.endTime}).`,
              sessions: [s1, s2]
            });
          }
        }
      }
    }
  }
  return result;
}

const addMinutes = (rawTime: string, mins: number): string => {
  const [h, m] = rawTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + mins;
  const finalH = Math.floor(totalMinutes / 60) % 24;
  const finalM = totalMinutes % 60;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
};


// ==================== MAIN COMPONENT ====================

interface ScheduleManagementProps {
  role: Role;
}

export default function ScheduleManagement({ role }: ScheduleManagementProps) {
  // --- Core State ---
  const [sessions, setSessions] = useState<ConferenceSession[]>(store.getSessions());
  const [activeTab, setActiveTab] = useState<'wizard' | 'matrix'>('wizard');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchText, setSearchText] = useState('');

  // --- Dynamic Rooms ---
  const [rooms, setRooms] = useState<string[]>(() => store.getRooms());

  // --- Dynamic Dates ---
  const [dates, setDates] = useState<string[]>(() => store.getDates());

  // --- Dynamic Shifts (Buổi) ---
  const [shifts, setShifts] = useState<ConferenceShift[]>(() => store.getShifts());

  // --- Virtual Sections State ---
  const [virtualSections, setVirtualSections] = useState<VirtualSection[]>(() => store.getVirtualSections());

  // --- Selection States ---
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');

  // Set default selections
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates]);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomName) {
      setSelectedRoomName(rooms[0]);
    }
  }, [rooms]);

  // Sync state when data store completes fetching asynchronously
  useEffect(() => {
    const handleStoreChange = () => {
      setRooms(store.getRooms());
      setDates(store.getDates());
      setShifts(store.getShifts());
      setVirtualSections(store.getVirtualSections());
      setSessions(store.getSessions());
    };
    window.addEventListener('store-loaded', handleStoreChange);
    return () => {
      window.removeEventListener('store-loaded', handleStoreChange);
    };
  }, []);

  // --- Modal Forms State ---
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [editingRoomName, setEditingRoomName] = useState<string | null>(null);
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [newDateInput, setNewDateInput] = useState('2026-12-13');
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // --- Shifts Modals ---
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('12:00');

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTrackName, setSectionTrackName] = useState('');
  const [sectionBuoiId, setSectionBuoiId] = useState<string>('sang');
  const [sectionStartTime, setSectionStartTime] = useState('08:00');
  const [sectionEndTime, setSectionEndTime] = useState('09:30');
  const [sectionDescription, setSectionDescription] = useState('');

  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);
  const [activeSectionForAdd, setActiveSectionForAdd] = useState<VirtualSection | null>(null);
  const [presTitle, setPresTitle] = useState('');
  const [presSpeaker, setPresSpeaker] = useState('');
  const [presSpeakerTitle, setPresSpeakerTitle] = useState('');
  const [presStartTime, setPresStartTime] = useState('08:00');
  const [presEndTime, setPresEndTime] = useState('08:20');
  const [presSelectedSpeakerId, setPresSelectedSpeakerId] = useState<string>('manual');

  // --- Matrix Hover State ---
  const [dragOverCell, setDragOverCell] = useState<{ time: string; room: string } | null>(null);
  const [showConflictsDetail, setShowConflictsDetail] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportDate, setSelectedExportDate] = useState<string>('all');

  // --- Load Data ---
  const loadAll = () => {
    setSessions([...store.getSessions()]);
  };

  // --- Approved Speakers ---
  const approvedSpeakers = store.getSpeakers().filter(sp => sp.status === 'approved');
  const unscheduledSpeakers = approvedSpeakers.filter(sp => {
    return !sessions.some(s => s.title.includes(sp.presentationTitle) || s.speakerName.includes(sp.fullName));
  });

  const conflicts = detectConflicts(sessions);
  const conflictedSessionIds = new Set(conflicts.flatMap(c => c.sessions.map(s => s.id)));

  // --- Derived & Explicit Sections Combine Helper ---
  const getSectionsForCurrent = () => {
    const list = virtualSections.filter(s => s.date === selectedDate && s.roomName === selectedRoomName);
    
    // Check sessions in database and find any tracks not explicitly registered as virtual sections
    const currentSessions = sessions.filter(s => s.date === selectedDate && s.roomName === selectedRoomName);
    currentSessions.forEach(s => {
      // Find which shift this session belongs to based on its start time
      const sMins = parseTimeToMinutes(s.startTime);
      let matchedShiftId = shifts[0]?.id || 'sang';
      let closestDiff = Infinity;
      shifts.forEach(sh => {
        const shStart = parseTimeToMinutes(sh.startTime);
        const shEnd = parseTimeToMinutes(sh.endTime);
        if (sMins >= shStart && sMins <= shEnd) {
          matchedShiftId = sh.id;
          closestDiff = 0;
        } else {
          const diff = Math.min(Math.abs(sMins - shStart), Math.abs(sMins - shEnd));
          if (diff < closestDiff) {
            closestDiff = diff;
            matchedShiftId = sh.id;
          }
        }
      });

      const exists = list.some(sec => sec.trackName === s.track && (sec.buoiId === matchedShiftId || sec.buoi === matchedShiftId));
      if (!exists && s.track) {
        const trackSessions = currentSessions.filter(ts => {
          if (ts.track !== s.track) return false;
          const tsMins = parseTimeToMinutes(ts.startTime);
          let tsShiftId = shifts[0]?.id || 'sang';
          let tsClosestDiff = Infinity;
          shifts.forEach(sh => {
            const shStart = parseTimeToMinutes(sh.startTime);
            const shEnd = parseTimeToMinutes(sh.endTime);
            if (tsMins >= shStart && tsMins <= shEnd) {
              tsShiftId = sh.id;
              tsClosestDiff = 0;
            } else {
              const diff = Math.min(Math.abs(tsMins - shStart), Math.abs(tsMins - shEnd));
              if (diff < tsClosestDiff) {
                tsClosestDiff = diff;
                tsShiftId = sh.id;
              }
            }
          });
          return tsShiftId === matchedShiftId;
        });

        if (trackSessions.length > 0) {
          let minStart = s.startTime;
          let maxEnd = s.endTime;
          trackSessions.forEach(ts => {
            if (parseTimeToMinutes(ts.startTime) < parseTimeToMinutes(minStart)) minStart = ts.startTime;
            if (parseTimeToMinutes(ts.endTime) > parseTimeToMinutes(maxEnd)) maxEnd = ts.endTime;
          });
          
          list.push({
            id: `derived-${s.track.replace(/\s+/g, '')}-${matchedShiftId}`,
            date: selectedDate,
            roomName: selectedRoomName,
            trackName: s.track,
            buoiId: matchedShiftId,
            startTime: minStart,
            endTime: maxEnd,
            description: 'Khởi tạo tự động từ tệp bài báo cáo'
          });
        }
      }
    });
    
    // Support backward compatibility for loaded virtualSections
    return list.map(item => {
      if (!item.buoiId && item.buoi) {
        return {
          ...item,
          buoiId: item.buoi
        };
      }
      return item;
    }).sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  };

  // --- Handlers for Rooms ---
  const handleOpenEditRoom = (room: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setEditingRoomName(room);
    setNewRoomInput(room);
    setShowRoomModal(true);
  };

  const handleSaveRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'ctv') return;
    const rName = newRoomInput.trim();
    if (!rName) return;

    if (editingRoomName) {
      // Rename room
      if (rName !== editingRoomName && rooms.includes(rName)) {
        alert('Tên phòng này đã tồn tại.');
        return;
      }
      const oldRoom = editingRoomName;
      const updatedRooms = rooms.map(r => r === oldRoom ? rName : r);
      setRooms(updatedRooms);
      store.saveRooms(updatedRooms);
      store.deleteRoomFromDb(oldRoom); // Clean old room record on Supabase

      if (selectedRoomName === oldRoom) {
        setSelectedRoomName(rName);
      }

      // Rename in database sessions
      const currentSessions = store.getSessions();
      currentSessions.forEach(s => {
        if (s.roomName === oldRoom) {
          s.roomName = rName;
          store.saveSession(s);
        }
      });

      // Rename in virtual sections
      const updatedSections = virtualSections.map(sec => {
        if (sec.roomName === oldRoom) {
          const updatedSec = { ...sec, roomName: rName };
          store.saveVirtualSection(updatedSec);
          return updatedSec;
        }
        return sec;
      });
      setVirtualSections(updatedSections);

      loadAll();
      setSuccessMessage(`Đã đổi tên phòng "${oldRoom}" thành "${rName}" thành công!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setEditingRoomName(null);
    } else {
      // Add room
      if (rooms.includes(rName)) {
        alert('Tên phòng này đã tồn tại.');
        return;
      }
      const updatedRooms = [...rooms, rName];
      setRooms(updatedRooms);
      store.saveRooms(updatedRooms);
      setSelectedRoomName(rName);
      setSuccessMessage(`Đã thêm phòng hội nghị "${rName}" thành công!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
    setNewRoomInput('');
    setShowRoomModal(false);
  };

  const handleDeleteRoom = (room: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    if (rooms.length <= 1) {
      alert('Phải giữ lại ít nhất một phòng hội sảnh.');
      return;
    }

    const countSessions = sessions.filter(s => s.roomName === room).length;
    const countSections = virtualSections.filter(s => s.roomName === room).length;

    let confirmMsg = `Bạn có chắc chắn muốn xóa phòng "${room}"?`;
    if (countSessions > 0 || countSections > 0) {
      confirmMsg += `\nCảnh báo: Có ${countSessions} bài báo cáo và ${countSections} Section đang liên kết với phòng này. Chúng sẽ bị gỡ bỏ hoàn toàn.`;
    }

    if (window.confirm(confirmMsg)) {
      const updatedRooms = rooms.filter(r => r !== room);
      setRooms(updatedRooms);
      store.saveRooms(updatedRooms);
      store.deleteRoomFromDb(room);

      if (selectedRoomName === room) {
        setSelectedRoomName(updatedRooms[0]);
      }

      // Delete database sessions in this room
      const currentSessions = store.getSessions();
      currentSessions.forEach(s => {
        if (s.roomName === room) {
          store.deleteSession(s.id);
        }
      });

      // Filter out virtual sections in this room
      const updatedSections = virtualSections.filter(sec => {
        if (sec.roomName === room) {
          store.deleteVirtualSection(sec.id);
          return false;
        }
        return true;
      });
      setVirtualSections(updatedSections);

      loadAll();
      setSuccessMessage(`Đã xóa phòng hội sảnh "${room}"!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  // --- Handlers for Dates ---
  const handleOpenEditDate = (d: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setEditingDate(d);
    setNewDateInput(d);
    setShowDateModal(true);
  };

  const handleSaveDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'ctv') return;
    const dVal = newDateInput.trim();
    if (!dVal) return;

    if (editingDate) {
      // Rename date
      if (dVal !== editingDate && dates.includes(dVal)) {
        alert('Ngày này đã tồn tại.');
        return;
      }
      const oldDate = editingDate;
      const updatedDates = dates.map(d => d === oldDate ? dVal : d).sort();
      setDates(updatedDates);
      store.saveDates(updatedDates);
      store.deleteDateFromDb(oldDate); // Clean old date record on Supabase

      if (selectedDate === oldDate) {
        setSelectedDate(dVal);
      }

      // Rename in database sessions
      const currentSessions = store.getSessions();
      currentSessions.forEach(s => {
        if (s.date === oldDate) {
          s.date = dVal;
          store.saveSession(s);
        }
      });

      // Rename in virtual sections
      const updatedSections = virtualSections.map(sec => {
        if (sec.date === oldDate) {
          const updatedSec = { ...sec, date: dVal };
          store.saveVirtualSection(updatedSec);
          return updatedSec;
        }
        return sec;
      });
      setVirtualSections(updatedSections);

      loadAll();
      setSuccessMessage(`Đã đổi ngày tổ chức "${oldDate}" thành "${dVal}" thành công!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setEditingDate(null);
    } else {
      // Add date
      if (dates.includes(dVal)) {
        alert('Ngày này đã tồn tại.');
        return;
      }
      const updatedDates = [...dates, dVal].sort();
      setDates(updatedDates);
      store.saveDates(updatedDates);
      setSelectedDate(dVal);
      setSuccessMessage(`Đã thêm ngày tổ chức "${dVal}" thành công!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
    setShowDateModal(false);
  };

  const handleDeleteDate = (d: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    if (dates.length <= 1) {
      alert('Phải giữ lại ít nhất một ngày tổ chức.');
      return;
    }

    const countSessions = sessions.filter(s => s.date === d).length;
    const countSections = virtualSections.filter(s => s.date === d).length;

    let confirmMsg = `Bạn có chắc chắn muốn xóa ngày "${d}"?`;
    if (countSessions > 0 || countSections > 0) {
      confirmMsg += `\nCảnh báo: Có ${countSessions} bài báo cáo và ${countSections} Section đang liên kết với ngày này. Chúng sẽ bị gỡ bỏ hoàn toàn.`;
    }

    if (window.confirm(confirmMsg)) {
      const updatedDates = dates.filter(dateVal => dateVal !== d);
      setDates(updatedDates);
      store.saveDates(updatedDates);
      store.deleteDateFromDb(d);

      if (selectedDate === d) {
        setSelectedDate(updatedDates[0]);
      }

      // Delete database sessions in this date
      const currentSessions = store.getSessions();
      currentSessions.forEach(s => {
        if (s.date === d) {
          store.deleteSession(s.id);
        }
      });

      // Filter out virtual sections in this date
      const updatedSections = virtualSections.filter(sec => {
        if (sec.date === d) {
          store.deleteVirtualSection(sec.id);
          return false;
        }
        return true;
      });
      setVirtualSections(updatedSections);

      loadAll();
      setSuccessMessage(`Đã xóa ngày tổ chức "${d}"!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  // --- Handlers for Shifts (Buổi) ---
  const handleOpenAddShift = () => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setEditingShiftId(null);
    setShiftName('');
    setShiftStartTime('08:00');
    setShiftEndTime('12:00');
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (shift: ConferenceShift) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setEditingShiftId(shift.id);
    setShiftName(shift.name);
    setShiftStartTime(shift.startTime);
    setShiftEndTime(shift.endTime);
    setShowShiftModal(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) {
      alert('Vui lòng nhập tên buổi.');
      return;
    }

    if (editingShiftId) {
      // Editing
      const updatedShift = {
        id: editingShiftId,
        name: shiftName.trim(),
        startTime: shiftStartTime,
        endTime: shiftEndTime
      };
      setShifts(shifts.map(s => s.id === editingShiftId ? updatedShift : s));
      store.saveShift(updatedShift);
    } else {
      // Creating New
      const newShift: ConferenceShift = {
        id: `shift-${Math.floor(Math.random() * 900000 + 100000)}`,
        name: shiftName.trim(),
        startTime: shiftStartTime,
        endTime: shiftEndTime
      };
      setShifts([...shifts, newShift]);
      store.saveShift(newShift);
    }

    setShowShiftModal(false);
    setEditingShiftId(null);
    setSuccessMessage(`Đã cập nhật buổi "${shiftName}" thành công!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDeleteShift = (id: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    if (shifts.length <= 1) {
      alert('Phải giữ lại ít nhất một buổi hội thảo.');
      return;
    }
    const target = shifts.find(s => s.id === id);
    if (window.confirm(`Bạn có chắc chắn muốn xóa buổi "${target?.name || ''}"? Tất cả các Section liên kết trong buổi này sẽ bị gỡ bỏ.`)) {
      setShifts(shifts.filter(s => s.id !== id));
      store.deleteShift(id);
      // Clean sections associated
      const updatedSections = virtualSections.filter(s => {
        if (s.buoiId === id || s.buoi === id) {
          store.deleteVirtualSection(s.id);
          return false;
        }
        return true;
      });
      setVirtualSections(updatedSections);
    }
  };

  // --- Handlers for Sections ---
  const handleOpenAddSection = (buoiId: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    const activeShift = shifts.find(sh => sh.id === buoiId) || shifts[0];
    setEditingSectionId(null);
    setSectionTrackName('');
    setSectionBuoiId(buoiId);
    setSectionStartTime(activeShift?.startTime || '08:00');
    setSectionEndTime(activeShift ? addMinutes(activeShift.startTime, 90) : '09:30');
    setSectionDescription('');
    setShowSectionModal(true);
  };

  const handleOpenEditSection = (sec: VirtualSection) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setEditingSectionId(sec.id);
    setSectionTrackName(sec.trackName);
    setSectionBuoiId(sec.buoiId || sec.buoi || 'sang');
    setSectionStartTime(sec.startTime);
    setSectionEndTime(sec.endTime);
    setSectionDescription(sec.description || '');
    setShowSectionModal(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTrackName.trim()) {
      alert('Vui lòng nhập tên Section / Chuyên đề.');
      return;
    }

    if (editingSectionId) {
      // Editing
      const targetSec = virtualSections.find(s => s.id === editingSectionId);
      if (targetSec) {
        const oldTrack = targetSec.trackName;
        const updatedSec = {
          ...targetSec,
          trackName: sectionTrackName.trim(),
          buoiId: sectionBuoiId,
          startTime: sectionStartTime,
          endTime: sectionEndTime,
          description: sectionDescription
        };
        
        // Update Section Info
        setVirtualSections(virtualSections.map(s => s.id === editingSectionId ? updatedSec : s));
        store.saveVirtualSection(updatedSec);

        // Rename database sessions matching this section
        const currentSessions = store.getSessions();
        let count = 0;
        currentSessions.forEach(s => {
          if (s.date === selectedDate && s.roomName === selectedRoomName && s.track === oldTrack) {
            s.track = sectionTrackName.trim();
            store.saveSession(s);
            count++;
          }
        });
        if (count > 0) {
          loadAll();
        }
      }
    } else {
      // Creating New
      const newSec: VirtualSection = {
        id: `sec-${Math.floor(Math.random() * 900000 + 100000)}`,
        date: selectedDate,
        roomName: selectedRoomName,
        trackName: sectionTrackName.trim(),
        buoiId: sectionBuoiId,
        startTime: sectionStartTime,
        endTime: sectionEndTime,
        description: sectionDescription
      };
      setVirtualSections([...virtualSections, newSec]);
      store.saveVirtualSection(newSec);
    }

    setShowSectionModal(false);
    setEditingSectionId(null);
    setSuccessMessage(`Đã cập nhật chuyên đề "${sectionTrackName}" thành công!`);
    setTimeout(() => setSuccessMessage(''), 4050);
  };

  const handleDeleteSection = (sec: VirtualSection) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa Section "${sec.trackName}"? Thông tin cấu hình sẽ bị xóa.`)) {
      const deleteDbSessions = window.confirm(`Bạn có muốn xóa toàn bộ các bài báo cáo thuyết trình bên trong Section này không?\n\nChọn OK để xóa sạch, Chọn Cancel để giữ lại các bài thuyết trình.`);
      
      if (deleteDbSessions) {
        const currentSessions = store.getSessions();
        currentSessions.forEach(s => {
          if (s.date === selectedDate && s.roomName === selectedRoomName && s.track === sec.trackName) {
            store.deleteSession(s.id);
          }
        });
      }

      setVirtualSections(virtualSections.filter(s => s.id !== sec.id));
      store.deleteVirtualSection(sec.id);
      loadAll();
    }
  };

  // --- Handlers for Presentations inside Sections ---
  const handleOpenAddPresentation = (sec: VirtualSection) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setActiveSectionForAdd(sec);
    setEditingPresentationId(null);
    setPresTitle('');
    setPresSpeaker('');
    setPresSpeakerTitle('');
    setPresSelectedSpeakerId('manual');
    
    // Auto-calculate start time: either section start time, or after the last session in this section
    const currentSessions = sessions.filter(s => s.date === selectedDate && s.roomName === selectedRoomName && s.track === sec.trackName);
    if (currentSessions.length > 0) {
      // Find max end time
      const sorted = [...currentSessions].sort((a,b) => parseTimeToMinutes(b.endTime) - parseTimeToMinutes(a.endTime));
      setPresStartTime(sorted[0].endTime);
      setPresEndTime(addMinutes(sorted[0].endTime, 20));
    } else {
      setPresStartTime(sec.startTime);
      setPresEndTime(addMinutes(sec.startTime, 20));
    }
    
    setShowPresentationModal(true);
  };

  const handleOpenEditPresentation = (session: ConferenceSession, sec: VirtualSection) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    setActiveSectionForAdd(sec);
    setEditingPresentationId(session.id);
    setPresTitle(session.title);
    setPresSpeaker(session.speakerName);
    setPresSpeakerTitle(session.speakerTitle);
    setPresStartTime(session.startTime);
    setPresEndTime(session.endTime);
    
    // Check if matches any approved speakers
    const matchSp = approvedSpeakers.find(sp => sp.fullName === session.speakerName || sp.presentationTitle === session.title);
    setPresSelectedSpeakerId(matchSp ? matchSp.id : 'manual');
    
    setShowPresentationModal(true);
  };

  const handleSelectSpeakerChange = (id: string) => {
    setPresSelectedSpeakerId(id);
    if (id === 'manual') {
      setPresTitle('');
      setPresSpeaker('');
      setPresSpeakerTitle('');
    } else {
      const matchSp = approvedSpeakers.find(sp => sp.id === id);
      if (matchSp) {
        setPresTitle(matchSp.presentationTitle);
        setPresSpeaker(matchSp.fullName);
        setPresSpeakerTitle(matchSp.organization || '');
      }
    }
  };

  const handleSavePresentation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presTitle.trim() || !presSpeaker.trim()) {
      alert('Vui lòng điền tiêu đề bài báo cáo và tên báo cáo viên.');
      return;
    }
    if (!activeSectionForAdd) return;

    const sessionData: ConferenceSession = {
      id: editingPresentationId ? editingPresentationId : `SES-${Math.floor(Math.random() * 900000 + 100000)}`,
      title: presTitle.trim(),
      speakerName: presSpeaker.trim(),
      speakerTitle: presSpeakerTitle.trim(),
      roomName: selectedRoomName,
      date: selectedDate,
      startTime: presStartTime,
      endTime: presEndTime,
      track: activeSectionForAdd.trackName,
      description: `Bài thuyết trình báo cáo thuộc Chuyên đề: "${activeSectionForAdd.trackName}".`
    };

    // Check overlaps
    const testSessionsList = editingPresentationId 
      ? sessions.map(s => s.id === editingPresentationId ? sessionData : s)
      : [...sessions, sessionData];
    
    const overlapConflicts = detectConflicts(testSessionsList).filter(c => 
      c.sessions.some(s => s.id === sessionData.id)
    );

    if (overlapConflicts.length > 0) {
      const msgs = overlapConflicts.map(c => c.message).join('\n');
      const proceed = window.confirm(`⚠️ Cảnh báo trùng lặp thời gian/phòng:\n${msgs}\n\nBạn có muốn lưu lịch trùng lặp này không?`);
      if (!proceed) return;
    }

    store.saveSession(sessionData);

    // Update speaker reference
    if (presSelectedSpeakerId !== 'manual') {
      const sp = store.getSpeakers().find(s => s.id === presSelectedSpeakerId);
      if (sp) {
        sp.scheduledSessionId = sessionData.id;
        store.saveSpeaker(sp);
      }
    }

    setShowPresentationModal(false);
    setActiveSectionForAdd(null);
    setEditingPresentationId(null);
    loadAll();

    setSuccessMessage(`Đã lưu bài báo cáo "${presTitle.substring(0, 30)}..." thành công!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDeletePresentation = (id: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa bài báo cáo này khỏi lịch trình?')) {
      store.deleteSession(id);
      loadAll();
    }
  };

  // --- Drag and Drop on Section card ---
  const handleDropOnSection = (dragData: any, section: VirtualSection) => {
    if (role === 'ctv') {
      alert('Cộng tác viên không có quyền chỉnh sửa.');
      return;
    }

    let calculatedStart = section.startTime;
    const currentSessions = sessions.filter(s => s.date === selectedDate && s.roomName === selectedRoomName && s.track === section.trackName);
    if (currentSessions.length > 0) {
      const sorted = [...currentSessions].sort((a,b) => parseTimeToMinutes(b.endTime) - parseTimeToMinutes(a.endTime));
      calculatedStart = sorted[0].endTime;
    }
    const calculatedEnd = addMinutes(calculatedStart, dragData.duration || 20);

    const newSession: ConferenceSession = {
      id: `SES-DRG-${Math.floor(Math.random() * 900000 + 100000)}`,
      title: dragData.title,
      speakerName: dragData.speakerName,
      speakerTitle: dragData.speakerTitle || '',
      roomName: selectedRoomName,
      date: selectedDate,
      startTime: calculatedStart,
      endTime: calculatedEnd,
      track: section.trackName,
      description: `Bài thuyết trình báo cáo thuộc Chuyên đề: "${section.trackName}".`
    };

    store.saveSession(newSession);

    if (dragData.speakerId && !dragData.speakerId.startsWith('spk-sample')) {
      const sp = store.getSpeakers().find(s => s.id === dragData.speakerId);
      if (sp) {
        sp.scheduledSessionId = newSession.id;
        store.saveSpeaker(sp);
      }
    }

    loadAll();
    setSuccessMessage(`Đã gán thành công bài báo cáo "${dragData.title.substring(0, 30)}..." vào Section "${section.trackName}"!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // --- Drag & Drop for Matrix Grid Cells ---
  const handleDropOnMatrixCell = (dragData: any, time: string, room: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền chỉnh sửa.');
      return;
    }

    const dropDate = selectedDate === 'all' ? (dates[0] || '2026-12-11') : selectedDate;
    const duration = dragData.duration || 20;
    const calculatedEndTime = addMinutes(time, duration);

    if (dragData.type === 'unscheduled') {
      const newSession: ConferenceSession = {
        id: `SES-MAT-${Math.floor(Math.random() * 900000 + 100000)}`,
        title: dragData.title,
        speakerName: dragData.speakerName,
        speakerTitle: dragData.speakerTitle,
        roomName: room,
        date: dropDate,
        startTime: time,
        endTime: calculatedEndTime,
        track: dragData.track || 'Báo cáo khoa học',
        description: `Bài báo cáo khoa học của tác giả ${dragData.speakerName}.`
      };

      const testList = [...sessions, newSession];
      const dropConflicts = detectConflicts(testList).filter(c => c.sessions.some(s => s.id === newSession.id));
      if (dropConflicts.length > 0) {
        const proceed = window.confirm(`⚠️ Cảnh báo trùng lịch trình:\n${dropConflicts.map(c=>c.message).join('\n')}\n\nBạn có muốn đè chồng lịch không?`);
        if (!proceed) return;
      }

      store.saveSession(newSession);

      if (dragData.speakerId && !dragData.speakerId.startsWith('spk-sample')) {
        const sp = store.getSpeakers().find(s => s.id === dragData.speakerId);
        if (sp) {
          sp.scheduledSessionId = newSession.id;
          store.saveSpeaker(sp);
        }
      }
      loadAll();
    } else if (dragData.type === 'existing') {
      const targetSession = sessions.find(s => s.id === dragData.id);
      if (!targetSession) return;

      const originalDuration = parseTimeToMinutes(targetSession.endTime) - parseTimeToMinutes(targetSession.startTime);
      const updatedEndTime = addMinutes(time, originalDuration);

      const updatedSession: ConferenceSession = {
        ...targetSession,
        roomName: room,
        startTime: time,
        endTime: updatedEndTime
      };

      const testList = sessions.map(s => s.id === dragData.id ? updatedSession : s);
      const dropConflicts = detectConflicts(testList).filter(c => c.sessions.some(s => s.id === updatedSession.id));
      if (dropConflicts.length > 0) {
        const proceed = window.confirm(`⚠️ Cảnh báo trùng lịch trình khi di chuyển:\n${dropConflicts.map(c=>c.message).join('\n')}\n\nTiếp tục di chuyển?`);
        if (!proceed) return;
      }

      store.saveSession(updatedSession);
      loadAll();
    }
  };

  // (Automated Generator Engine removed)

  // --- Export Excel & PDF ---
  const handleExportCSV = () => {
    const list = sessions.filter(s => selectedDate === 'all' || s.date === selectedDate);
    const headers = ["ID", "Tiêu đề phiên báo cáo", "Phòng hội sảnh", "Ngày", "Khung giờ bắt đầu", "Khung giờ kết thúc", "Chuyên mục", "Báo cáo viên"];
    const rows = list.map(s => [
      s.id,
      s.title,
      s.roomName,
      s.date,
      s.startTime,
      s.endTime,
      s.track,
      s.speakerName
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `So-do-Lich-trinh-khoa-hoc-PARS-2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (dateFilter: string) => {
    const list = sessions.filter(s => dateFilter === 'all' || s.date === dateFilter)
      .sort((a,b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

    if (list.length === 0) {
      alert('Không có phiên làm việc nào thỏa mãn ngày đã chọn.');
      return;
    }

    const exportDates = dateFilter === 'all' ? Array.from(new Set(list.map(s => s.date))).sort() : [dateFilter];
    
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LỊCH TRÌNH CHÍNH THỨC - HỘI NGHỊ PARS 2026</title>
    <style>
        body { font-family: sans-serif; color: #0f172a; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; }
        th { background-color: #f8fafc; font-weight: bold; }
        .sig-block { margin-top: 50px; display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <div class="header">
        <h3>BAN TỔ CHỨC HỘI NGHỊ KHOA HỌC THẨM MỸ QUỐC TẾ PARS 2026</h3>
        <div class="title">LỊCH TRÌNH PHÂN BỔ BÁO CÁO KHOA HỌC CHÍNH THỨC</div>
    </div>`;

    exportDates.forEach(d => {
      const daySessions = list.filter(s => s.date === d);
      html += `<h4>NGÀY TỔ CHỨC: ${d}</h4>
      <table>
          <thead>
              <tr>
                  <th style="width: 15%;">Thời gian</th>
                  <th style="width: 20%;">Phòng hội sảnh</th>
                  <th style="width: 45%;">Tên đề tài / Phiên thảo luận</th>
                  <th style="width: 20%;">Báo cáo viên</th>
              </tr>
          </thead>
          <tbody>`;
      daySessions.forEach(s => {
        html += `<tr>
            <td><b>${s.startTime} - ${s.endTime}</b></td>
            <td>${s.roomName}</td>
            <td><b>${s.title}</b><br/><small>${s.track}</small></td>
            <td>${s.speakerName}</td>
        </tr>`;
      });
      html += `</tbody></table><br/><br/>`;
    });

    html += `<div class="sig-block">
        <div>ĐẠI DIỆN HỘI ĐỒNG KHOA HỌC<br/><br/><br/><b>GS.TS. Phạm Minh Chi</b></div>
        <div>TRƯỞNG BAN THƯ KÝ ĐẠI HỘI<br/><br/><br/><b>PGS.TS.BS. Trần Lê Hùng</b></div>
    </div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
</body>
</html>`;

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lich_Trinh_In_An_PARS_2026.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // --- Filtering ---
  const filteredWizardSessions = sessions.filter(s => {
    const matchText = s.title.toLowerCase().includes(searchText.toLowerCase()) || 
                      s.speakerName.toLowerCase().includes(searchText.toLowerCase()) ||
                      s.track.toLowerCase().includes(searchText.toLowerCase());
    return matchText;
  });

  const matrixSessions = sessions.filter(s => s.date === (selectedDate || dates[0]));
  const matrixRoomsSet: string[] = Array.from(new Set(matrixSessions.map(s => s.roomName))).sort() as string[];
  const matrixTimesSet: string[] = Array.from(new Set(matrixSessions.map(s => s.startTime))).sort() as string[];

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Dynamic Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-2xl flex items-start gap-3 shadow animate-fade-in">
          <div className="p-1 rounded bg-emerald-100 text-emerald-700 animate-bounce">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-extrabold text-xs">THÀNH CÔNG 🎉</h5>
            <p className="text-[11px] text-slate-650 font-medium leading-relaxed mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* 📊 METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-650">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Ngày hoạt động</span>
            <p className="text-sm font-black text-slate-900 mt-0.5">{dates.length} ngày chính</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-650">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Tổng số session</span>
            <p className="text-sm font-black text-slate-900 mt-0.5">{sessions.length} phiên đã xếp</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-650">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Giải lao Teabreak</span>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {sessions.filter(s => s.track.toLowerCase().includes('break') || s.track.toLowerCase().includes('tea')).length} phiên
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-650">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Hội sảnh / Phòng</span>
            <p className="text-sm font-black text-rose-800 mt-0.5">{rooms.length} phòng</p>
          </div>
        </div>
      </div>

      {/* ⚠️ CONFLICT BANNER */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-extrabold text-[9px] animate-pulse">CẢNH BÁO TRÙNG LỊCH</span>
              <p className="text-xs font-black">Phát hiện {conflicts.length} xung đột lịch trình sảnh hoặc báo cáo viên!</p>
            </div>
            <button
              onClick={() => setShowConflictsDetail(!showConflictsDetail)}
              className="text-[10px] uppercase font-extrabold hover:underline text-rose-700 bg-transparent border-none cursor-pointer"
            >
              {showConflictsDetail ? 'Thu gọn' : 'Xem chi tiết'}
            </button>
          </div>
          {showConflictsDetail && (
            <div className="p-3 bg-white/60 rounded-xl max-h-40 overflow-y-auto space-y-1 text-[11px] divide-y divide-rose-100">
              {conflicts.map((c, idx) => (
                <p key={idx} className="pt-1 first:pt-0">{c.message}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🎛️ NAVIGATION BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 self-start shrink-0">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`p-2 px-4 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all border-none cursor-pointer ${
              activeTab === 'wizard' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-605 hover:text-slate-800 bg-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Quản lý Lịch trình (Wizard)</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`p-2 px-4 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all border-none cursor-pointer ${
              activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-605 hover:text-slate-800 bg-transparent'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Sơ đồ Ma trận Grid</span>
          </button>

        </div>

        <div className="flex items-center gap-2 justify-end self-end">
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Xuất Lịch Trình</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* ═════════════════ TAB: WIZARD WORKSPACE ═════════════════ */}
      {activeTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: ROOMS, DATES & UNSCHEDULED PAPERS */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Rooms Management Panel */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h5 className="font-extrabold text-[10.5px] text-indigo-750 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  Quản lý Phòng sảnh
                </h5>
                {role !== 'ctv' && (
                  <button 
                    onClick={() => {
                      setEditingRoomName(null);
                      setNewRoomInput('');
                      setShowRoomModal(true);
                    }}
                    className="p-1 rounded bg-indigo-55 text-indigo-700 hover:bg-indigo-100 transition border-none cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rooms.map(room => (
                  <span 
                    key={room} 
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors select-none ${
                      selectedRoomName === room 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                    onClick={() => setSelectedRoomName(room)}
                  >
                    {room}
                    {role !== 'ctv' && (
                      <span className="flex items-center gap-1 ml-1 shrink-0">
                        <Edit2 
                          className={`w-2.5 h-2.5 cursor-pointer hover:text-indigo-300 ${
                            selectedRoomName === room ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditRoom(room);
                          }}
                        />
                        <X 
                          className={`w-2.5 h-2.5 rounded-full cursor-pointer hover:bg-rose-600 hover:text-white ${
                            selectedRoomName === room ? 'text-indigo-200' : 'text-slate-400'
                          }`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room);
                          }} 
                        />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Dates Management Panel */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h5 className="font-extrabold text-[10.5px] text-indigo-750 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Quản lý Ngày tổ chức
                </h5>
                {role !== 'ctv' && (
                  <button 
                    onClick={() => {
                      setEditingDate(null);
                      setNewDateInput('2026-12-13');
                      setShowDateModal(true);
                    }}
                    className="p-1 rounded bg-indigo-55 text-indigo-700 hover:bg-indigo-100 transition border-none cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dates.map(d => (
                  <span 
                    key={d} 
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors select-none ${
                      selectedDate === d 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                    onClick={() => setSelectedDate(d)}
                  >
                    {d}
                    {role !== 'ctv' && (
                      <span className="flex items-center gap-1 ml-1 shrink-0">
                        <Edit2 
                          className={`w-2.5 h-2.5 cursor-pointer hover:text-indigo-300 ${
                            selectedDate === d ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDate(d);
                          }}
                        />
                        <X 
                          className={`w-2.5 h-2.5 rounded-full cursor-pointer hover:bg-rose-600 hover:text-white ${
                            selectedDate === d ? 'text-indigo-200' : 'text-slate-400'
                          }`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDate(d);
                          }} 
                        />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Shifts Management Panel */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h5 className="font-extrabold text-[10.5px] text-indigo-750 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Quản lý Buổi hội thảo
                </h5>
                {role !== 'ctv' && (
                  <button 
                    onClick={handleOpenAddShift}
                    className="p-1 rounded bg-indigo-55 text-indigo-700 hover:bg-indigo-100 transition border-none cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {shifts.map(shift => (
                  <div 
                    key={shift.id} 
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-205 rounded-xl text-[10px] font-bold"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-800">{shift.name}</span>
                      <span className="text-slate-400 font-mono text-[9px] mt-0.5">{shift.startTime} - {shift.endTime}</span>
                    </div>
                    {role !== 'ctv' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEditShift(shift)}
                          className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-200 rounded border-none cursor-pointer bg-transparent transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded border-none cursor-pointer bg-transparent transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Unscheduled Papers List */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h5 className="font-extrabold text-[10.5px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  BÁO CÁO CHƯA XẾP LỊCH
                </h5>
                <span className="bg-indigo-100 text-indigo-800 text-[9px] px-2 py-0.5 rounded-full font-bold">
                  {unscheduledSpeakers.length + SAMPLE_PAPERS.length} bài
                </span>
              </div>
              
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm tên bài, báo cáo viên..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-[11px] focus:outline-none w-full"
                />
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {/* Real Approved Speakers */}
                {unscheduledSpeakers.filter(sp => 
                  sp.presentationTitle.toLowerCase().includes(searchText.toLowerCase()) ||
                  sp.fullName.toLowerCase().includes(searchText.toLowerCase())
                ).map(sp => (
                  <div
                    key={sp.id}
                    draggable={role !== 'ctv'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        speakerId: sp.id,
                        title: sp.presentationTitle,
                        speakerName: `${sp.title} ${sp.fullName}`,
                        speakerTitle: sp.organization || '',
                        duration: 20
                      }));
                    }}
                    className="p-3 bg-white border border-slate-205 hover:border-indigo-550 rounded-xl cursor-grab transition-all space-y-1 hover:shadow-sm"
                  >
                    <span className="inline-block px-1 bg-emerald-50 text-emerald-700 font-extrabold rounded text-[7.5px] uppercase">
                      Chính thức
                    </span>
                    <div className="text-[10.5px] font-extrabold text-slate-900 leading-snug">{sp.presentationTitle}</div>
                    <div className="text-[9px] text-slate-500">🗣️ {sp.title} {sp.fullName}</div>
                  </div>
                ))}

                {/* Sample Sandbox Papers */}
                {SAMPLE_PAPERS.filter(sp => 
                  sp.title.toLowerCase().includes(searchText.toLowerCase()) ||
                  sp.speakerName.toLowerCase().includes(searchText.toLowerCase())
                ).map(sp => (
                  <div
                    key={sp.id}
                    draggable={role !== 'ctv'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        speakerId: sp.id,
                        title: sp.title,
                        speakerName: sp.speakerName,
                        speakerTitle: sp.speakerTitle,
                        duration: 20
                      }));
                    }}
                    className="p-3 bg-white border border-dashed border-slate-200 hover:border-indigo-400 rounded-xl cursor-grab transition-all space-y-1 hover:shadow-xs"
                  >
                    <span className="inline-block px-1 bg-purple-50 text-purple-700 font-extrabold rounded text-[7.5px] uppercase">
                      Sandbox Mẫu
                    </span>
                    <div className="text-[10.5px] font-extrabold text-slate-855 leading-snug">{sp.title}</div>
                    <div className="text-[9px] text-slate-500">🗣️ {sp.speakerName}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MAIN TIMETABLE WIZARD */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Header selection info */}
            <div className="bg-indigo-900 text-white p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[9px] text-indigo-200 font-mono font-bold uppercase tracking-wider">Hội trường và Ngày đang lập lịch:</span>
                <h3 className="text-sm font-black uppercase mt-0.5">
                  🏥 {selectedRoomName} | 📅 Ngày {selectedDate}
                </h3>
              </div>
              {role !== 'ctv' && (
                <button
                  onClick={() => handleOpenAddSection(shifts[0]?.id || 'sang')}
                  className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-extrabold rounded-xl border-none cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-750" />
                  <span>Tạo Section / Chuyên đề</span>
                </button>
              )}
            </div>

            {/* Dynamic Shifts Panels */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {shifts.map(shift => {
                const shiftSections = getSectionsForCurrent().filter(sec => sec.buoiId === shift.id || sec.buoi === shift.id);
                return (
                  <div key={shift.id} className="bg-slate-50/50 p-5 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-250 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs shrink-0">
                          {shift.id === 'sang' ? '☀️' : shift.id === 'chieu' ? '🌙' : '✨'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase">{shift.name} ({shift.startTime} - {shift.endTime})</h4>
                          <p className="text-[9.5px] text-slate-400">Các chuyên đề và báo cáo khoa học</p>
                        </div>
                      </div>
                      {role !== 'ctv' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditShift(shift)}
                            className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-150 rounded border-none cursor-pointer bg-transparent transition-colors"
                            title="Sửa buổi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded border-none cursor-pointer bg-transparent transition-colors"
                            title="Xóa buổi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {shiftSections.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-[10.5px] text-slate-400 font-medium">
                          Chưa có Section nào trong buổi này.
                        </div>
                      ) : (
                        shiftSections.map(sec => {
                          const secSessions = sessions.filter(s => {
                            if (s.date !== selectedDate || s.roomName !== selectedRoomName || s.track !== sec.trackName) return false;
                            const sMins = parseTimeToMinutes(s.startTime);
                            let matchedShiftId = shifts[0]?.id || 'sang';
                            let closestDiff = Infinity;
                            shifts.forEach(sh => {
                              const shStart = parseTimeToMinutes(sh.startTime);
                              const shEnd = parseTimeToMinutes(sh.endTime);
                              if (sMins >= shStart && sMins <= shEnd) {
                                matchedShiftId = sh.id;
                                closestDiff = 0;
                              } else {
                                const diff = Math.min(Math.abs(sMins - shStart), Math.abs(sMins - shEnd));
                                if (diff < closestDiff) {
                                  closestDiff = diff;
                                  matchedShiftId = sh.id;
                                }
                              }
                            });
                            return matchedShiftId === shift.id;
                          });

                          return (
                            <div 
                              key={sec.id}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                try {
                                  const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                  handleDropOnSection(dragData, sec);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 relative group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[9.5px] bg-slate-900 text-slate-100 px-2 py-0.5 rounded font-bold">
                                      ⏱️ {sec.startTime} - {sec.endTime}
                                    </span>
                                  </div>
                                  <h5 className="font-extrabold text-slate-900 text-xs mt-1">{sec.trackName}</h5>
                                  {sec.description && <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">{sec.description}</p>}
                                </div>
                                
                                {role !== 'ctv' && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleOpenEditSection(sec)}
                                      className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded border-none cursor-pointer bg-transparent"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteSection(sec)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded border-none cursor-pointer bg-transparent"
                                      title="Xóa"
                                    >
                                      <Trash className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Presenters list inside Section */}
                              <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
                                {secSessions.length === 0 ? (
                                  <div className="p-4 text-center bg-slate-50 rounded-xl text-[9px] text-slate-400 font-bold border border-dashed border-slate-150">
                                    Kéo thả bài báo cáo vào đây hoặc nhấn Thêm
                                  </div>
                                ) : (
                                  secSessions.sort((a,b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)).map(s => {
                                    const isConflicted = conflictedSessionIds.has(s.id);
                                    return (
                                      <div 
                                        key={s.id}
                                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[10px] ${
                                          isConflicted ? 'bg-rose-50/20 border-rose-200' : 'bg-slate-50/50 border-slate-150'
                                        }`}
                                      >
                                        <div className="space-y-0.5 truncate flex-1">
                                          <div className="flex items-center gap-1 text-[8.5px] font-bold">
                                            <span className="font-mono text-indigo-600">{s.startTime} - {s.endTime}</span>
                                            {isConflicted && <span className="bg-rose-500 text-white rounded px-1 text-[7.5px] uppercase animate-pulse">Trùng lịch</span>}
                                          </div>
                                          <div className="font-extrabold text-slate-800 truncate" title={s.title}>{s.title}</div>
                                          <div className="text-slate-500 text-[9px] truncate">🗣️ {s.speakerName}</div>
                                        </div>
                                        {role !== 'ctv' && (
                                          <div className="flex shrink-0">
                                            <button 
                                              onClick={() => handleOpenEditPresentation(s, sec)}
                                              className="p-1 text-slate-400 hover:text-indigo-650 bg-transparent border-none cursor-pointer"
                                            >
                                              <Edit2 className="w-2.5 h-2.5" />
                                            </button>
                                            <button 
                                              onClick={() => handleDeletePresentation(s.id)}
                                              className="p-1 text-slate-400 hover:text-rose-600 bg-transparent border-none cursor-pointer"
                                            >
                                              <Trash className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Add Presentation button */}
                              {role !== 'ctv' && (
                                <button
                                  onClick={() => handleOpenAddPresentation(sec)}
                                  className="w-full py-1.5 border border-dashed border-slate-250 hover:border-slate-350 bg-slate-50 hover:bg-slate-100 rounded-xl text-[9.5px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 text-slate-400" /> Thêm bài thuyết trình
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {role !== 'ctv' && (
                      <button
                        onClick={() => handleOpenAddSection(shift.id)}
                        className="w-full py-2 bg-indigo-55 hover:bg-indigo-100 border border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo Section thuộc {shift.name}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* ═════════════════ TAB: MATRIX GRID ═════════════════ */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-tight">
                <Table className="w-4 h-4 text-indigo-600 animate-pulse" />
                Ma Trận Lịch Trình Hội Nghị (Phòng sảnh & Thời gian)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Kéo thả di chuyển nhanh lịch trình và đối soát mật độ phân chia hội trường.</p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-105 p-1 rounded-xl border border-slate-200">
              {dates.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`p-1 px-3 rounded-lg text-xs font-black transition-all border-none cursor-pointer ${
                    selectedDate === d ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  Ngày {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left sidebar drag list */}
            <div className="lg:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold text-slate-505 uppercase tracking-wider block">Bài báo cáo chưa xếp</span>
              <div className="max-h-[400px] overflow-y-auto space-y-2 scrollbar-thin">
                {unscheduledSpeakers.map(sp => (
                  <div
                    key={sp.id}
                    draggable={role !== 'ctv'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'unscheduled',
                        speakerId: sp.id,
                        title: sp.presentationTitle,
                        speakerName: `${sp.title} ${sp.fullName}`,
                        speakerTitle: sp.organization || '',
                        duration: 20
                      }));
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-indigo-500 rounded-xl cursor-grab transition-all"
                  >
                    <div className="text-[10.5px] font-extrabold text-slate-900 leading-snug">{sp.presentationTitle}</div>
                    <div className="text-[9px] text-slate-500 mt-1">🗣️ {sp.fullName}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix table Grid */}
            <div className="lg:col-span-9 overflow-x-auto rounded-2xl border border-slate-200 shadow-inner">
              <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 text-[10px] font-black uppercase border-b border-slate-800">
                    <th className="p-3 w-36 pl-5">Thời gian</th>
                    {matrixRoomsSet.map(room => (
                      <th key={room} className="p-3 border-l border-slate-800 text-center text-slate-50 font-extrabold">
                        {room}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px] font-medium text-slate-700">
                  {matrixTimesSet.map((time, idx) => {
                    const rowSessions = matrixSessions.filter(s => s.startTime === time);
                    const sample = rowSessions[0];
                    const interval = sample ? `${time} - ${sample.endTime}` : time;

                    return (
                      <tr key={time} className={`hover:bg-indigo-50/15 ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                        <td className="p-3 font-mono font-black text-slate-500 pl-5 bg-slate-50/50 border-r border-slate-200">
                          {interval}
                        </td>

                        {matrixRoomsSet.map(room => {
                          const match = rowSessions.find(s => s.roomName === room);
                          if (!match) {
                            const isHovered = dragOverCell?.time === time && dragOverCell?.room === room;
                            return (
                              <td
                                key={room}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (role !== 'ctv') setDragOverCell({ time, room });
                                }}
                                onDragLeave={() => setDragOverCell(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverCell(null);
                                  try {
                                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                    handleDropOnMatrixCell(dragData, time, room);
                                  } catch (err) { console.error(err); }
                                }}
                                className={`p-3 border-l border-slate-200 text-center text-[10px] italic transition-all ${
                                  isHovered ? 'bg-indigo-50 border-2 border-dashed border-indigo-400 text-indigo-700' : 'text-slate-300'
                                }`}
                              >
                                -- Trống --
                              </td>
                            );
                          }

                          const isConflicted = conflictedSessionIds.has(match.id);
                          return (
                            <td
                              key={room}
                              draggable={role !== 'ctv'}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', JSON.stringify({
                                  type: 'existing',
                                  id: match.id,
                                  title: match.title,
                                  speakerName: match.speakerName,
                                  speakerTitle: match.speakerTitle
                                }));
                              }}
                              className={`p-3 border-l border-slate-200 align-top transition-all cursor-grab active:cursor-grabbing hover:bg-slate-50 ${
                                isConflicted ? 'border-2 border-rose-400 bg-rose-50/20' : 'bg-white'
                              }`}
                            >
                              <div className="text-[10px] font-extrabold line-clamp-2 text-slate-900 leading-snug">{match.title}</div>
                              <div className="text-[8.5px] text-slate-400 truncate mt-1">🗣️ {match.speakerName}</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════ MODALS ═════════════════ */}

      {/* Add/Edit Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in">
            <div className="bg-indigo-900 p-5 text-white">
              <h4 className="font-extrabold text-sm uppercase">
                {editingRoomName ? 'Hiệu chỉnh Phòng Hội Sảnh' : 'Khởi tạo Phòng Hội Sảnh'}
              </h4>
            </div>
            <form onSubmit={handleSaveRoomSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {editingRoomName ? 'Tên phòng hội nghị *' : 'Tên phòng hội nghị mới *'}
                </label>
                <input
                  type="text"
                  required
                  value={newRoomInput}
                  onChange={(e) => setNewRoomInput(e.target.value)}
                  placeholder="ví dụ: Hội trường 5, Sảnh VIP B..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border-none cursor-pointer"
                >
                  {editingRoomName ? 'Lưu thay đổi' : 'Thêm phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in">
            <div className="bg-indigo-900 p-5 text-white">
              <h4 className="font-extrabold text-sm uppercase">
                {editingDate ? 'Hiệu chỉnh ngày hội nghị' : 'Khởi tạo ngày hội nghị'}
              </h4>
            </div>
            <form onSubmit={handleSaveDateSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {editingDate ? 'Chọn ngày *' : 'Chọn ngày mới *'}
                </label>
                <input
                  type="date"
                  required
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border-none cursor-pointer"
                >
                  {editingDate ? 'Lưu thay đổi' : 'Thêm ngày'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in">
            <div className="bg-indigo-900 p-5 text-white">
              <h4 className="font-extrabold text-sm uppercase">
                {editingShiftId ? 'Hiệu chỉnh buổi hội thảo' : 'Khởi tạo buổi hội thảo'}
              </h4>
            </div>
            <form onSubmit={handleSaveShift} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tên buổi mới *</label>
                <input
                  type="text"
                  required
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="ví dụ: Buổi Sáng, Buổi Chiều, Buổi Tối..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Bắt đầu (HH:MM) *</label>
                  <input
                    type="text"
                    required
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    placeholder="08:00"
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Kết thúc (HH:MM) *</label>
                  <input
                    type="text"
                    required
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    placeholder="12:00"
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border-none cursor-pointer"
                >
                  Lưu buổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in">
            <div className="bg-indigo-900 p-5 text-white">
              <h4 className="font-extrabold text-sm uppercase">
                {editingSectionId ? 'Hiệu chỉnh Chuyên đề / Section' : 'Khởi tạo Chuyên đề / Section mới'}
              </h4>
            </div>
            <form onSubmit={handleSaveSection} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tên Section / Chuyên mục *</label>
                <input
                  type="text"
                  required
                  value={sectionTrackName}
                  onChange={(e) => setSectionTrackName(e.target.value)}
                  placeholder="ví dụ: Phiên 1: Tạo hình mí mắt thẩm mỹ"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Thời điểm buổi *</label>
                  <select
                    value={sectionBuoiId}
                    onChange={(e: any) => {
                      const bId = e.target.value;
                      setSectionBuoiId(bId);
                      const sh = shifts.find(s => s.id === bId);
                      if (sh) {
                        setSectionStartTime(sh.startTime);
                        setSectionEndTime(addMinutes(sh.startTime, 90));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white cursor-pointer"
                  >
                    {shifts.map(sh => (
                      <option key={sh.id} value={sh.id}>{sh.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Hội trường hiện tại</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRoomName}
                    className="w-full px-3 py-2 border border-slate-150 bg-slate-50 text-slate-505 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Bắt đầu (HH:MM) *</label>
                  <input
                    type="text"
                    required
                    value={sectionStartTime}
                    onChange={(e) => setSectionStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Kết thúc (HH:MM) *</label>
                  <input
                    type="text"
                    required
                    value={sectionEndTime}
                    onChange={(e) => setSectionEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Mô tả tóm tắt</label>
                <textarea
                  value={sectionDescription}
                  onChange={(e) => setSectionDescription(e.target.value)}
                  rows={2}
                  placeholder="ví dụ: Bình duyệt nghiên cứu lâm sàng mới về da..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl border-none cursor-pointer"
                >
                  Lưu Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Presentation inside Section Modal */}
      {showPresentationModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in">
            <div className="bg-teal-600 p-5 text-white">
              <h4 className="font-extrabold text-sm uppercase">
                {editingPresentationId ? 'Hiệu chỉnh bài báo cáo thuyết trình' : 'Xếp lịch bài báo cáo khoa học'}
              </h4>
              <p className="text-[11px] text-teal-100 mt-1">
                Lập lịch cho Section: {activeSectionForAdd?.trackName}
              </p>
            </div>
            <form onSubmit={handleSavePresentation} className="p-6 space-y-4 text-xs font-semibold text-slate-800">
              
              {!editingPresentationId && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Chọn từ bài đăng ký được duyệt</label>
                  <select
                    value={presSelectedSpeakerId}
                    onChange={(e) => handleSelectSpeakerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white cursor-pointer"
                  >
                    <option value="manual">-- Nhập thủ công (Sự kiện tự do / Teabreak) --</option>
                    {unscheduledSpeakers.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.fullName} - {sp.presentationTitle.substring(0, 45)}...
                      </option>
                    ))}
                    {SAMPLE_PAPERS.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        [Mẫu] {sp.speakerName} - {sp.title.substring(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Chủ đề bài báo cáo / Tên hoạt động *</label>
                <input
                  type="text"
                  required
                  value={presTitle}
                  onChange={(e) => setPresTitle(e.target.value)}
                  placeholder="ví dụ: Nghiên cứu cải tiến kỹ thuật mí mắt Hàn Quốc..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Tên Báo Cáo Viên / Chủ trì *</label>
                  <input
                    type="text"
                    required
                    value={presSpeaker}
                    onChange={(e) => setPresSpeaker(e.target.value)}
                    placeholder="ví dụ: GS.TS. Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Học hàm / Đơn vị công tác</label>
                  <input
                    type="text"
                    value={presSpeakerTitle}
                    onChange={(e) => setPresSpeakerTitle(e.target.value)}
                    placeholder="ví dụ: Đại học Y Dược TP.HCM"
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Giờ bắt đầu (HH:MM) *</label>
                  <input
                    type="text"
                    required
                    value={presStartTime}
                    onChange={(e) => setPresStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Giờ kết thúc (HH:MM) *</label>
                  <input
                    type="text"
                    required
                    value={presEndTime}
                    onChange={(e) => setPresEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-105 pt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPresentationModal(false);
                    setActiveSectionForAdd(null);
                    setEditingPresentationId(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl border-none cursor-pointer"
                >
                  Lưu bài báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Printable Schedule Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h4 className="font-extrabold text-sm uppercase">Xuất tài liệu lịch trình</h4>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-white bg-transparent border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-semibold text-slate-805">
              <div>
                <label className="text-[10.5px] font-black text-slate-500 block mb-1.5 uppercase">Chọn ngày cần in / xuất bản</label>
                <select
                  value={selectedExportDate}
                  onChange={(e) => setSelectedExportDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">Tất cả các ngày ({dates.length} ngày)</option>
                  {dates.map(d => (
                    <option key={d} value={d}>Ngày {d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={() => handleExportPDF(selectedExportDate)}
                  className="p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 bg-white text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <FileText className="w-6 h-6 text-indigo-605" />
                  <span className="font-bold text-[10.5px]">BẢN IN PDF (GIAO DIỆN IN)</span>
                </button>
                
                <button
                  onClick={() => handleExportCSV()}
                  className="p-4 rounded-xl border-2 border-emerald-100 hover:border-emerald-500 bg-white text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-[10.5px]">XUẤT EXCEL / CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
