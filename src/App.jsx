import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Database, Trash2, Users, LineChart as LineChartIcon, BarChart2 } from 'lucide-react';

// --- Components ---
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav'; // Assuming MobileNav is created

// --- Default Data (Import from files) ---
import DEFAULT_BATTING_CSV_URL from './data/scorer_stats_raw_b.csv?url';
import DEFAULT_PITCHING_CSV_URL from './data/scorer_stats_raw_p.csv?url';

// --- Utils ---
import { parseCSV } from './utils/csv';
import { parseDate } from './utils/date';

// --- Hooks ---
import { useAggregatedStats } from './hooks/useAggregatedStats';
import { useTrendStats } from './hooks/useTrendStats';

// --- Views ---
import DashboardView from './views/DashboardView';
import TrendsView from './views/TrendsView';
import ComparisonView from './views/ComparisonView';

const ImportSection = ({ onFileUpload, importStatus, lastUpdated, onClearData }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-lg mx-auto">
    <div className="text-center">
      <Database className="mx-auto h-12 w-12 text-primary-500" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">データをインポート</h3>
      <p className="mt-1 text-sm text-gray-500">
        `scorer_stats_raw_*.csv` ファイルを選択してください。（複数選択可）
      </p>
      <div className="mt-6 flex justify-center flex-col items-center gap-4">
        <label className="relative cursor-pointer bg-primary-600 rounded-md font-medium text-white hover:bg-primary-700 px-6 py-2 shadow-sm transition-all">
          <span>ファイルを選択</span>
          <input 
            id="file-upload" 
            name="file-upload" type="file" className="sr-only" multiple accept=".csv"
            onChange={onFileUpload}
          />
        </label>
        {importStatus && <span className="text-sm text-primary-600 font-semibold animate-pulse">{importStatus}</span>}
      </div>
      
      <div className="mt-8">
          <p className="text-xs text-gray-400 mb-2">※ 初期状態に戻すには「データをクリア」を押してください</p>
      </div>
    </div>
    {lastUpdated && (
      <div className="mt-6 pt-4 border-t flex justify-between items-center">
        <span className="text-xs text-gray-400">最終更新: {lastUpdated}</span>
        <button 
          onClick={onClearData}
          className="flex items-center text-xs text-red-500 hover:text-red-700"
        >
          <Trash2 size={12} className="mr-1" />
          データをクリア
        </button>
      </div>
    )}
  </div>
);


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [battingData, setBattingData] = useState([]);
  const [pitchingData, setPitchingData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [importStatus, setImportStatus] = useState("");

  const defaultFilters = useMemo(() => ({
    startDate: '2025-10-01',
    endDate: '',
    teamKeyword: '', 
    category: 'all', 
  }), []);

  const clearedFilters = useMemo(() => ({
    startDate: '',
    endDate: '',
    teamKeyword: '', 
    category: 'all', 
  }), []);

  // Filter State
  const [activeFilters, setActiveFilters] = useState(defaultFilters);

  // Trends/Analysis State
  const [trendTarget, setTrendTarget] = useState('team'); 
  const [trendType, setTrendType] = useState('batting'); 
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('monthly');

  // Comparison State
  const [comparisonMetric, setComparisonMetric] = useState('avg');
  const [comparisonMinPA, setComparisonMinPA] = useState(0); 
  const [comparisonChartType, setComparisonChartType] = useState('ranking');
  const [scatterX, setScatterX] = useState('obp');
  const [scatterY, setScatterY] = useState('slg');
  const [showScatterLabels, setShowScatterLabels] = useState(false);
  const [comparisonDataType, setComparisonDataType] = useState('batting');
  const [showAllInRankings, setShowAllInRankings] = useState(false);
  const [comparisonSelectedPlayers, setComparisonSelectedPlayers] = useState([]);
  const [comparisonTrendPeriod, setComparisonTrendPeriod] = useState('monthly');

  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'ダッシュボード', icon: BarChart2 },
    { id: 'trends', label: 'トレンド分析', icon: LineChartIcon },
    { id: 'comparison', label: '選手比較', icon: Users },
    { id: 'import', label: 'データ管理', icon: Database },
  ], []);

  // Categories & Players List
  const { categories, playerList } = useMemo(() => {
    const cats = new Set();
    const players = new Map();
    [...battingData, ...pitchingData].forEach(row => {
      if (row['タイトル']) cats.add(row['タイトル']);
      const pid = row['選手ID'] || row['名前'];
      if (pid && !players.has(pid)) {
        players.set(pid, { id: pid, name: row['名前'], number: row['背番号'] });
      }
    });
    const sortedPlayers = Array.from(players.values()).sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999));
    return { categories: Array.from(cats).sort(), playerList: sortedPlayers };
  }, [battingData, pitchingData]);

  useEffect(() => {
    if (playerList.length > 0 && !selectedPlayerId) {
        setSelectedPlayerId(playerList[0].id);
    }
  }, [playerList, selectedPlayerId]);

  const battingMetricOptions = useMemo(() => [
      { v: 'avg', l: '打率' }, { v: 'ops', l: 'OPS' }, { v: 'hr', l: '本塁打' },
      { v: 'rbi', l: '打点' }, { v: 'sb', l: '盗塁' }, { v: 'obp', l: '出塁率' },
      { v: 'slg', l: '長打率' }, { v: 'bb', l: '四球' }, { v: 'so', l: '三振' }
  ], []);
  const pitchingMetricOptions = useMemo(() => [
      { v: 'era', l: '防御率' }, { v: 'whip', l: 'WHIP' }, { v: 'kbb', l: 'K/BB' },
      { v: 'so', l: '奪三振' }, { v: 'win', l: '勝利数' }, { v: 'displayInnings', l: '投球回' }
  ], []);

  useEffect(() => {
    if (comparisonDataType === 'batting') {
        setScatterX('obp');
        setScatterY('slg');
    } else {
        setScatterX('era');
        setScatterY('whip');
    }
  }, [comparisonDataType]);

  useEffect(() => {
    const currentOptions = comparisonDataType === 'batting' ? battingMetricOptions : pitchingMetricOptions;
    if (!currentOptions.some(o => o.v === comparisonMetric)) {
        setComparisonMetric(comparisonDataType === 'batting' ? 'avg' : 'era');
    }
  }, [comparisonDataType, comparisonMetric, battingMetricOptions, pitchingMetricOptions]);

  useEffect(() => {
    const savedBatting = localStorage.getItem('bb_stats_batting');
    const savedPitching = localStorage.getItem('bb_stats_pitching');
    const savedDate = localStorage.getItem('bb_stats_date');
    if (savedBatting && JSON.parse(savedBatting).length > 0) {
      setBattingData(JSON.parse(savedBatting));
      if (savedPitching) setPitchingData(JSON.parse(savedPitching));
      if (savedDate) setLastUpdated(savedDate);
    } else {
      loadDefaultData();
    }
  }, []);

  const loadDefaultData = async () => {
    try {
      const [battingRes, pitchingRes] = await Promise.all([fetch(DEFAULT_BATTING_CSV_URL), fetch(DEFAULT_PITCHING_CSV_URL)]);
      const [battingText, pitchingText] = await Promise.all([battingRes.text(), pitchingRes.text()]);
      setBattingData(parseCSV(battingText));
      setPitchingData(parseCSV(pitchingText));
      const now = new Date().toLocaleString('ja-JP');
      setLastUpdated(now + " (サンプル)");
    } catch (error) {
      console.error("Error loading default CSV data:", error);
      setImportStatus("サンプルの読み込みに失敗しました。");
    }
  };

  const handleFileUpload = async (event) => {
    setImportStatus("読み込み中...");
    const files = Array.from(event.target.files);
    let newBatting = [], newPitching = [];
    for (const file of files) {
      const text = await file.text();
      const data = parseCSV(text);
      if (file.name.includes('_b.csv') || (data[0] && '打席数' in data[0])) newBatting = data;
      else if (file.name.includes('_p.csv') || (data[0] && ('投球回' in data[0] || '球数' in data[0]))) newPitching = data;
    }
    setBattingData(current => newBatting.length > 0 ? newBatting : current);
    setPitchingData(current => newPitching.length > 0 ? newPitching : current);
    const now = new Date().toLocaleString('ja-JP');
    localStorage.setItem('bb_stats_batting', JSON.stringify(newBatting.length > 0 ? newBatting : battingData));
    localStorage.setItem('bb_stats_pitching', JSON.stringify(newPitching.length > 0 ? newPitching : pitchingData));
    localStorage.setItem('bb_stats_date', now);
    setLastUpdated(now);
    setImportStatus(`${files.length}ファイルをインポートしました`);
    setTimeout(() => setImportStatus(""), 3000);
  };

  const clearData = () => {
    if (window.confirm("全てのデータを削除しますか？\n（削除後は初期サンプルデータに戻ります）")) {
      localStorage.removeItem('bb_stats_batting');
      localStorage.removeItem('bb_stats_pitching');
      localStorage.removeItem('bb_stats_date');
      loadDefaultData();
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const filterData = useCallback((data, filters) => {
    return data.filter(row => {
      const rowDate = parseDate(row['日付']);
      if (!rowDate) return true; // Keep rows with invalid dates? Maybe filter them out.
      
      const start = filters.startDate ? parseDate(filters.startDate) : null;
      const end = filters.endDate ? parseDate(filters.endDate) : null;
      
      if (start && rowDate < start) return false;
      if (end && rowDate > end) return false;
      if (filters.teamKeyword && !`${row['先攻']}${row['後攻']}`.includes(filters.teamKeyword)) return false;
      if (filters.category !== 'all' && row['タイトル'] !== filters.category) return false;
      
      return true;
    });
  }, []);

  const filteredBattingData = useMemo(() => filterData(battingData, activeFilters), [battingData, activeFilters, filterData]);
  const filteredPitchingData = useMemo(() => filterData(pitchingData, activeFilters), [pitchingData, activeFilters, filterData]);

  const { aggregatedBatting, aggregatedPitching, teamStats } = useAggregatedStats(filteredBattingData, filteredPitchingData);
  const { monthlyBattingTrend, monthlyPitchingTrend, teamTrendData, gameByGameStats, playerBattingTrendData, playerPitchingTrendData, multiPlayerTrendData } = useTrendStats(
    filteredBattingData, filteredPitchingData, trendPeriod, trendTarget, trendType, selectedPlayerId, 
    comparisonChartType, comparisonSelectedPlayers, comparisonTrendPeriod, comparisonDataType
  );

  const renderContent = () => {
    const viewProps = { activeFilters, categories, defaultFilters, clearedFilters, onApplyFilters: setActiveFilters };
    switch (activeTab) {
      case 'dashboard': return <DashboardView {...viewProps} teamStats={teamStats} aggregatedBatting={aggregatedBatting} monthlyBattingTrend={monthlyBattingTrend} monthlyPitchingTrend={monthlyPitchingTrend} gameByGameStats={gameByGameStats} />;
      case 'trends': return <TrendsView 
            activeFilters={activeFilters}
            onApplyFilters={setActiveFilters}
            categories={categories}
            defaultFilters={defaultFilters}
            clearedFilters={clearedFilters}
            trendTarget={trendTarget} 
            setTrendTarget={setTrendTarget} 
            trendType={trendType} 
            setTrendType={setTrendType} 
            playerList={playerList} 
            selectedPlayerId={selectedPlayerId} 
            setSelectedPlayerId={setSelectedPlayerId} 
            trendPeriod={trendPeriod} 
            setTrendPeriod={setTrendPeriod} 
            teamTrendData={teamTrendData} 
            playerBattingTrendData={playerBattingTrendData} 
            playerPitchingTrendData={playerPitchingTrendData} 
        />;
      case 'comparison': return <ComparisonView {...viewProps} comparisonMetric={comparisonMetric} setComparisonMetric={setComparisonMetric} comparisonMinPA={comparisonMinPA} setComparisonMinPA={setComparisonMinPA} comparisonChartType={comparisonChartType} setComparisonChartType={setComparisonChartType} scatterX={scatterX} setScatterX={setScatterX} scatterY={scatterY} setScatterY={setScatterY} showScatterLabels={showScatterLabels} setShowScatterLabels={setShowScatterLabels} comparisonDataType={comparisonDataType} setComparisonDataType={setComparisonDataType} showAllInRankings={showAllInRankings} comparisonSelectedPlayers={comparisonSelectedPlayers} setComparisonSelectedPlayers={setComparisonSelectedPlayers} comparisonTrendPeriod={comparisonTrendPeriod} setComparisonTrendPeriod={setComparisonTrendPeriod} battingMetricOptions={battingMetricOptions} pitchingMetricOptions={pitchingMetricOptions} playerList={playerList} multiPlayerTrendData={multiPlayerTrendData} aggregatedBatting={aggregatedBatting} aggregatedPitching={aggregatedPitching} />;
      case 'import': return <ImportSection onFileUpload={handleFileUpload} importStatus={importStatus} lastUpdated={lastUpdated} onClearData={clearData} />;
      default: return <div>Not Found</div>;
    }
  };

  const pageTitle = navItems.find(item => item.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex">
      <Sidebar 
        activeTab={activeTab}
        onNavClick={handleNavClick}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        navItems={navItems}
      />
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavClick={handleNavClick}
        activeTab={activeTab}
        navItems={navItems}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          title={pageTitle}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
