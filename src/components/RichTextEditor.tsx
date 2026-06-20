/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Eraser, Eye, Edit3 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  id?: string;
  rows?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  label,
  id = 'rich-text-editor'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Sync internal contenteditable div with external state ONLY when they genuinely differ
  // This prevents cursor jumping when state changes
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-1 w-full font-sans text-xs">
      {label && (
        <label htmlFor={id} className="text-[11px] font-bold text-slate-500 block uppercase tracking-wide">
          {label}
        </label>
      )}

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-slate-300 focus-within:border-teal-500/80 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
        {/* Editor tabs & Toolbar controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-y-2 select-none">
          {/* Tabs: Write & Preview */}
          <div className="flex bg-slate-200/60 p-0.5 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all flex items-center gap-1 border-none cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-505 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all flex items-center gap-1 border-none cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Eye className="w-3 h-3" />
              Xem trước
            </button>
          </div>

          {/* Text Style Commands (Only show when in Edit mode) */}
          {activeTab === 'edit' && (
            <div className="flex items-center gap-0.5 md:gap-1 text-slate-600 bg-white/80 p-0.5 rounded-lg border border-slate-200/50">
              <button
                type="button"
                onClick={() => execCommand('bold')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Chữ đậm"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('italic')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Chữ nghiêng"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('underline')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Gạch chân"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <span className="w-[1px] h-4 bg-slate-200 mx-1"></span>
              <button
                type="button"
                onClick={() => execCommand('insertUnorderedList')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Danh sách dấu chấm"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('insertOrderedList')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Danh sách số"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <span className="w-[1px] h-4 bg-slate-200 mx-1"></span>
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<h1>')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Tiêu đề lớn"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<h2>')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Tiêu đề phụ"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <span className="w-[1px] h-4 bg-slate-200 mx-1"></span>
              <button
                type="button"
                onClick={() => execCommand('justifyLeft')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Canh trái"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('justifyCenter')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Canh giữa"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => execCommand('justifyRight')}
                className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Canh phải"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <span className="w-[1px] h-4 bg-slate-200 mx-1"></span>
              <button
                type="button"
                onClick={() => execCommand('removeFormat')}
                className="p-1 hover:bg-slate-100 text-rose-500 hover:bg-rose-50 rounded cursor-pointer border-none bg-transparent transition-all"
                title="Xóa định dạng"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Editing and Preview Area */}
        <div className="relative font-sans text-slate-800 text-[12.5px]">
          {activeTab === 'edit' ? (
            <div
              id={id}
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onBlur={handleInput}
              className="w-full min-h-[120px] max-h-[300px] overflow-y-auto p-4 focus:outline-none focus:ring-0 leading-relaxed prose prose-sm max-w-none prose-slate"
              style={{ minHeight: '120px' }}
            />
          ) : (
            <div 
              className="w-full min-h-[120px] max-h-[300px] overflow-y-auto p-4 leading-relaxed bg-slate-50/50 prose prose-sm max-w-none prose-slate text-slate-700"
              dangerouslySetInnerHTML={{ __html: value || `<span class="italic text-slate-400">Không có dữ liệu văn bản</span>` }}
            />
          )}

          {/* Custom Placeholder */}
          {activeTab === 'edit' && !value && (
            <div className="absolute top-4 left-4 text-slate-400 font-medium select-none pointer-events-none italic">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      <p className="text-[9px] text-slate-400 font-medium">Bôi đen văn bản để áp dụng phong cách định dạng nhanh.</p>
    </div>
  );
}
