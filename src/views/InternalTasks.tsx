/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, AlertTriangle, User, Play, CheckCircle, Trash, LayoutGrid, List, Edit2, Eye, X } from 'lucide-react';
import { store } from '../dataStore';
import { InternalTask, UserAccount, Role } from '../types';

interface InternalTasksProps {
  role: Role;
}

export default function InternalTasks({ role }: InternalTasksProps) {
  const [tasks, setTasks] = useState<InternalTask[]>(store.getTasks());
  const users = store.getUsers().filter(u => u.status === 'active');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState(users[0]?.id || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [deadline, setDeadline] = useState('2026-06-15');

  // Selected editor state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editingTask, setEditingTask] = useState<InternalTask | null>(null);

  // Detailed task view & checklist states
  const [selectedDetailTask, setSelectedDetailTask] = useState<InternalTask | null>(null);
  const [detailContentText, setDetailContentText] = useState('');
  const [checklistText, setChecklistText] = useState('');

  React.useEffect(() => {
    if (selectedDetailTask) {
      const task = store.getTasks().find(t => t.id === selectedDetailTask.id);
      setDetailContentText(task?.detailedContent || '');
      setChecklistText('');
    }
  }, [selectedDetailTask]);

  const loadAll = () => {
    setTasks([...store.getTasks()]);
  };

  const handleEditTask = (task: InternalTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setAssignedToId(task.assignedToId || users[0]?.id || '');
    setPriority(task.priority);
    setDeadline(task.deadline);
    setShowForm(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Vui lòng điền tên việc cần làm.');
      return;
    }

    // CTV accounts cannot assign tasks.
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không thể gán nhiệm vụ mới!');
      return;
    }

    const assignedUser = users.find(u => u.id === assignedToId);

    const taskData: InternalTask = {
      id: editingTask ? editingTask.id : 'TSK-' + Math.floor(Math.random() * 9000 + 1000),
      title,
      description,
      assignedToName: assignedUser?.name || 'Chưa rõ',
      assignedToId: assignedToId,
      priority,
      status: editingTask ? editingTask.status : 'todo',
      deadline,
      progress: editingTask ? editingTask.progress : 0,
    };

    store.saveTask(taskData);
    setShowForm(false);
    setEditingTask(null);
    
    // Clear
    setTitle('');
    setDescription('');
    
    loadAll();
    alert(editingTask ? 'Cập nhật nhiệm vụ thành công!' : 'Thêm nhiệm vụ mới thành công!');
  };

  const handleUpdateProgress = (task: InternalTask, newProgress: number) => {
    // If CTV tries to alter a task not assigned to them, we warn or restrict. (But we allow them to update tasks assigned directly to them!)
    // For simplicity, let's allow it but warn if it is not their name
    const updatedTask = { ...task, progress: newProgress };
    if (newProgress === 100) {
      updatedTask.status = 'done';
    } else if (newProgress > 0) {
      updatedTask.status = 'in_progress';
    } else {
      updatedTask.status = 'todo';
    }

    store.saveTask(updatedTask);
    loadAll();
  };

  const handleToggleStatus = (task: InternalTask) => {
    const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    const nextProgress = nextStatus === 'done' ? 100 : nextStatus === 'in_progress' ? 50 : 0;
    
    const updated = {
      ...task,
      status: nextStatus as any,
      progress: nextProgress,
    };
    store.saveTask(updated);
    loadAll();
  };

  const handleDeleteTask = (id: string) => {
    if (role === 'ctv') {
      alert('Tài khoản Cộng tác viên không có quyền xóa nhiệm vụ!');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa nhiệm vụ nội bộ này?')) {
      store.deleteTask(id);
      loadAll();
      if (selectedDetailTask?.id === id) {
        setSelectedDetailTask(null);
      }
    }
  };

  const saveChecklistAndProgress = (task: InternalTask, updatedList: any[]) => {
    const totalCount = updatedList.length;
    const completedCount = updatedList.filter(item => item.completed).length;
    
    let progress = task.progress;
    let status = task.status;
    
    if (totalCount > 0) {
      progress = Math.round((completedCount / totalCount) * 100);
      if (progress === 100) {
        status = 'done';
      } else if (progress > 0) {
        status = 'in_progress';
      } else {
        status = 'todo';
      }
    }
    
    const updatedTask: InternalTask = {
      ...task,
      checklist: updatedList,
      progress,
      status
    };
    
    store.saveTask(updatedTask);
    loadAll();
  };

  const handleToggleChecklistItem = (task: InternalTask, itemId: string) => {
    const list = task.checklist || [];
    const updatedList = list.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    saveChecklistAndProgress(task, updatedList);
  };

  const handleDeleteChecklistItem = (task: InternalTask, itemId: string) => {
    const list = task.checklist || [];
    const updatedList = list.filter(item => item.id !== itemId);
    saveChecklistAndProgress(task, updatedList);
  };

  const handleAddChecklistItem = (task: InternalTask) => {
    if (!checklistText.trim()) return;
    const newItem = {
      id: 'CL-' + Math.floor(Math.random() * 900000 + 100000),
      text: checklistText.trim(),
      completed: false
    };
    const updatedList = [...(task.checklist || []), newItem];
    saveChecklistAndProgress(task, updatedList);
    setChecklistText('');
  };

  const handleSaveDetailedContent = (task: InternalTask) => {
    const updatedTask: InternalTask = {
      ...task,
      detailedContent: detailContentText
    };
    store.saveTask(updatedTask);
    loadAll();
    alert('Đã lưu nội dung chi tiết công việc!');
  };

  const currentDetailTask = selectedDetailTask ? (tasks.find(t => t.id === selectedDetailTask.id) || selectedDetailTask) : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Overview stats header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Trạm Phân Công Việc Nội Bộ (Internal Tasks Office)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Giám sát & chỉ định tiến độ vận hành hội sảnh, tiếp nhận từ điều hành viên trung tâm.</p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Toggle board / list modes */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 gap-1 text-[11px] font-bold">
            <button
              id="layout-toggle-board"
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1.5 transition-all text-[11px] font-bold ${
                viewMode === 'board'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
              Dạng bảng
            </button>
            <button
              id="layout-toggle-list"
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1.5 transition-all text-[11px] font-bold ${
                viewMode === 'list'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              <List className="w-3.5 h-3.5 text-teal-600" />
              Dạng danh sách
            </button>
          </div>

          {role !== 'ctv' && (
            <button
              id="btn-add-task-board"
              onClick={() => {
                setEditingTask(null);
                setTitle('');
                setDescription('');
                setAssignedToId(users[0]?.id || '');
                setPriority('medium');
                setDeadline('2026-06-15');
                setShowForm(true);
              }}
              className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              Giao Nhiệm Vụ Mới
            </button>
          )}
        </div>
      </div>

      {viewMode === 'board' ? (
        /* Grid status columns (Board) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Column 1: TODO */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-800 tracking-wider">CẦN THỰC HIỆN (TODO)</span>
              <span className="px-2.5 py-0.5 bg-slate-200 text-slate-705 text-[10px] rounded-lg font-black font-mono">
                {tasks.filter(t => t.status === 'todo').length}
              </span>
            </div>

            <div className="space-y-3">
              {tasks.filter(t => t.status === 'todo').length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-450">Trống</div>
              ) : (
                tasks.filter(t => t.status === 'todo').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    role={role}
                    onToggle={() => handleToggleStatus(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onEdit={() => handleEditTask(task)}
                    onViewDetails={() => setSelectedDetailTask(task)}
                    onUpdateProgress={(p) => handleUpdateProgress(task, p)}
                    editingTaskId={editingTaskId}
                    setEditingTaskId={setEditingTaskId}
                    editProgress={editProgress}
                    setEditProgress={setEditProgress}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="bg-teal-50/15 p-4 rounded-2xl border border-teal-500/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <span className="text-xs font-black text-teal-800 tracking-wider">ĐANG THỰC HIỆN</span>
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded-lg font-black font-mono">
                {tasks.filter(t => t.status === 'in_progress').length}
              </span>
            </div>

            <div className="space-y-3">
              {tasks.filter(t => t.status === 'in_progress').length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200/50 rounded-xl text-[11px] text-slate-450">Chưa bắt đầu</div>
              ) : (
                tasks.filter(t => t.status === 'in_progress').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    role={role}
                    onToggle={() => handleToggleStatus(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onEdit={() => handleEditTask(task)}
                    onViewDetails={() => setSelectedDetailTask(task)}
                    onUpdateProgress={(p) => handleUpdateProgress(task, p)}
                    editingTaskId={editingTaskId}
                    setEditingTaskId={setEditingTaskId}
                    editProgress={editProgress}
                    setEditProgress={setEditProgress}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="bg-emerald-50/10 p-4 rounded-2xl border border-emerald-500/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
              <span className="text-xs font-black text-emerald-800 tracking-wider">HOÀN THÀNH</span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-lg font-black font-mono">
                {tasks.filter(t => t.status === 'done').length}
              </span>
            </div>

            <div className="space-y-3">
              {tasks.filter(t => t.status === 'done').length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200/30 rounded-xl text-[11px] text-slate-450">Chưa hoàn thành</div>
              ) : (
                tasks.filter(t => t.status === 'done').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    role={role}
                    onToggle={() => handleToggleStatus(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onEdit={() => handleEditTask(task)}
                    onViewDetails={() => setSelectedDetailTask(task)}
                    onUpdateProgress={(p) => handleUpdateProgress(task, p)}
                    editingTaskId={editingTaskId}
                    setEditingTaskId={setEditingTaskId}
                    editProgress={editProgress}
                    setEditProgress={setEditProgress}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Detailed List layout view */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in text-slate-700">
          <div className="p-4 bg-slate-50/70 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="uppercase text-slate-800 tracking-wider">Danh Sách Công Việc Nội Bộ Chi Tiết ({tasks.length})</span>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Cần làm: {tasks.filter(t => t.status === 'todo').length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Đang làm: {tasks.filter(t => t.status === 'in_progress').length}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hoàn tất: {tasks.filter(t => t.status === 'done').length}
              </span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic font-medium text-xs">
              Chưa có nhiệm vụ nội bộ nào được khởi tạo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-widest font-black text-slate-500 border-b border-slate-150">
                  <tr>
                    <th className="p-3.5 pl-5 w-24">Mã nhiệm vụ</th>
                    <th className="p-3.5">Nhiệm vụ & Mục bám sát chi tiết</th>
                    <th className="p-3.5 w-40">Nhân sự phụ trách</th>
                    <th className="p-3.5 w-48">Tiến độ (%) & Thanh trượt</th>
                    <th className="p-3.5 w-28">Hạn (Deadline)</th>
                    <th className="p-3.5 w-36">Trạng thái</th>
                    <th className="p-3.5 text-center pr-5 w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {tasks.map((task) => {
                    const isTaskEditing = editingTaskId === task.id;
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3.5 pl-5 font-mono text-xs font-bold text-slate-400">{task.id}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 leading-tight text-xs">{task.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              task.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {task.priority === 'high' ? 'Khẩn' : task.priority === 'medium' ? 'Trung' : 'Thấp'}
                            </span>
                          </div>
                          {task.description && <p className="text-[11px] text-slate-500 mt-1 max-w-lg leading-relaxed">{task.description}</p>}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-850 font-extrabold">
                            <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-150 text-teal-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {task.assignedToName.charAt(0)}
                            </div>
                            <span className="truncate max-w-[120px]" title={task.assignedToName}>{task.assignedToName}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>Tiến độ:</span>
                              <span className="text-slate-800">{task.progress}%</span>
                            </div>
                            {isTaskEditing ? (
                              <div className="space-y-1.5 animate-fade-in bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={editProgress}
                                  onChange={(e) => setEditProgress(Number(e.target.value))}
                                  className="w-full accent-teal-600 h-1"
                                />
                                <div className="flex justify-end gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(null)}
                                    className="px-2 py-0.5 text-[8px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-bold cursor-pointer border-none"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateProgress(task, editProgress);
                                      setEditingTaskId(null);
                                    }}
                                    className="px-2 py-0.5 text-[8px] bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold cursor-pointer border-none"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => {
                                  setEditProgress(task.progress);
                                  setEditingTaskId(task.id);
                                }}
                                className="w-full bg-slate-100 h-2 rounded-full overflow-hidden cursor-pointer hover:bg-slate-200 transition-all border border-slate-200"
                                title="Nhấp để cập nhật nhanh % tiến độ"
                              >
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${task.status === 'done' ? 'bg-emerald-500' : 'bg-teal-500'}`} 
                                  style={{ width: `${task.progress}%` }} 
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-[11px] font-mono font-bold text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {task.deadline}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg tracking-wider border-none ${
                            task.status === 'done' ? 'bg-emerald-55 text-emerald-800' :
                            task.status === 'in_progress' ? 'bg-teal-55 text-teal-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.status === 'done' ? '🟢 Hoàn thành' :
                             task.status === 'in_progress' ? '⚡ Thực hành' : '⏳ Chờ triển khai'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center pr-5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(task)}
                              className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-705 font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                              title="Chuyển trạng thái nhanh"
                            >
                              {task.status === 'done' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Play className="w-3 h-3 text-slate-400" />}
                              <span>{task.status === 'done' ? 'Làm lại' : 'Tiến hành'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDetailTask(task)}
                              className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-800 rounded-lg transition-all border-none cursor-pointer"
                              title="Xem chi tiết & Checklist"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {role !== 'ctv' && (
                              <button
                                type="button"
                                onClick={() => handleEditTask(task)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 rounded-lg transition-all border-none cursor-pointer"
                                title="Sửa chi tiết"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {role !== 'ctv' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 hover:text-rose-750 rounded-lg transition-all border-none cursor-pointer"
                                title="Xóa"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Task Creation Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-800">
            <div className="bg-teal-600 p-5 text-white">
              <h4 className="font-bold text-sm">GIAO NHIỆM VỤ MỚI</h4>
              <p className="text-[11px] text-teal-100">Giao việc chỉ định rõ Bác sĩ hoặc CTV phụ trách thời hạn.</p>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nhiệm vụ cần thực hiện *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ví dụ: Thu gom slide báo cáo lưu trữ nháp"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Mô tả công việc</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Ghi rõ chi tiết tiêu chuẩn hoàn thành..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Cán bộ phụ trách *</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Mức độ ưu tiên</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="high">HIGH (Khẩn cấp)</option>
                    <option value="medium">MEDIUM (Trung bình)</option>
                    <option value="low">LOW (Thấp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Hạn hoàn thành (Deadline)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg animate-fade-in"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-confirm-save-task"
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-teal-600 hover:bg-teal-700 font-bold rounded-lg animate-fade-in"
                >
                  Xác nhận giao nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Task Modal Dialog */}
      {selectedDetailTask && currentDetailTask && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-fade-in text-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-teal-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] bg-teal-800 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest">{currentDetailTask.id}</span>
                <h4 className="font-bold text-sm mt-2">{currentDetailTask.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTask(null)}
                className="w-7 h-7 rounded-full bg-teal-850/40 hover:bg-teal-850/70 text-white flex items-center justify-center border-none cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Metadata row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5 uppercase">Phụ trách</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-teal-150 text-teal-700 flex items-center justify-center font-bold text-[9px]">
                      {currentDetailTask.assignedToName.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 truncate max-w-[90px]" title={currentDetailTask.assignedToName}>{currentDetailTask.assignedToName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5 uppercase">Ưu tiên</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    currentDetailTask.priority === 'high' ? 'bg-rose-50 text-rose-750 border border-rose-100' :
                    currentDetailTask.priority === 'medium' ? 'bg-amber-50 text-amber-750 border border-amber-100' : 'bg-slate-100 text-slate-655'
                  }`}>
                    {currentDetailTask.priority === 'high' ? 'Khẩn cấp' : currentDetailTask.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5 uppercase">Hạn chót</span>
                  <span className="font-bold font-mono text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {currentDetailTask.deadline}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5 uppercase">Trạng thái</span>
                  <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-md tracking-wider border-none ${
                    currentDetailTask.status === 'done' ? 'bg-emerald-55 text-emerald-800' :
                    currentDetailTask.status === 'in_progress' ? 'bg-teal-55 text-teal-800' : 'bg-slate-100 text-slate-655'
                  }`}>
                    {currentDetailTask.status === 'done' ? 'Hoàn thành' :
                     currentDetailTask.status === 'in_progress' ? 'Đang làm' : 'Cần làm'}
                  </span>
                </div>
              </div>

              {/* Description summary */}
              {currentDetailTask.description && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Yêu cầu công việc sơ bộ</span>
                  <p className="p-3 bg-slate-50/50 rounded-lg text-slate-600 leading-relaxed border border-slate-150/60 italic">
                    "{currentDetailTask.description}"
                  </p>
                </div>
              )}

              {/* Detailed Content editor */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chi tiết kế hoạch & Tài liệu đính kèm</span>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs leading-relaxed font-sans min-h-[100px] bg-slate-50/20"
                  placeholder="Nhập quy trình thực hiện, đường dẫn tài liệu Google Drive, slide báo cáo, ghi chú bàn giao..."
                  value={detailContentText}
                  onChange={(e) => setDetailContentText(e.target.value)}
                />
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-3 pt-3.5 border-t border-slate-150">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checklist việc con (Subtasks)</span>
                    <span className="text-[9px] text-slate-455 mt-0.5 block">Tiến độ tổng sẽ tự động tính dựa trên các mục này.</span>
                  </div>
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded text-[10px]">
                    {currentDetailTask.progress}% ({(currentDetailTask.checklist || []).filter(c => c.completed).length}/{ (currentDetailTask.checklist || []).length })
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-150">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${currentDetailTask.status === 'done' ? 'bg-emerald-500' : 'bg-teal-500'}`}
                    style={{ width: `${currentDetailTask.progress}%` }}
                  />
                </div>

                {/* Checklist items list */}
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {(currentDetailTask.checklist || []).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-1">Chưa có đầu việc con. Hãy thêm bên dưới để phân nhỏ công việc!</p>
                  ) : (
                    (currentDetailTask.checklist || []).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/60 rounded-lg border border-slate-200 transition-all group">
                        <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklistItem(currentDetailTask, item.id)}
                            className="w-3.5 h-3.5 accent-teal-650 cursor-pointer rounded"
                          />
                          <span className={`text-[11px] font-medium ${item.completed ? 'line-through text-slate-450 font-normal' : 'text-slate-700'}`}>
                            {item.text}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklistItem(currentDetailTask, item.id)}
                          className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer border-none bg-transparent"
                          title="Xóa đầu việc"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add checklist input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs"
                    placeholder="ví dụ: Chuẩn bị nước uống, Set bàn đại biểu..."
                    value={checklistText}
                    onChange={(e) => setChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem(currentDetailTask);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChecklistItem(currentDetailTask)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold cursor-pointer border-none text-[10px]"
                  >
                    Thêm việc
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-between items-center text-[10px]">
              <span className="text-slate-450 italic">Checklist được tự động lưu. Hãy bấm Lưu chi tiết để cập nhật Mô tả dài.</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDetailTask(null)}
                  className="px-3.5 py-2 font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer border-none"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDetailedContent(currentDetailTask)}
                  className="px-3.5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer border-none shadow-sm"
                >
                  Lưu chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SubComponent for cleaner isolation preventing multi-rendering errors
interface TaskCardProps {
  key?: any;
  task: InternalTask;
  role: Role;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
  onUpdateProgress: (progress: number) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editProgress: number;
  setEditProgress: (p: number) => void;
}

function TaskCard({ 
  task, role, onToggle, onDelete, onEdit, onViewDetails, onUpdateProgress,
  editingTaskId, setEditingTaskId, editProgress, setEditProgress 
}: TaskCardProps) {
  
  const isEditing = editingTaskId === task.id;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-teal-350 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-slate-400 font-bold">{task.id}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
            task.priority === 'high' ? 'bg-rose-50 text-rose-700' :
            task.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {task.priority}
          </span>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 text-xs tracking-tight">{task.title}</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{task.description}</p>
        </div>

        {/* Assigned user details */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Phụ trách: <strong>{task.assignedToName}</strong></span>
        </div>

        {/* Realtime progress slider tool inside card */}
        <div className="space-y-1 pt-1.5 border-t border-slate-100">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Tiến độ:</span>
            <span className="font-bold font-mono text-slate-800">{task.progress}%</span>
          </div>
          
          {isEditing ? (
            <div className="space-y-2 animate-fade-in">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editProgress}
                onChange={(e) => setEditProgress(Number(e.target.value))}
                className="w-full accent-teal-600 h-1.5"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditingTaskId(null)}
                  className="px-2 py-0.5 text-[9px] bg-slate-100 hover:bg-slate-200 rounded font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    onUpdateProgress(editProgress);
                    setEditingTaskId(null);
                  }}
                  className="px-2 py-0.5 text-[9px] bg-teal-600 text-white hover:bg-teal-700 rounded font-bold"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => {
                setEditProgress(task.progress);
                setEditingTaskId(task.id);
              }}
              className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden cursor-pointer hover:bg-slate-200 transition-all relative"
              title="Nhấp để cập nhật nhanh % tiến độ"
            >
              <div 
                className={`h-full rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-teal-500'}`} 
                style={{ width: `${task.progress}%` }} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          HL: {task.deadline}
        </div>

        <div className="flex gap-1">
          <button
            title="Xem chi tiết & Checklist"
            onClick={onViewDetails}
            className="p-1 hover:bg-teal-50 text-teal-600 hover:text-teal-800 rounded transition-all cursor-pointer border border-transparent hover:border-teal-150"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            title="Chuyển đổi nhanh trạng thái"
            onClick={onToggle}
            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition-all cursor-pointer border border-transparent hover:border-slate-200"
          >
            {task.status === 'done' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          
          {role !== 'ctv' && (
            <button
              title="Chỉnh sửa chi tiết nhiệm vụ"
              onClick={onEdit}
              className="p-1 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded transition-all cursor-pointer border border-transparent hover:border-indigo-150"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {role !== 'ctv' && (
            <button
              title="Xóa nhiệm vụ"
              onClick={onDelete}
              className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100"
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
