import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Database, TrendingUp, Save, Trash2, Filter, Menu, X, BookOpen, HelpCircle, Users, LineChart as LineChartIcon, BarChart2 } from 'lucide-react';

// --- Default Data (Import from files) ---
import DEFAULT_BATTING_CSV_URL from './data/scorer_stats_raw_b.csv?url';
import DEFAULT_PITCHING_CSV_URL from './data/scorer_stats_raw_p.csv?url';

// --- Utils ---
import { parseCSV } from './utils/csv';
import { parseDate } from './utils/date';
import { formatRate } from './utils/formatters';

// --- Hooks ---
import { useAggregatedStats } from './hooks/useAggregatedStats';
import { useTrendStats } from './hooks/useTrendStats';

// --- Views ---
import DashboardView from './views/DashboardView';
import TrendsView from './views/TrendsView';
import ComparisonView from './views/ComparisonView';

// --- Components ---
import Card from './components/Card';

const ImportSection = ({ onFileUpload, importStatus, lastUpdated, onClearData }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
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
  const [comparisonChartType, setComparisonChartType] = useState('ranking'); // 'ranking', 'scatter', 'all', 'chart-all', 'player-comparison'
  const [scatterX, setScatterX] = useState('obp');
  const [scatterY, setScatterY] = useState('slg');
  const [showScatterLabels, setShowScatterLabels] = useState(false);
  const [comparisonDataType, setComparisonDataType] = useState('batting');
  const [showAllInRankings, setShowAllInRankings] = useState(false);

  // New State for Player Comparison
  const [comparisonSelectedPlayers, setComparisonSelectedPlayers] = useState([]); // Array of player IDs
  const [comparisonTrendPeriod, setComparisonTrendPeriod] = useState('monthly');

  // Categories & Players List
  const { categories, playerList } = useMemo(() => {
    const cats = new Set();
    const players = new Map();

    battingData.forEach(row => {
        if (row['タイトル']) cats.add(row['タイトル']);
        const pid = row['選手ID'] || row['名前'];
        if (!players.has(pid)) {
            players.set(pid, { id: pid, name: row['名前'], number: row['背番号'] });
        }
    });

    pitchingData.forEach(row => {
        const pid = row['選手ID'] || row['名前'];
        if (!players.has(pid)) {
            players.set(pid, { id: pid, name: row['名前'], number: row['背番号'] });
        }
    });
    
    const sortedPlayers = Array.from(players.values()).sort((a, b) => {
        const numA = parseInt(a.number) || 999;
        const numB = parseInt(b.number) || 999;
        return numA - numB;
    });

    return { 
        categories: Array.from(cats).sort(),
        playerList: sortedPlayers
    };
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
    // Reset scatter metrics when switching between batting/pitching analysis
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
        if (comparisonDataType === 'batting') {
            setComparisonMetric('avg');
        } else { // pitching
            setComparisonMetric('era');
        }
    }
  }, [comparisonDataType, comparisonMetric, battingMetricOptions, pitchingMetricOptions]);

  // Load data & Initialize Default Data
  useEffect(() => {
    const savedBatting = localStorage.getItem('bb_stats_batting');
    const savedPitching = localStorage.getItem('bb_stats_pitching');
    const savedDate = localStorage.getItem('bb_stats_date');

    if (savedBatting && JSON.parse(savedBatting).length > 0) {
      setBattingData(JSON.parse(savedBatting));
      if (savedPitching) setPitchingData(JSON.parse(savedPitching));
      if (savedDate) setLastUpdated(savedDate);
    } else {
      // Load Default Data if empty
      loadDefaultData();
    }
  }, []);

  const loadDefaultData = async () => {
    try {
      const [battingRes, pitchingRes] = await Promise.all([
        fetch(DEFAULT_BATTING_CSV_URL),
        fetch(DEFAULT_PITCHING_CSV_URL)
      ]);
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

  // --- Handlers ---

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    let newBatting = [...battingData];
    let newPitching = [...pitchingData];
    let importedCount = 0;

    setImportStatus("読み込み中...");

    for (const file of files) {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (file.name.includes('_b.csv') || (data[0] && '打席数' in data[0])) {
        newBatting = data; 
        importedCount++;
      } else if (file.name.includes('_p.csv') || (data[0] && '投球回' in data[0] || '球数' in data[0])) {
        newPitching = data;
        importedCount++;
      }
    }

    setBattingData(newBatting);
    setPitchingData(newPitching);
    
    const now = new Date().toLocaleString('ja-JP');
    localStorage.setItem('bb_stats_batting', JSON.stringify(newBatting));
    localStorage.setItem('bb_stats_pitching', JSON.stringify(newPitching));
    localStorage.setItem('bb_stats_date', now);
    setLastUpdated(now);
    setImportStatus(`${importedCount}ファイルをインポートしました`);
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

  // --- Filtering Logic ---

  const filterData = useCallback((data, filtersToUse) => {
    return data.filter(row => {
        const rowDate = parseDate(row['日付']); // Correctly parsed as local time midnight
        let start = null;
        if (filtersToUse.startDate) {
            start = parseDate(filtersToUse.startDate); // Use the same robust parsing
        }
        let end = null;
        if (filtersToUse.endDate) {
            end = parseDate(filtersToUse.endDate);
            end.setDate(end.getDate() + 1); // Get the very start of the next day
        }

        if (start && rowDate < start) return false;
        if (end && rowDate >= end) return false;

        if (filtersToUse.teamKeyword) {
            const kw = filtersToUse.teamKeyword;
            const teamA = (row['先攻'] || '');
            const teamB = (row['後攻'] || '');
            let isMatch;
            try {
                const regex = new RegExp(kw, 'i');
                isMatch = regex.test(teamA) || regex.test(teamB);
            } catch (e) {
                const lowerKw = kw.toLowerCase();
                isMatch = teamA.toLowerCase().includes(lowerKw) || teamB.toLowerCase().includes(lowerKw);
            }
            if (!isMatch) return false;
        }

        if (filtersToUse.category !== 'all' && row['タイトル'] !== filtersToUse.category) return false;

        return true;
    });
  }, []);

  const filteredBattingData = useMemo(() => filterData(battingData, activeFilters), [battingData, activeFilters, filterData]);
  const filteredPitchingData = useMemo(() => filterData(pitchingData, activeFilters), [pitchingData, activeFilters, filterData]);

  // --- Aggregation & Trend Hooks ---
  const { aggregatedBatting, aggregatedPitching, teamStats } = useAggregatedStats(filteredBattingData, filteredPitchingData);
  const { monthlyBattingTrend, monthlyPitchingTrend, teamTrendData, gameByGameStats, playerBattingTrendData, playerPitchingTrendData, multiPlayerTrendData } = useTrendStats(
    filteredBattingData, 
    filteredPitchingData, 
    trendPeriod, 
    trendTarget, 
    trendType, 
    selectedPlayerId, 
    comparisonChartType,
    comparisonSelectedPlayers,
    comparisonTrendPeriod,
    comparisonDataType
  );


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView 
            activeFilters={activeFilters}
            categories={categories}
            defaultFilters={defaultFilters}
            clearedFilters={clearedFilters}
            onApplyFilters={setActiveFilters}
            teamStats={teamStats}
            aggregatedBatting={aggregatedBatting}
            monthlyBattingTrend={monthlyBattingTrend}
            monthlyPitchingTrend={monthlyPitchingTrend}
            gameByGameStats={gameByGameStats}
        />;
      case 'trends':
        return <TrendsView 
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
      case 'comparison':
        return <ComparisonView
            activeFilters={activeFilters}
            categories={categories}
            defaultFilters={defaultFilters}
            clearedFilters={clearedFilters}
            onApplyFilters={setActiveFilters}
            comparisonMetric={comparisonMetric}
            setComparisonMetric={setComparisonMetric}
            comparisonMinPA={comparisonMinPA}
            setComparisonMinPA={setComparisonMinPA}
            comparisonChartType={comparisonChartType}
            setComparisonChartType={setComparisonChartType}
            scatterX={scatterX}
            setScatterX={setScatterX}
            scatterY={scatterY}
            setScatterY={setScatterY}
            showScatterLabels={showScatterLabels}
            setShowScatterLabels={setShowScatterLabels}
            comparisonDataType={comparisonDataType}
            setComparisonDataType={setComparisonDataType}
            showAllInRankings={showAllInRankings}
            comparisonSelectedPlayers={comparisonSelectedPlayers}
            setComparisonSelectedPlayers={setComparisonSelectedPlayers}
            comparisonTrendPeriod={comparisonTrendPeriod}
            setComparisonTrendPeriod={setComparisonTrendPeriod}
            battingMetricOptions={battingMetricOptions}
            pitchingMetricOptions={pitchingMetricOptions}
            playerList={playerList}
            multiPlayerTrendData={multiPlayerTrendData}
            aggregatedBatting={aggregatedBatting}
            aggregatedPitching={aggregatedPitching}
        />;
      case 'import':
        return <ImportSection 
          onFileUpload={handleFileUpload}
          importStatus={importStatus}
          lastUpdated={lastUpdated}
          onClearData={clearData}
        />;
      default:
        return <div>Not Found</div>;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: BarChart2 },
    { id: 'trends', label: 'トレンド分析', icon: LineChartIcon },
    { id: 'comparison', label: '選手比較', icon: Users },
    { id: 'import', label: 'データ管理', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${isMenuOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col`}>
          <div className="flex items-center justify-center h-16 border-b">
              <img src="/logo.png" alt="Ants" className={`transition-all ${isMenuOpen ? 'h-10' : 'h-8'}`} />
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
              {navItems.map(item => (
                  <button 
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
                      title={item.label}
                  >
                      <item.icon size={20} />
                      {isMenuOpen && <span className="ml-4 font-semibold">{item.label}</span>}
                  </button>
              ))}
          </nav>
          <div className="p-4 border-t">
              <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  {isMenuOpen && <span className="ml-4 font-semibold">折りたたむ</span>}
              </button>
          </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm flex items-center justify-between p-4 border-b md:hidden">
              <img src="/logo.png" alt="Ants" className="h-8" />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
          </header>

          {/* Mobile Menu */}
          {isMenuOpen && (
              <div className="md:hidden bg-white border-b">
                  <nav className="p-4 space-y-2">
                      {navItems.map(item => (
                          <button 
                              key={item.id}
                              onClick={() => handleNavClick(item.id)}
                              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                              <item.icon size={20} />
                              <span className="ml-4 font-semibold">{item.label}</span>
                          </button>
                      ))}
                  </nav>
              </div>
          )}

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              {renderContent()}
          </main>
      </div>
    </div>
  );
}
