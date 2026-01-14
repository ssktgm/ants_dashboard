import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import Card from './Card';

// フィルタパネル：メモ化して入力中の再レンダリングを防止
const FilterPanel = React.memo(({ activeFilters, categories, defaultFilters, clearedFilters, onApplyFilters }) => {
  // 内部状態としてドラフトフィルタを保持
  const [draftFilters, setDraftFilters] = useState(activeFilters);

  // 親から渡されたactiveFiltersが変更された場合のみ同期（初期ロードやリセット時など）
  useEffect(() => {
    setDraftFilters(activeFilters);
  }, [activeFilters]);

  // 適用ボタン押下時のハンドラ
  const handleApply = () => {
    onApplyFilters(draftFilters);
  };

  return (
    <Card className="mb-6 border border-blue-100 bg-blue-50">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">期間指定</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={draftFilters.startDate}
                        onChange={e => setDraftFilters(prev => ({...prev, startDate: e.target.value}))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                    <span className="text-gray-400">～</span>
                    <input 
                        type="date" 
                        value={draftFilters.endDate}
                        onChange={e => setDraftFilters(prev => ({...prev, endDate: e.target.value}))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">チーム名（部分一致）</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="A軍, B軍 (正規表現可)" 
                        value={draftFilters.teamKeyword}
                        onChange={e => setDraftFilters(prev => ({...prev, teamKeyword: e.target.value}))}
                        className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">大会・カテゴリ</label>
                <select 
                    value={draftFilters.category}
                    onChange={e => setDraftFilters(prev => ({...prev, category: e.target.value}))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                >
                    <option value="all">全て</option>
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-end gap-2">
                <button 
                    onClick={handleApply}
                    className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                    適用
                </button>
                <button 
                    onClick={() => setDraftFilters(clearedFilters)}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    クリア
                </button>
                <button 
                    onClick={() => setDraftFilters(defaultFilters)}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    <RefreshCw size={14} className="mr-2" />
                    リセット
                </button>
            </div>
        </div>
    </Card>
  );
});

export default FilterPanel;
