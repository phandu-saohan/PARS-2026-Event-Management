/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Search, Filter, Plus, FileDown, CheckSquare, Trash, Check, AlertCircle, Edit2 } from 'lucide-react';
import { store } from '../dataStore';
import { FinanceTransaction, Role } from '../types';

interface FinanceReconciliationProps {
  role: Role;
}

export default function FinanceReconciliation({ role }: FinanceReconciliationProps) {
  const [records, setRecords] = useState<FinanceTransaction[]>(store.getFinance());
  const [showForm, setShowForm] = useState(false);

  // Form Fields
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('In ấn & Marketing');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản Ngân hàng');

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const [editingRecord, setEditingRecord] = useState<FinanceTransaction | null>(null);

  const loadAll = () => {
    setRecords([...store.getFinance()]);
  };

  const handleEdit = (rec: FinanceTransaction) => {
    setEditingRecord(rec);
    setType(rec.type);
    setCategory(rec.category);
    setAmount(rec.amount.toString());
    setDescription(rec.description);
    setPaymentMethod(rec.paymentMethod);
    setShowForm(true);
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      alert('Vui lòng nhập số tiền và nội dung đối soát.');
      return;
    }

    const nAmount = Number(amount);
    if (isNaN(nAmount) || nAmount <= 0) {
      alert('Số tiền nhập phải hợp lệ.');
      return;
    }

    const recordData: FinanceTransaction = {
      id: editingRecord ? editingRecord.id : 'TXN-' + Math.floor(Math.random() * 90000 + 10000),
      date: editingRecord ? editingRecord.date : new Date().toISOString().replace('T', ' ').substring(0, 16),
      type,
      category,
      amount: nAmount,
      description,
      paymentMethod,
      verifiedBy: editingRecord ? editingRecord.verifiedBy : (role === 'admin' ? 'Chủ tịch GS.TS. Phạm Minh Chi' : 'Đặng Thùy Dương'),
      isVerified: editingRecord ? editingRecord.isVerified : true,
      referenceId: editingRecord ? editingRecord.referenceId : undefined,
    };

    store.saveFinancialRecord(recordData);
    setShowForm(false);
    setEditingRecord(null);
    
    // Clear
    setAmount('');
    setDescription('');
    
    loadAll();
    alert(editingRecord ? 'Cập nhật bút toán thành công!' : 'Thêm mới bút toán thành công!');
  };

  const handleVerify = (id: string) => {
    const verifierName = role === 'admin' ? 'Chủ tịch GS.TS. Phạm Minh Chi' : 'Đặng Thùy Dương';
    store.verifyFinancialRecord(id, verifierName);
    loadAll();
    alert('Đã hoàn tất đối soát 1-click! Hệ thống đã gửi thông báo xác nhận thành công SMS/Zalo/Email kèm vé tới đại biểu liên can.');
  };

  const handleDelete = (id: string) => {
    if (role !== 'admin') {
      alert('Chỉ quản trị viên tối cao (Admin) mới có quyền xóa bút toán kế toán!');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa bút toán này? Thao tác này sẽ làm xê dịch số dư thực tế.')) {
      store.deleteFinanceRecord(id);
      loadAll();
    }
  };

  const getFilteredRecords = () => {
    return records.filter(r => {
      const matchQuery = 
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'all' || r.type === typeFilter;
      const matchVerified = 
        verifiedFilter === 'all' || 
        (verifiedFilter === 'verified' && r.isVerified) ||
        (verifiedFilter === 'pending' && !r.isVerified);

      return matchQuery && matchType && matchVerified;
    });
  };

  const handleExportCSV = () => {
    const filteredRows = getFilteredRecords();
    let csvContent = 'ID,Thời gian,Loại,Hạng mục,Số tiền (VNĐ),Nội dung,Hình thức,Người đối soát,Trạng thái\n';
    
    filteredRows.forEach(r => {
      csvContent += `"${r.id}","${r.date}","${r.type === 'income' ? 'Thu' : 'Chi'}","${r.category}",${r.amount},"${r.description}","${r.paymentMethod}","${r.verifiedBy || 'Không có'}","${r.isVerified ? 'Đã đối soát' : 'Chờ duyệt'}"\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Đối_Soát_Tài_Chính_PARS2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = records.filter(r => r.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const reconciledIncome = records.filter(r => r.type === 'income' && r.isVerified).reduce((a, b) => a + b.amount, 0);
  const pendingIncome = records.filter(r => r.type === 'income' && !r.isVerified).reduce((a, b) => a + b.amount, 0);

  const filteredData = getFilteredRecords();

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Fin Overview stats box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng Dòng Tiền Vào</span>
          <p className="text-xl font-black text-emerald-700 font-mono">{(totalIncome).toLocaleString()}đ</p>
          <span className="text-[9px] text-slate-500 font-medium block">Hội phí + Gian triển lãm</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng chi phí phát sinh</span>
          <p className="text-xl font-black text-rose-700 font-mono">{(totalExpense).toLocaleString()}đ</p>
          <span className="text-[9px] text-slate-500 font-medium block">Khách sạn sảnh + Tiệc tùng</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doanh số Đã Đối Soát</span>
          <p className="text-xl font-black text-slate-900 font-mono">{(reconciledIncome - totalExpense).toLocaleString()}đ</p>
          <span className="text-[9px] text-emerald-600 font-semibold block">Dữ liệu ngân hàng an toàn</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Quỹ treo Đang Đối Soát</span>
          <p className="text-xl font-black text-amber-800 font-mono">{(pendingIncome).toLocaleString()}đ</p>
          <span className="text-[9px] text-slate-550 block">Các lệnh đại biểu chờ duyệt</span>
        </div>
      </div>

      {/* Filter and bookkeeping controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung, hạng mục..."
              className="pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-lg text-xs font-semibold focus:outline-none placeholder-slate-400 transition-all uppercase w-60"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="all">Mọi loại hình</option>
            <option value="income">Dòng thu (Income)</option>
            <option value="expense">Dòng chi (Expense)</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e: any) => setVerifiedFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="verified">Đã đối soát ngân hàng</option>
            <option value="pending">Chờ đối soát (Lệnh treo)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-finance-csv"
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Tải Sổ Cái Ledger (CSV)
          </button>

          <button
            id="btn-open-create-txn"
            onClick={() => {
              setEditingRecord(null);
              setType('expense');
              setCategory('In ấn & Marketing');
              setAmount('');
              setDescription('');
              setPaymentMethod('Chuyển khoản Ngân hàng');
              setShowForm(true);
            }}
            className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Ghi Nhận Phục Vụ Chi Tiết
          </button>
        </div>
      </div>

      {/* Database ledger registry log */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[10px] text-slate-400 bg-slate-50 uppercase tracking-widest font-mono">
              <tr>
                <th className="px-6 py-3.5">Mã số</th>
                <th className="px-6 py-3.5">Thời gian cập nhật</th>
                <th className="px-6 py-3.5">Hạng Mục</th>
                <th className="px-6 py-3.5">Nội dung chuyển khoản</th>
                <th className="px-6 py-3.5 text-center">Giao dịch</th>
                <th className="px-6 py-3.5">Đối Soát</th>
                <th className="px-6 py-3.5 text-right">Thẩm kiểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold italic text-xs">
                    Không tìm thấy bút toán nào khớp với bộ lọc đối chiếu thời gian thực.
                  </td>
                </tr>
              ) : (
                filteredData.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{txn.id}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{txn.date}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-750 rounded text-[10px] font-bold">
                        {txn.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-950 font-semibold text-xs leading-relaxed">{txn.description}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{txn.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      <span className={txn.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}>
                        {txn.type === 'income' ? '+' : '-'}{(txn.amount).toLocaleString()}đ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {txn.isVerified ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-700 font-mono tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Đã Đơn Vé
                          </span>
                          <span className="block text-[8px] text-slate-400 font-medium">Bởi: {txn.verifiedBy}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-amber-700 font-mono tracking-wider bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">
                          Chờ khớp lệnh
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!txn.isVerified && (
                          <button
                            title="Xác nhận đối soát 1-click thành công"
                            onClick={() => handleVerify(txn.id)}
                            className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition-all flex items-center gap-0.5 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Đối Soát
                          </button>
                        )}
                        {role !== 'ctv' && (
                          <button
                            title="Sửa bút toán"
                            onClick={() => handleEdit(txn)}
                            className="p-1 hover:bg-indigo-50 text-indigo-600 rounded hover:text-indigo-800 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {role === 'admin' && (
                          <button
                            title="Xóa bút toán"
                            onClick={() => handleDelete(txn.id)}
                            className="p-1 hover:bg-rose-50 text-rose-505 rounded hover:text-rose-700 transition-all cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile grid view of transactions */}
      <div className="block md:hidden space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm font-semibold italic text-xs">
            Không tìm thấy bút toán nào khớp với bộ lọc đối chiếu thời gian thực.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredData.map((txn) => (
              <div key={txn.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 animate-fade-in select-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-slate-400 font-bold block">MÃ SỐ GD: {txn.id}</span>
                    <span className="text-slate-950 font-bold text-xs block leading-snug">
                      {txn.description}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black shrink-0 ${
                    txn.type === 'income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {txn.type === 'income' ? 'THU' : 'CHI'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 text-[10px] text-slate-600">
                  <div className="flex justify-between font-mono">
                    <span>Thời gian:</span>
                    <span className="text-slate-800 font-medium">{txn.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hạng mục:</span>
                    <span className="font-bold text-slate-800">{txn.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hình thức:</span>
                    <span className="font-semibold text-slate-850">{txn.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Số chi phí:</span>
                    <span className={`font-black font-mono text-xs ${txn.type === 'income' ? 'text-emerald-700' : 'text-rose-705'}`}>
                      {txn.type === 'income' ? '+' : '-'}{(txn.amount).toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Đối soát:</span>
                    <div>
                      {txn.isVerified ? (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                            <Check className="w-2.5 h-2.5" />
                            Đã duyệt
                          </span>
                          <span className="text-[7.5px] text-slate-400 mt-0.5">Bởi: {txn.verifiedBy}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded animate-pulse">
                          Chờ khớp lệnh
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1 mt-auto">
                  {!txn.isVerified && (
                    <button
                      title="Đối soát"
                      onClick={() => handleVerify(txn.id)}
                      className="px-2 py-1 text-[9.5px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-0.5 cursor-pointer border-none transition"
                    >
                      <Check className="w-3 h-3" />
                      <span>Xác minh</span>
                    </button>
                  )}
                  {role !== 'ctv' && (
                    <button
                      title="Sửa"
                      onClick={() => handleEdit(txn)}
                      className="p-1 hover:bg-indigo-50 text-indigo-600 rounded hover:text-indigo-850 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {role === 'admin' && (
                    <button
                      title="Xóa"
                      onClick={() => handleDelete(txn.id)}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded hover:text-rose-700 transition cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Insert Transaction Dialog Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl animate-fade-in text-slate-800">
            <div className="bg-teal-600 p-5 text-white">
              <h4 className="font-bold text-sm uppercase">{editingRecord ? 'Cập nhật bút toán đối soát' : 'Ghi Phụ Việc Sổ Sách'}</h4>
              <p className="text-[11px] text-teal-100">{editingRecord ? 'Chỉnh sửa lại các thông tin chi tiết hoặc số tiền đã ghi nhận.' : 'Ghi lại các khoản chi thực tế phụ cho hội nghị, in ấn backdrop hoặc chi teabreak.'}</p>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Dòng tiền</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer font-bold"
                  >
                    <option value="expense">Khoản Chi (Expense)</option>
                    <option value="income">Khoản Thu (Income)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Hạng mục chính</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="In ấn & Marketing">In ấn & Marketing</option>
                    <option value="Khách sạn & Địa điểm">Khách sạn & Địa điểm</option>
                    <option value="F&B và Gala Dinner">F&B và Gala Dinner</option>
                    <option value="Thiết bị & Âm thanh">Thiết bị & Âm thanh</option>
                    <option value="Quà tặng & Thẻ CME">Quà tặng & Thẻ CME</option>
                    <option value="Gói đại biểu">Gói Đại biểu đóng thêm</option>
                    <option value="Khác">Phát sinh ngoài mục</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Số lượng kinh phí (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ví dụ: 15000000"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Diễn giải nội dung *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ví dụ: Thuê in 500 Backdrop sảnh chính"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Hình thức thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer"
                >
                  <option value="Chuyển khoản Ngân hàng">Chuyển khoản Ngân hàng</option>
                  <option value="Tiền mặt trực tiếp">Tiền mặt trực tiếp</option>
                  <option value="Thẻ tín dụng doanh nghiệp">Thẻ tín dụng doanh nghiệp</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-confirm-save-txn"
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-teal-600 hover:bg-teal-700 font-bold rounded-lg animate-fade-in"
                >
                  Xác nhận lưu bút
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
