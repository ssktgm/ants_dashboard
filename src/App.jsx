import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, ScatterChart, Scatter, ZAxis, ReferenceLine, LabelList, AreaChart, Area
} from 'recharts';
import { Upload, Database, TrendingUp, Activity, Save, Trash2, Filter, AlertCircle, Award, Search, Calendar, RefreshCw, LineChart as LineChartIcon, BarChart2, Menu, X, BookOpen, HelpCircle } from 'lucide-react';

// --- Default Data (Import from files) ---
import DEFAULT_BATTING_CSV_URL from './data/scorer_stats_raw_b.csv?url';
import DEFAULT_PITCHING_CSV_URL from './data/scorer_stats_raw_p.csv?url';

// --- Helper Functions ---

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  let headerLine = lines[0];
  // Remove BOM (Byte Order Mark) if it exists at the beginning of the file
  if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.substring(1);
  }
  const headers = headerLine.split(',').map(h => h.trim());
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const currentline = lines[i].split(',');
    if (currentline.length <= 1) continue;
    
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = currentline[j] ? currentline[j].trim() : '';
      if (!['選手ID', '名前', '日付', '試合ID', 'スコア', 'カテゴリ', '球場', 'タイトル', '背番号', '先攻', '後攻'].includes(headers[j])) {
         if (!isNaN(val) && val !== '') {
             val = Number(val);
         }
      }
      obj[headers[j]] = val;
    }
    result.push(obj);
  }
  return result;
};

const safeDiv = (a, b) => b === 0 ? 0 : a / b;

const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            // Create date and check if it's valid. Month is 0-indexed.
            const d = new Date(year, month - 1, day);
            if (!isNaN(d.getTime())) {
                return d;
            }
        }
    }
    // Fallback for other formats or if parsing failed
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) {
        return fallback;
    }
    // If all else fails, return a safe, known date instead of 'Invalid Date'
    return new Date(0);
};

const formatRate = (rate, leadingZero = false) => {
    if (typeof rate !== 'number' || isNaN(rate)) return rate;
    const formatted = rate.toFixed(3);
    return leadingZero ? formatted : formatted.replace(/^0/, '');
};

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>{children}</div>
);

const StatCard = ({ title, value, subValue, icon: Icon, color = "blue" }) => (
  <Card className={`flex items-center space-x-4 border-l-4 border-primary-500`}>
    <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
    </div>
  </Card>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [battingData, setBattingData] = useState([]);
  const [pitchingData, setPitchingData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [importStatus, setImportStatus] = useState("");

  // Home view state
  const [showHomeScatterLabels, setShowHomeScatterLabels] = useState(false);

  // Filter State
  const [activeFilters, setActiveFilters] = useState({
    startDate: '2025-10-01',
    endDate: '',
    teamKeyword: '', 
    category: 'all', 
  });
  const [draftFilters, setDraftFilters] = useState(activeFilters);

  useEffect(() => { setDraftFilters({...activeFilters}) }, [activeFilters]);

  // Trends/Analysis State
  const [trendTarget, setTrendTarget] = useState('team'); 
  const [trendType, setTrendType] = useState('batting'); 
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('monthly');

  // Comparison State
  const [comparisonMetric, setComparisonMetric] = useState('avg');
  const [comparisonMinPA, setComparisonMinPA] = useState(0); // Minimum PA/Innings
  const [comparisonChartType, setComparisonChartType] = useState('ranking'); // 'ranking' or 'scatter'
  const [scatterX, setScatterX] = useState('obp');
  const [scatterY, setScatterY] = useState('slg');
  const [showScatterLabels, setShowScatterLabels] = useState(false);
  const [comparisonDataType, setComparisonDataType] = useState('batting');
  const [showAllInRankings, setShowAllInRankings] = useState(false);

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
  }, [playerList]);

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

  const resetFilters = () => {
      setActiveFilters({
        startDate: '',
        endDate: '',
        teamKeyword: '',
        category: 'all',
      });
  };

  // --- Filtering Logic ---

  const filterData = (data, filtersToUse) => {
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
  };

  const filteredBattingData = useMemo(() => filterData(battingData, activeFilters), [battingData, activeFilters]);
  const filteredPitchingData = useMemo(() => filterData(pitchingData, activeFilters), [pitchingData, activeFilters]);

  // --- Aggregation Logic ---

  const aggregatedBatting = useMemo(() => {
    const stats = {};
    filteredBattingData.forEach(row => {
      const id = row['選手ID'] || row['名前'];
      if (!stats[id]) {
        stats[id] = {
          id: row['選手ID'], name: row['名前'], number: row['背番号'],
          games: 0, pa: 0, ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, 
          rbi: 0, runs: 0, so: 0, bb: 0, hbp: 0, sb: 0, sf: 0, sac: 0
        };
      }
      const s = stats[id];
      s.games += 1;
      s.pa += (row['打席数'] || 0);
      s.ab += (row['打数'] || 0);
      s.h += (row['安打'] || 0);
      s.doubles += (row['二塁打'] || 0);
      s.triples += (row['三塁打'] || 0);
      s.hr += (row['本塁打'] || 0);
      s.rbi += (row['打点'] || 0);
      s.runs += (row['得点'] || 0);
      s.so += (row['三振'] || 0);
      s.bb += (row['四球'] || 0);
      s.hbp += (row['死球'] || 0);
      s.sb += (row['盗塁'] || 0);
      s.sf += (row['犠飛'] || 0);
      s.sac += (row['犠打'] || 0);
    });

    return Object.values(stats).map(s => {
      const avg = safeDiv(s.h, s.ab);
      const obp = safeDiv(s.h + s.bb + s.hbp, s.ab + s.bb + s.hbp + s.sf);
      const singles = s.h - s.doubles - s.triples - s.hr;
      const totalBases = singles + (s.doubles * 2) + (s.triples * 3) + (s.hr * 4);
      const slg = safeDiv(totalBases, s.ab);
      const ops = obp + slg;
      const bbK = safeDiv(s.bb + s.hbp, s.so);
      const isoD = obp - avg;

      return {
        ...s,
        avg: Number(avg.toFixed(3)),
        obp: Number(obp.toFixed(3)), 
        slg: Number(slg.toFixed(3)), 
        ops: Number(ops.toFixed(3)), 
        bbK: Number(bbK.toFixed(2)),
        isoD: Number(isoD.toFixed(3))
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [filteredBattingData]);

  const aggregatedPitching = useMemo(() => {
    const stats = {};
    filteredPitchingData.forEach(row => {
      const id = row['選手ID'] || row['名前'];
      if (!stats[id]) {
        stats[id] = {
          id: row['選手ID'], name: row['名前'], number: row['背番号'],
          games: 0, outs: 0, h: 0, r: 0, er: 0, bb: 0, hbp: 0, so: 0, win: 0, loss: 0, sv: 0
        };
      }
      const s = stats[id];
      s.games += 1;
      s.outs += (row['アウト数'] || 0);
      s.h += (row['安打'] || 0);
      s.r += (row['失点'] || 0);
      s.er += (row['自責点'] || 0);
      s.bb += (row['四球'] || 0);
      s.hbp += (row['死球'] || 0);
      s.so += (row['三振'] || 0);
      s.win += (row['勝数'] || 0);
      s.loss += (row['負数'] || 0);
      s.sv += (row['セーブ'] || 0);
    });

    return Object.values(stats).map(s => {
      const displayInnings = `${Math.floor(s.outs / 3)}${s.outs % 3 > 0 ? '.' + (s.outs % 3) : ''}`;
      const era = safeDiv(s.er * 7, s.outs / 3);
      const whip = safeDiv(s.bb + s.hbp + s.h, s.outs / 3);
      const kbb = safeDiv(s.so, s.bb);

      return {
        ...s,
        displayInnings, 
        era: Number(era.toFixed(2)), 
        whip: Number(whip.toFixed(2)), 
        kbb: Number(kbb.toFixed(2)),
        inningsVal: s.outs / 3
      };
    }).sort((a, b) => a.era - b.era);
  }, [filteredPitchingData]);

  const teamStats = useMemo(() => {
    if (filteredBattingData.length === 0) return null;
    const gameIds = new Set(filteredBattingData.map(r => r['試合ID']));
    const totalAB = aggregatedBatting.reduce((acc, cur) => acc + cur.ab, 0);
    const totalH = aggregatedBatting.reduce((acc, cur) => acc + cur.h, 0);
    const totalR = aggregatedBatting.reduce((acc, cur) => acc + cur.runs, 0);
    const totalHR = aggregatedBatting.reduce((acc, cur) => acc + cur.hr, 0);
    const teamAvg = safeDiv(totalH, totalAB).toFixed(3);
    const totalER = aggregatedPitching.reduce((acc, cur) => acc + cur.er, 0);
    const totalOuts = aggregatedPitching.reduce((acc, cur) => acc + cur.outs, 0);
    const teamERA = safeDiv(totalER * 7, totalOuts / 3).toFixed(2);
    return { totalGames: gameIds.size, teamAvg, totalR, totalHR, teamERA };
  }, [filteredBattingData, aggregatedBatting, aggregatedPitching]);

  const monthlyBattingTrend = useMemo(() => {
    const periods = {};
    filteredBattingData.forEach(row => {
        const d = parseDate(row['日付']);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!periods[key]) periods[key] = { month: key, ab: 0, h: 0, runs: 0, bb: 0, hbp: 0, sf: 0, doubles: 0, triples: 0, hr: 0 };
        
        const p = periods[key];
        p.ab += (row['打数'] || 0);
        p.h += (row['安打'] || 0);
        p.runs += (row['得点'] || 0);
        p.bb += (row['四球'] || 0);
        p.hbp += (row['死球'] || 0);
        p.sf += (row['犠飛'] || 0);
        p.doubles += (row['二塁打'] || 0);
        p.triples += (row['三塁打'] || 0);
        p.hr += (row['本塁打'] || 0);
    });
    
    return Object.values(periods).sort((a, b) => a.month.localeCompare(b.month)).map(m => {
       const avg = safeDiv(m.h, m.ab);
       const obp = safeDiv(m.h + m.bb + m.hbp, m.ab + m.bb + m.hbp + m.sf);
       const slg = safeDiv((m.h - m.doubles - m.triples - m.hr) + m.doubles*2 + m.triples*3 + m.hr*4, m.ab);
       return { ...m, avg: Number(avg.toFixed(3)), ops: Number((obp + slg).toFixed(3)) };
    });
  }, [filteredBattingData]);

  const monthlyPitchingTrend = useMemo(() => {
    const periods = {};
    filteredPitchingData.forEach(row => {
        const d = parseDate(row['日付']);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!periods[key]) periods[key] = { month: key, h: 0, bb: 0, hbp: 0, so: 0, s: 0, pitches: 0 };
        const p = periods[key];
        p.h += (row['安打'] || 0);
        p.bb += (row['四球'] || 0);
        p.hbp += (row['死球'] || 0);
        p.so += (row['三振'] || 0);
        p.s += (row['S数'] || 0);
        p.pitches += (row['球数'] || 0);
    });
    
    return Object.values(periods).sort((a, b) => a.month.localeCompare(b.month)).map(m => {
        const strikeRate = safeDiv(m.s, m.pitches) * 100;
        return { ...m, bbhbp: m.bb + m.hbp, strikeRate: Number(strikeRate.toFixed(1)) };
    });
  }, [filteredPitchingData]);

  const teamTrendData = useMemo(() => {
    const getKey = (row, period) => {
        const d = parseDate(row['日付']);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (period) {
            case 'game':
                const homeTeam = row['後攻'] || '';
                const awayTeam = row['先攻'] || '';
                const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
                const opponent = isHomeArinko ? awayTeam : homeTeam;
                return `${row['日付']} vs ${opponent || '不明'}`;
            case 'quarterly':
                const quarter = Math.floor(month / 3) + 1;
                return `${year}-Q${quarter}`;
            case 'monthly':
            default:
                return `${year}-${(month + 1).toString().padStart(2, '0')}`;
        }
    };

    // Batting aggregation
    const battingPeriods = {};
    filteredBattingData.forEach(row => {
        const key = getKey(row, trendPeriod);
        if (!key) return;
        if (!battingPeriods[key]) battingPeriods[key] = { periodKey: key, ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, runs: 0, doubles: 0, triples: 0, hr: 0, so: 0, sb: 0 };
        
        const p = battingPeriods[key];
        p.ab += (row['打数'] || 0);
        p.h += (row['安打'] || 0);
        p.runs += (row['得点'] || 0);
        p.bb += (row['四球'] || 0);
        p.hbp += (row['死球'] || 0);
        p.sf += (row['犠飛'] || 0);
        p.doubles += (row['二塁打'] || 0);
        p.triples += (row['三塁打'] || 0);
        p.hr += (row['本塁打'] || 0);
        p.so += (row['三振'] || 0);
        p.sb += (row['盗塁'] || 0);
    });
    
    const battingResult = Object.values(battingPeriods).sort((a, b) => a.periodKey.localeCompare(b.periodKey)).map(m => {
       const avg = safeDiv(m.h, m.ab);
       const obp = safeDiv(m.h + m.bb + m.hbp, m.ab + m.bb + m.hbp + m.sf);
       const slg = safeDiv((m.h - m.doubles - m.triples - m.hr) + m.doubles*2 + m.triples*3 + m.hr*4, m.ab);
       const pa = m.ab + m.bb + m.hbp + m.sf;
       const bbRate = safeDiv(m.bb + m.hbp, pa) * 100;
       const soRate = safeDiv(m.so, pa) * 100;
       return {
          ...m,
          avg: Number(avg.toFixed(3)),
          ops: Number((obp + slg).toFixed(3)),
          bbRate: Number(bbRate.toFixed(1)),
          soRate: Number(soRate.toFixed(1)),
       };
    });

    // Pitching aggregation
    const pitchingPeriods = {};
    filteredPitchingData.forEach(row => {
        const key = getKey(row, trendPeriod);
        if (!key) return;
        if (!pitchingPeriods[key]) pitchingPeriods[key] = { periodKey: key, outs: 0, er: 0, h: 0, bb: 0, hbp: 0, so: 0, s: 0, pitches: 0 };
        
        const p = pitchingPeriods[key];
        p.outs += (row['アウト数'] || 0);
        p.er += (row['自責点'] || 0);
        p.h += (row['安打'] || 0);
        p.bb += (row['四球'] || 0);
        p.hbp += (row['死球'] || 0);
        p.so += (row['三振'] || 0);
        p.s += (row['S数'] || 0);
        p.pitches += (row['球数'] || 0);
    });
    
    const pitchingResult = Object.values(pitchingPeriods).sort((a, b) => a.periodKey.localeCompare(b.periodKey)).map(m => {
        const innings = m.outs / 3;
        const era = safeDiv(m.er * 7, innings);
        const whip = safeDiv(m.h + m.bb + m.hbp, innings);
        const kPer7 = safeDiv(m.so * 7, innings);
        const bbPer7 = safeDiv((m.bb + m.hbp) * 7, innings);
        const strikeRate = safeDiv(m.s, m.pitches) * 100;
        return { ...m, bbhbp: m.bb + m.hbp, era: Number(era.toFixed(2)), whip: Number(whip.toFixed(2)), kPer7: Number(kPer7.toFixed(2)), bbPer7: Number(bbPer7.toFixed(2)), strikeRate: Number(strikeRate.toFixed(1)) };
    });

    return { batting: battingResult, pitching: pitchingResult };
  }, [filteredBattingData, filteredPitchingData, trendPeriod]);

  const gameByGameStats = useMemo(() => {
    if (filteredBattingData.length === 0) return [];

    const gamesMap = new Map();

    // First pass: Batting data to establish games and aggregate runs scored
    filteredBattingData.forEach(row => {
      const gameId = row['試合ID'];
      if (!gameId) return;

      if (!gamesMap.has(gameId)) {
        const homeTeam = row['後攻'] || '';
        const awayTeam = row['先攻'] || '';
        const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
        const opponent = isHomeArinko ? awayTeam : homeTeam;

        gamesMap.set(gameId, {
          id: gameId,
          date: row['日付'],
          opponent: opponent || '不明',
          scoreText: row['スコア'],
          runsScored: 0,
          runsAllowed: 0
        });
      }
      
      const game = gamesMap.get(gameId);
      game.runsScored += (row['得点'] || 0);
    });

    // Second pass: Pitching data to aggregate runs allowed
    filteredPitchingData.forEach(row => {
        const gameId = row['試合ID'];
        if (gamesMap.has(gameId)) {
            gamesMap.get(gameId).runsAllowed += (row['失点'] || 0);
        }
    });

    const sortedGames = Array.from(gamesMap.values()).sort((a, b) => parseDate(a.date) - parseDate(b.date));

    let wins = 0;
    let gamesPlayed = 0;

    return sortedGames.map(game => {
      const result = game.runsScored > game.runsAllowed ? 'W'
                   : game.runsScored < game.runsAllowed ? 'L'
                   : 'T';

      gamesPlayed++;
      if (result === 'W') {
        wins++;
      }
      const winningPercentage = safeDiv(wins, gamesPlayed);
      
      return {
        ...game,
        result: result,
        winningPercentage: Number(winningPercentage.toFixed(3)),
        label: `${game.date.substring(5).replace('-', '/')} vs ${game.opponent}`
      };
    });
  }, [filteredBattingData, filteredPitchingData]);

  // Player Cumulative Trend Logic
  const playerBattingTrendData = useMemo(() => {
    if (!selectedPlayerId || trendTarget !== 'player' || trendType !== 'batting') return [];

    const getKey = (row, period) => {
        const d = parseDate(row['日付']);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (period) {
            case 'game':
                return row['日付'];
            case 'quarterly':
                const quarter = Math.floor(month / 3) + 1;
                return `${year}-Q${quarter}`;
            case 'monthly':
            default:
                return `${year}-${(month + 1).toString().padStart(2, '0')}`;
        }
    };

    const rows = filteredBattingData.filter(r => (r['選手ID'] || r['名前']) === selectedPlayerId);
    
    const grouped = {};
    rows.forEach(row => {
        const key = getKey(row, trendPeriod);
        if (!key) return;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });

    const sortedKeys = Object.keys(grouped).sort();

    let cumulative = { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, sb: 0, so: 0 };
    
    return sortedKeys.map(key => {
        const periodRows = grouped[key];
        const periodStats = periodRows.reduce((acc, row) => {
            acc.ab += (row['打数'] || 0);
            acc.h += (row['安打'] || 0);
            acc.bb += (row['四球'] || 0);
            acc.hbp += (row['死球'] || 0);
            acc.sf += (row['犠飛'] || 0);
            acc.doubles += (row['二塁打'] || 0);
            acc.triples += (row['三塁打'] || 0);
            acc.hr += (row['本塁打'] || 0);
            acc.so += (row['三振'] || 0);
            acc.rbi += (row['打点'] || 0);
            return acc;
        }, { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, so: 0 });

        Object.keys(periodStats).forEach(statKey => {
            cumulative[statKey] += periodStats[statKey];
        });

        const avg = safeDiv(cumulative.h, cumulative.ab);
        const obp = safeDiv(cumulative.h + cumulative.bb + cumulative.hbp, cumulative.ab + cumulative.bb + cumulative.hbp + cumulative.sf);
        const singles = cumulative.h - cumulative.doubles - cumulative.triples - cumulative.hr;
        const tb = singles + cumulative.doubles*2 + cumulative.triples*3 + cumulative.hr*4;
        const pa = cumulative.ab + cumulative.bb + cumulative.hbp + cumulative.sf;
        const soRate = safeDiv(cumulative.so, pa) * 100;
        const bbRate = safeDiv(cumulative.bb + cumulative.hbp, pa) * 100;
        const slg = safeDiv(tb, cumulative.ab);

        let opponent = '';
        if (trendPeriod === 'game' && periodRows.length > 0) {
            const row = periodRows[0];
            const homeTeam = row['後攻'] || '';
            const awayTeam = row['先攻'] || '';
            const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
            opponent = isHomeArinko ? awayTeam : homeTeam;
        }

        return {
            periodKey: key,
            opponent: opponent,
            avg: Number(avg.toFixed(3)),
            ops: Number((obp + slg).toFixed(3)),
            slg: Number(slg.toFixed(3)),
            obp: Number(obp.toFixed(3)),
            bbRate: Number(bbRate.toFixed(1)),
            soRate: Number(soRate.toFixed(1)),
            ...periodStats
        };
    });
  }, [filteredBattingData, selectedPlayerId, trendTarget, trendType, trendPeriod]);

  const playerPitchingTrendData = useMemo(() => {
    if (!selectedPlayerId || trendTarget !== 'player' || trendType !== 'pitching') return [];
    const getKey = (row, period) => {
        const d = parseDate(row['日付']);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (period) {
            case 'game':
                return row['日付'];
            case 'quarterly':
                const quarter = Math.floor(month / 3) + 1;
                return `${year}-Q${quarter}`;
            case 'monthly':
            default:
                return `${year}-${(month + 1).toString().padStart(2, '0')}`;
        }
    };

    const rows = filteredPitchingData.filter(r => (r['選手ID'] || r['名前']) === selectedPlayerId);
    
    const grouped = {};
    rows.forEach(row => {
        const key = getKey(row, trendPeriod);
        if (!key) return;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });

    const sortedKeys = Object.keys(grouped).sort();

    let cumulative = { outs: 0, er: 0, bb: 0, hbp: 0, h: 0, so: 0 };
    
    return sortedKeys.map(key => {
        const periodRows = grouped[key];
        const periodStats = periodRows.reduce((acc, row) => {
            acc.outs += (row['アウト数'] || 0);
            acc.er += (row['自責点'] || 0);
            acc.bb += (row['四球'] || 0);
            acc.hbp += (row['死球'] || 0);
            acc.h += (row['安打'] || 0);
            acc.so += (row['三振'] || 0);
            acc.pitches += (row['球数'] || 0);
            acc.strikes += (row['S数'] || 0);
            return acc;
        }, { outs: 0, er: 0, bb: 0, hbp: 0, h: 0, so: 0, pitches: 0, strikes: 0 });

        Object.keys(cumulative).forEach(statKey => {
            cumulative[statKey] += periodStats[statKey];
        });

        const era = safeDiv(cumulative.er * 7, cumulative.outs / 3);
        const whip = safeDiv(cumulative.bb + cumulative.hbp + cumulative.h, cumulative.outs / 3);
        const kbb = safeDiv(cumulative.so, cumulative.bb);
        const kPer7 = safeDiv(cumulative.so * 7, cumulative.outs / 3);
        const bbPer7 = safeDiv((cumulative.bb + cumulative.hbp) * 7, cumulative.outs / 3);

        const innings = periodStats.outs / 3;
        const strikeRate = safeDiv(periodStats.strikes, periodStats.pitches) * 100;
        
        let opponent = '';
        if (trendPeriod === 'game' && periodRows.length > 0) {
            const row = periodRows[0];
            const homeTeam = row['後攻'] || '';
            const awayTeam = row['先攻'] || '';
            const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
            opponent = isHomeArinko ? awayTeam : homeTeam;
        }

        return {
            periodKey: key,
            opponent: opponent,
            era: Number(era.toFixed(2)),
            whip: Number(whip.toFixed(2)),
            kbb: Number(kbb.toFixed(2)),
            innings: Number(innings.toFixed(1)),
            kPer7: Number(kPer7.toFixed(2)),
            bbPer7: Number(bbPer7.toFixed(2)),
            strikeRate: Number(strikeRate.toFixed(1)),
            bb: periodStats.bb,
            hbp: periodStats.hbp,
            pitches: periodStats.pitches
        };
    });
  }, [filteredPitchingData, selectedPlayerId, trendTarget, trendType, trendPeriod]);

  // --- Comparison & Ranking Logic ---

  const rankingData = useMemo(() => {
      let data = [];
      const isPitching = comparisonDataType === 'pitching';

      if (isPitching) {
          data = aggregatedPitching
            .filter(p => p.inningsVal >= comparisonMinPA)
            .map(p => {
                const value = (comparisonMetric === 'displayInnings') ? p.inningsVal : p[comparisonMetric];
                let displayValue = p[comparisonMetric];
                if (typeof displayValue === 'number' && !Number.isInteger(displayValue)) {
                    displayValue = displayValue.toFixed(2);
                }
                return { name: p.name, value, displayValue };
            });
      } else {
          data = aggregatedBatting
            .filter(p => p.pa >= comparisonMinPA)
            .map(p => {
                const value = p[comparisonMetric];
                let displayValue = value;
                if (['avg', 'obp'].includes(comparisonMetric)) {
                    displayValue = formatRate(value);
                } else if (typeof value === 'number' && !Number.isInteger(value)) {
                    displayValue = value.toFixed(3);
                }
                return { name: p.name, value, displayValue };
            });
      }
      
      // Sort logic
      // Lower is better for ERA, WHIP
      if (['era', 'whip'].includes(comparisonMetric)) {
          data.sort((a, b) => (a.value ?? Infinity) - (b.value ?? Infinity));
      } else {
          data.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
      }
      return data;
  }, [aggregatedBatting, aggregatedPitching, comparisonMetric, comparisonMinPA, comparisonDataType]);

  const comparisonScatterData = useMemo(() => {
      if (comparisonDataType === 'pitching') {
          return aggregatedPitching
            .filter(p => p.inningsVal >= comparisonMinPA)
            .map(p => ({
                name: p.name,
                x: p[scatterX],
                y: p[scatterY],
                z: p.inningsVal
            }));
      }
      // Default to batting
      return aggregatedBatting
          .filter(p => p.pa >= comparisonMinPA)
          .map(p => ({
              name: p.name,
              x: p[scatterX],
              y: p[scatterY],
              z: p.ops
          }));
  }, [aggregatedBatting, aggregatedPitching, comparisonMinPA, scatterX, scatterY, comparisonDataType]);

  // --- Render Sub-Components ---

  const FilterPanel = () => (
    <Card className="mb-6 border border-blue-100 bg-blue-50">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">期間指定</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={draftFilters.startDate}
                        onChange={e => setDraftFilters({...draftFilters, startDate: e.target.value})}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                    <span className="text-gray-400">～</span>
                    <input 
                        type="date" 
                        value={draftFilters.endDate}
                        onChange={e => setDraftFilters({...draftFilters, endDate: e.target.value})}
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
                        onChange={e => setDraftFilters({...draftFilters, teamKeyword: e.target.value})}
                        className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">大会・カテゴリ</label>
                <select 
                    value={draftFilters.category}
                    onChange={e => setDraftFilters({...draftFilters, category: e.target.value})}
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
                    onClick={() => setActiveFilters(draftFilters)}
                    className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                    適用
                </button>
                <button 
                    onClick={resetFilters}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    <RefreshCw size={14} className="mr-2" />
                    リセット
                </button>
            </div>
        </div>
    </Card>
  );

  const ImportSection = () => (
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
              onChange={handleFileUpload}
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
            onClick={clearData}
            className="flex items-center text-xs text-red-500 hover:text-red-700"
          >
            <Trash2 size={12} className="mr-1" />
            データをクリア
          </button>
        </div>
      )}
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      <FilterPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="集計試合数" value={teamStats?.totalGames || 0} icon={Activity} color="indigo" />
        <StatCard title="チーム打率" value={teamStats?.teamAvg || ".000"} subValue={`${aggregatedBatting.reduce((a,c)=>a+c.h,0)}安打`} icon={TrendingUp} color="green" />
        <StatCard title="総得点" value={teamStats?.totalR || 0} subValue={`本塁打: ${teamStats?.totalHR || 0}`} icon={Award} color="yellow" />
        <StatCard title="チーム防御率" value={teamStats?.teamERA || "0.00"} subValue="（7回換算）" icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-700 mb-4">月別チーム打撃成績推移</h3>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={monthlyBattingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize: 12}} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 0.6]} tickFormatter={(val) => formatRate(val)} />
              <RechartsTooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="runs" name="得点" fill="#8884d8" barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="avg" name="打率" stroke="#82ca9d" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-700 mb-4">月別チーム投手成績推移</h3>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={monthlyPitchingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize: 12}} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 100]} unit="%" />
              <RechartsTooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="so" name="三振数" fill="#8884d8" />
              <Bar yAxisId="left" dataKey="h" name="被安打数" fill="#ffc658" />
              <Bar yAxisId="left" dataKey="bbhbp" name="四死球数" fill="#ff8042" />
              <Line yAxisId="right" type="monotone" dataKey="strikeRate" name="S率" stroke="#82ca9d" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-96 flex flex-col lg:col-span-2">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-700">打撃タイプ分析 (OPS)</h3>
                    <p className="text-xs text-gray-400">※円の大きさはOPS。5打席以上の選手を表示。</p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="show-home-labels" checked={showHomeScatterLabels} onChange={e => setShowHomeScatterLabels(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="show-home-labels" className="text-sm text-gray-600">
                        名前を表示
                    </label>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="90%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <ZAxis type="number" dataKey="z" name="OPS" range={[20, 300]} />
                    <XAxis type="number" dataKey="x" name="出塁率" unit="" domain={[0, 'dataMax + 0.1']} tickFormatter={(v)=>v.toFixed(3)} label={{ value: '出塁率 (OBP)', position: 'insideBottom', offset: -10 }} />
                    <YAxis type="number" dataKey="y" name="長打率" unit="" domain={[0, 'dataMax + 0.1']} tickFormatter={(v)=>v.toFixed(3)} label={{ value: '長打率 (SLG)', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white p-2 border shadow-sm rounded-md text-sm">
                                    <p className="font-bold mb-2 text-gray-800">{data.name}</p>
                                    <p style={{ color: payload[0].color }}>
                                        出塁率: {data.x}
                                    </p>
                                    <p style={{ color: payload[1].color }}>
                                        長打率: {data.y}
                                    </p>
                                    <p style={{ color: payload[2].color }}>
                                        OPS: {data.z.toFixed(3)}
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <Legend />
                    <Scatter name="選手" data={aggregatedBatting.filter(p => p.pa >= 5).map(p => ({ name: p.name, x: p.obp, y: p.slg, z: p.ops }))} fill="#f59e0b">
                        {showHomeScatterLabels && <LabelList dataKey="name" position="top" style={{ fontSize: '10px' }} />}
                    </Scatter>
                    <ReferenceLine x={0.3} stroke="red" strokeDasharray="3 3" label="出塁率.300" />
                    <ReferenceLine y={0.3} stroke="blue" strokeDasharray="3 3" label="長打率.300" />
                </ScatterChart>
            </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-700 mb-4">試合別 得失点と勝率推移</h3>
          {gameByGameStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={gameByGameStats} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={70} interval={'preserveStartEnd'} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: '得失点', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 1]} tickFormatter={(val) => formatRate(val)} label={{ value: '勝率', angle: 90, position: 'insideRight' }} />
                <RechartsTooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const runsScoredPayload = payload.find(p => p.dataKey === 'runsScored');
                        const runsAllowedPayload = payload.find(p => p.dataKey === 'runsAllowed');
                        const winningPercentagePayload = payload.find(p => p.dataKey === 'winningPercentage');

                        return (
                            <div className="bg-white p-2 border shadow-sm rounded-md text-sm">
                                <p className="font-bold mb-1 text-gray-800">{data.date} vs {data.opponent}</p>
                                <p className="text-gray-500 text-xs mb-2">スコア: {data.scoreText}</p>
                                {runsScoredPayload && <p style={{color: runsScoredPayload.color}}>得点: {data.runsScored}</p>}
                                {runsAllowedPayload && <p style={{color: runsAllowedPayload.color}}>失点: {data.runsAllowed}</p>}
                                {winningPercentagePayload && <p style={{color: winningPercentagePayload.color}}>勝率: {formatRate(data.winningPercentage)}</p>}
                            </div>
                        );
                    }
                    return null;
                }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="runsScored" name="得点" fill="#3b82f6" />
                <Bar yAxisId="left" dataKey="runsAllowed" name="失点" fill="#ef4444" />
                <Line yAxisId="right" type="monotone" dataKey="winningPercentage" name="勝率" stroke="#10b981" strokeWidth={3} dot={{r: 3}} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">集計対象の試合がありません</div>
          )}
        </Card>
      </div>
    </div>
  );

const AllRankingsView = ({ battingData, pitchingData, minPA, minInnings, showAll }) => {
    const RankingList = ({ title, data, dataKey, displayKey, isAsc = false, top = 10, formatFunc }) => {
        const sortedData = [...data]
            .sort((a, b) => {
                const valA = a[dataKey] ?? (isAsc ? Infinity : -Infinity);
                const valB = b[dataKey] ?? (isAsc ? Infinity : -Infinity);
                return isAsc ? valA - valB : valB - valA;
            })
            .slice(0, showAll ? undefined : top);

        return (
            <div className="p-4 border rounded-lg bg-gray-50 h-full">
                <h4 className="font-bold text-md text-gray-800 mb-3 border-b pb-2">{title}</h4>
                {sortedData.length > 0 ? (
                    <ul className="space-y-2">
                        {sortedData.map((item, index) => (
                            <li key={item.id || item.name} className="flex justify-between items-center text-sm hover:bg-gray-100 p-1 rounded">
                                <span className="truncate pr-2">
                                    <span className="text-gray-500 w-6 inline-block">{index + 1}.</span>
                                    {item.name}
                                </span>
                                <span className="font-bold text-primary-600">
                                    {formatFunc ? formatFunc(item[displayKey]) : item[displayKey]}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400 text-center pt-4">該当データなし</p>
                )}
            </div>
        );
    };

    const filteredBatting = battingData.filter(p => p.pa >= minPA);
    const filteredPitching = pitchingData.filter(p => p.inningsVal >= minInnings);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
            <RankingList title="打率" data={filteredBatting} dataKey="avg" displayKey="avg" formatFunc={(v) => formatRate(v)} />
            <RankingList title="OPS" data={filteredBatting} dataKey="ops" displayKey="ops" formatFunc={(v) => v.toFixed(3)} />
            <RankingList title="出塁率" data={filteredBatting} dataKey="obp" displayKey="obp" formatFunc={(v) => formatRate(v)} />
            <RankingList title="長打率" data={filteredBatting} dataKey="slg" displayKey="slg" formatFunc={(v) => v.toFixed(3)} />
            <RankingList title="本塁打" data={filteredBatting} dataKey="hr" displayKey="hr" />
            <RankingList title="打点" data={filteredBatting} dataKey="rbi" displayKey="rbi" />
            <RankingList title="盗塁" data={filteredBatting} dataKey="sb" displayKey="sb" />
            <RankingList title="四球" data={filteredBatting} dataKey="bb" displayKey="bb" />
            <RankingList title="防御率" data={filteredPitching} dataKey="era" displayKey="era" isAsc={true} formatFunc={(v) => v.toFixed(2)} />
            <RankingList title="WHIP" data={filteredPitching} dataKey="whip" displayKey="whip" isAsc={true} formatFunc={(v) => v.toFixed(2)} />
            <RankingList title="奪三振" data={filteredPitching} dataKey="so" displayKey="so" />
            <RankingList title="勝利数" data={filteredPitching} dataKey="win" displayKey="win" />
            <RankingList title="K/BB" data={filteredPitching} dataKey="kbb" displayKey="kbb" formatFunc={(v) => v.toFixed(2)} />
            <RankingList title="投球回" data={filteredPitching} dataKey="inningsVal" displayKey="displayInnings" />
            <RankingList title="セーブ" data={filteredPitching} dataKey="sv" displayKey="sv" />
        </div>
    );
};

const AllChartsView = ({ data, metricOptions, isPitching }) => {
    const ChartCard = ({ metric }) => {
        const sortedData = useMemo(() => {
            const items = [...data];
            const sortAsc = ['era', 'whip'].includes(metric.v);
            const sortKey = (isPitching && metric.v === 'displayInnings') ? 'inningsVal' : metric.v;

            items.sort((a, b) => {
                const valA = a[sortKey] ?? (sortAsc ? Infinity : -Infinity);
                const valB = b[sortKey] ?? (sortAsc ? Infinity : -Infinity);
                return sortAsc ? valA - valB : valB - valA;
            });
            return items;
        }, [data, metric]);

        const dataKey = (isPitching && metric.v === 'displayInnings') ? 'inningsVal' : metric.v;

        return (
            <Card className="h-96">
                <h4 className="font-bold text-md text-gray-800 mb-3">{metric.l}</h4>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 'dataMax']} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} interval={0} />
                        <RechartsTooltip />
                        <Bar dataKey={dataKey} fill="#3b82f6" radius={[0, 4, 4, 0]}>
                            <LabelList dataKey={metric.v} position="right" style={{ fill: '#374151', fontSize: '11px' }} formatter={(val) => {
                                if (typeof val !== 'number') return val;
                                if (['era', 'whip', 'kbb'].includes(metric.v)) return val.toFixed(2);
                                if (['avg', 'obp', 'slg', 'ops'].includes(metric.v)) return val.toFixed(3);
                                return val;
                            }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {metricOptions.map(metric => (
                <ChartCard key={metric.v} metric={metric} />
            ))}
        </div>
    );
};

  const ComparisonView = () => {
      const currentMetricOptions = comparisonDataType === 'batting' ? battingMetricOptions : pitchingMetricOptions;
      const scatterMetricOptions = comparisonDataType === 'batting' ? battingMetricOptions : pitchingMetricOptions;

      const isPitchingMetric = (metric) => pitchingMetricOptions.some(m => m.v === metric);
      return (
          <div className="space-y-6">
              <FilterPanel />
              
              <div className="bg-white p-4 rounded-lg shadow space-y-4">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setComparisonDataType('batting')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonDataType === 'batting' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >打撃分析</button>
                            <button 
                                onClick={() => setComparisonDataType('pitching')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonDataType === 'pitching' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >投手分析</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setComparisonChartType('ranking')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'ranking' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ランキング
                            </button>
                            <button 
                                onClick={() => setComparisonChartType('scatter')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'scatter' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                相関分析
                            </button>
                            <button 
                                onClick={() => setComparisonChartType('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                主要指標ランキング
                            </button>
                            <button 
                                onClick={() => setComparisonChartType('chart-all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'chart-all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                グラフ一括表示
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="text-sm text-gray-600">
                           {comparisonDataType === 'pitching' ? '最低投球回' : '最低打席数'}: 
                        </label>
                        <input 
                            type="number" 
                            min="0"
                            value={comparisonMinPA}
                            onChange={(e) => setComparisonMinPA(Number(e.target.value))}
                            className="w-16 p-1 border rounded text-center"
                        />
                        {comparisonChartType === 'all' && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="show-all-rankings" checked={showAllInRankings} onChange={e => setShowAllInRankings(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <label htmlFor="show-all-rankings" className="text-sm text-gray-600">全員表示</label>
                            </div>
                        )}
                    </div>
                  </div>

                  {comparisonChartType === 'ranking' && (
                      <div className="flex items-center gap-2">
                          <label className="text-sm font-bold text-gray-700">指標を選択:</label>
                          <select 
                            value={comparisonMetric}
                            onChange={(e) => setComparisonMetric(e.target.value)}
                            className="p-2 border rounded-md"
                          >
                              {currentMetricOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                      </div>
                  )}

                  {comparisonChartType === 'scatter' && (
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                              <label className="text-sm font-bold text-gray-700">X軸:</label>
                              <select 
                                value={scatterX}
                                onChange={(e) => setScatterX(e.target.value)}
                                className="p-2 border rounded-md"
                              >{scatterMetricOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                          </div>
                          <div className="flex items-center gap-2">
                              <label className="text-sm font-bold text-gray-700">Y軸:</label>
                              <select 
                                value={scatterY}
                                onChange={(e) => setScatterY(e.target.value)}
                                className="p-2 border rounded-md"
                              >{scatterMetricOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                          </div>
                          <div className="flex items-center gap-2">
                              <input type="checkbox" id="show-labels" checked={showScatterLabels} onChange={e => setShowScatterLabels(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                              <label htmlFor="show-labels" className="text-sm text-gray-600">
                                  名前を表示
                              </label>
                          </div>
                      </div>
                  )}
              </div>

              <Card className={['all', 'chart-all'].includes(comparisonChartType) ? '' : 'h-[500px]'}>
                  <h3 className="text-lg font-bold text-gray-700 mb-4">
                      {comparisonChartType === 'ranking' ? 
                          `チーム内ランキング: ${currentMetricOptions.find(m => m.v === comparisonMetric)?.l}` : 
                          comparisonChartType === 'scatter' ?
                          `相関分析: ${scatterMetricOptions.find(m => m.v === scatterX)?.l} vs ${scatterMetricOptions.find(m => m.v === scatterY)?.l}` :
                          comparisonChartType === 'chart-all' ?
                          '全指標グラフ表示' :
                          '主要指標ランキング'
                      }
                  </h3>
                  
                  {comparisonChartType === 'ranking' && (
                      <ResponsiveContainer width="100%" height="90%">
                          <BarChart 
                            data={rankingData} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} interval={0} />
                              <RechartsTooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                  <LabelList dataKey="displayValue" position="right" style={{ fill: '#374151', fontSize: '12px' }}/>
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  )}
                  {comparisonChartType === 'scatter' && (
                      <ResponsiveContainer width="100%" height="90%">
                          <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <ZAxis type="number" dataKey="z" range={[20, 400]} name={comparisonDataType === 'batting' ? 'OPS' : '投球回'} />
                                <XAxis type="number" dataKey="x" name={scatterMetricOptions.find(m => m.v === scatterX)?.l} unit="" domain={['auto', 'auto']} tickFormatter={(v)=> Number(v).toFixed(3)} label={{ value: scatterMetricOptions.find(m => m.v === scatterX)?.l, position: 'insideBottom', offset: -10 }} />
                                <YAxis type="number" dataKey="y" name={scatterMetricOptions.find(m => m.v === scatterY)?.l} unit="" domain={['auto', 'auto']} tickFormatter={(v)=> Number(v).toFixed(3)} label={{ value: scatterMetricOptions.find(m => m.v === scatterY)?.l, angle: -90, position: 'insideLeft' }} />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload, ...rest }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-2 border shadow-sm rounded-md text-sm">
                                                <p className="font-bold mb-2 text-gray-800">{data.name}</p>
                                                <p style={{ color: payload[0].color }}>
                                                    {payload[0].name} (X軸): {data.x}
                                                </p>
                                                <p style={{ color: payload[1].color }}>
                                                    {payload[1].name} (Y軸): {data.y}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {comparisonDataType === 'batting' ? `OPS: ${data.z.toFixed(3)}` : `投球回: ${data.z.toFixed(1)}`}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Scatter name="選手" data={comparisonScatterData} fill="#8884d8">{showScatterLabels && <LabelList dataKey="name" position="top" style={{ fontSize: '10px' }} />}</Scatter>
                          </ScatterChart>
                      </ResponsiveContainer>
                  )}
                  {comparisonChartType === 'all' && (
                    <AllRankingsView 
                        battingData={aggregatedBatting} 
                        pitchingData={aggregatedPitching} 
                        minPA={comparisonMinPA} 
                        minInnings={comparisonMinPA} 
                        showAll={showAllInRankings}
                    />
                  )}
                  {comparisonChartType === 'chart-all' && (
                    <AllChartsView 
                        data={comparisonDataType === 'batting' ? aggregatedBatting.filter(p => p.pa >= comparisonMinPA) : aggregatedPitching.filter(p => p.inningsVal >= comparisonMinPA)}
                        metricOptions={currentMetricOptions}
                        isPitching={comparisonDataType === 'pitching'}
                    />
                  )}
              </Card>
          </div>
      );
  };

  const TrendsView = () => {
      const renderPlayerCharts = () => {
          if (trendType === 'batting') {
              return (<>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-96">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-700">累積打撃成績推移</h3>
                            <span className="text-xs text-gray-400">※試合経過に伴う通算成績の変化</span>
                        </div>
                        {playerBattingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={playerBattingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis domain={[0, 'auto']} />
                                    <RechartsTooltip content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 border shadow-sm text-sm">
                                                    <p className="font-bold mb-1">{label}</p>
                                                    <p className="text-gray-500 text-xs mb-2">vs {payload[0].payload.opponent}</p>
                                                    {payload.map(p => (
                                                        <p key={p.name} style={{color: p.color}}>
                                                            {p.name}: {p.value}
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}/>
                                    <Legend />
                                    <Line type="stepAfter" dataKey="avg" name="累積打率" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                                    <Line type="stepAfter" dataKey="ops" name="累積OPS" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">累積打率/出塁率/長打率 推移</h3>
                        {playerBattingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={playerBattingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis domain={[0, 'auto']} tickFormatter={v => v.toFixed(3)} />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Area type="stepAfter" dataKey="avg" name="打率" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                    <Area type="stepAfter" dataKey="obp" name="出塁率" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                    <Area type="stepAfter" dataKey="slg" name="長打率" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">累積四死球率・三振率 推移</h3>
                        {playerBattingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={playerBattingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis domain={[0, 'auto']} unit="%" />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="bbRate" name="累積四死球率(BB%)" stroke="#10b981" strokeWidth={2} dot={{r: 3}} />
                                    <Line type="monotone" dataKey="soRate" name="累積三振率(K%)" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                </div>
                <div className="mt-6">
                    <Card className="h-80">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">試合別 打撃結果</h3>
                        {playerBattingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <ComposedChart data={playerBattingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Bar dataKey="h" name="安打" fill="#3b82f6" />
                                    <Bar dataKey="rbi" name="打点" fill="#10b981" />
                                    <Bar dataKey="hr" name="本塁打" fill="#ef4444" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                </div>
              </>);
          } else {
              return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="h-96">
                          <h3 className="text-lg font-bold text-gray-700 mb-4">累積防御率・WHIP推移</h3>
                          {playerPitchingTrendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="90%">
                                  <LineChart data={playerPitchingTrendData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                                      <YAxis yAxisId="left" domain={[0, 'auto']} label={{ value: 'ERA', angle: -90, position: 'insideLeft' }} />
                                      <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} label={{ value: 'WHIP', angle: 90, position: 'insideRight' }} />
                                      <RechartsTooltip />
                                      <Legend />
                                      <Line yAxisId="left" type="monotone" dataKey="era" name="累積防御率" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                                      <Line yAxisId="right" type="monotone" dataKey="whip" name="累積WHIP" stroke="#8b5cf6" strokeWidth={2} dot={{r: 3}} />
                                  </LineChart>
                              </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                      </Card>
                      
                      <Card className="h-96">
                          <h3 className="text-lg font-bold text-gray-700 mb-4">試合別 投球内容 (回・S率)</h3>
                          {playerPitchingTrendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="90%">
                                  <ComposedChart data={playerPitchingTrendData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                                      <YAxis yAxisId="left" label={{ value: '回', angle: -90, position: 'insideLeft' }} />
                                      <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} />
                                      <RechartsTooltip content={({ active, payload, label }) => {
                                          if (active && payload && payload.length) {
                                              const data = payload[0].payload;
                                              return (
                                                  <div className="bg-white p-2 border shadow-sm text-sm z-50">
                                                      <p className="font-bold mb-1">{label}</p>
                                                      <p className="text-gray-500 text-xs mb-2">vs {data.opponent}</p>
                                                      <p className="text-blue-600">投球回: {data.innings}</p>
                                                      <p className="text-green-600">ストライク率: {data.strikeRate}%</p>
                                                      <p className="text-gray-600">球数: {data.pitches}</p>
                                                      <p className="text-red-600">四球: {data.bb}</p>
                                                      <p className="text-red-600">死球: {data.hbp}</p>
                                                  </div>
                                              );
                                          }
                                          return null;
                                      }} />
                                      <Legend />
                                      <Bar yAxisId="left" dataKey="innings" name="投球回" fill="#3b82f6" barSize={20} />
                                      <Line yAxisId="right" type="monotone" dataKey="strikeRate" name="S率(%)" stroke="#10b981" strokeWidth={2} />
                                  </ComposedChart>
                              </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                      </Card>
                      
                      <Card className="h-96">
                          <h3 className="text-lg font-bold text-gray-700 mb-4">累積K/BB推移</h3>
                          {playerPitchingTrendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="90%">
                                  <LineChart data={playerPitchingTrendData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                                      <YAxis domain={[0, 'auto']} label={{ value: 'K/BB', angle: -90, position: 'insideLeft' }} />
                                      <RechartsTooltip />
                                      <Legend />
                                      <Line type="monotone" dataKey="kbb" name="累積K/BB" stroke="#22c55e" strokeWidth={2} dot={{r: 3}} />
                                      <ReferenceLine y={1.0} stroke="red" strokeDasharray="3 3" label={{ value: '1.0', position: 'insideTopRight' }} />
                                  </LineChart>
                              </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                      </Card>

                      <Card className="h-96">
                          <h3 className="text-lg font-bold text-gray-700 mb-4">累積K/7, BB/7 推移</h3>
                          {playerPitchingTrendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="90%">
                                  <LineChart data={playerPitchingTrendData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                                      <YAxis domain={[0, 'auto']} />
                                      <RechartsTooltip />
                                      <Legend />
                                      <Line type="monotone" dataKey="kPer7" name="奪三振率" stroke="#3b82f6" strokeWidth={2} />
                                      <Line type="monotone" dataKey="bbPer7" name="与四死球率" stroke="#ef4444" strokeWidth={2} />
                                  </LineChart>
                              </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                      </Card>
                  </div>
              );
          }
      };

      return (
          <div className="space-y-6">
              <FilterPanel />
              <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                          <button 
                              onClick={() => setTrendTarget('team')}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${trendTarget === 'team' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              チーム推移
                          </button>
                          <button 
                              onClick={() => setTrendTarget('player')}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${trendTarget === 'player' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              個人推移
                          </button>
                      </div>
                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                          <label className="text-sm font-bold text-gray-700">集計単位:</label>
                          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                              <button onClick={() => setTrendPeriod('game')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendPeriod === 'game' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>
                                  試合別
                              </button>
                              <button onClick={() => setTrendPeriod('monthly')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendPeriod === 'monthly' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>
                                  月別
                              </button>
                              <button onClick={() => setTrendPeriod('quarterly')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendPeriod === 'quarterly' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>
                                  3ヶ月単位
                              </button>
                          </div>
                      </div>
                      
                      {trendTarget === 'player' && (
                          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                              <select 
                                  value={selectedPlayerId}
                                  onChange={e => setSelectedPlayerId(e.target.value)}
                                  className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                              >
                                  {playerList.map(p => (
                                      <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
                                  ))}
                              </select>
                              
                              <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setTrendType('batting')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendType === 'batting' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                                >
                                    打撃
                                </button>
                                <button 
                                    onClick={() => setTrendType('pitching')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendType === 'pitching' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                                >
                                    投手
                                </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {trendTarget === 'team' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム打撃 打率・OPS推移</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.batting}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periodKey" />
                                <YAxis yAxisId="left" domain={[0, 0.6]} tickFormatter={v => v.toFixed(3)} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 1.2]} />
                                <RechartsTooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="avg" name="打率" stroke="#3b82f6" strokeWidth={3} />
                                <Line yAxisId="right" type="monotone" dataKey="ops" name="OPS" stroke="#f59e0b" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム打撃 四死球率・三振率推移</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.batting}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periodKey" />
                                <YAxis unit="%" />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="bbRate" name="四死球率(BB%)" stroke="#10b981" />
                                <Line type="monotone" dataKey="soRate" name="三振率(K%)" stroke="#ef4444" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム投手 防御率・WHIP推移</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.pitching}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periodKey" />
                                <YAxis yAxisId="left" domain={[0, 'auto']} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} />
                                <RechartsTooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="era" name="防御率" stroke="#ef4444" strokeWidth={3} />
                                <Line yAxisId="right" type="monotone" dataKey="whip" name="WHIP" stroke="#8b5cf6" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム投手 K/7・BB/7推移（月別）</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.pitching}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periodKey" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="kPer7" name="奪三振率(K/7)" stroke="#3b82f6" />
                                <Line type="monotone" dataKey="bbPer7" name="与四死球率(BB/7)" stroke="#ef4444" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                 </div>
              ) : (
                  renderPlayerCharts()
              )}
          </div>
      );
  };

  const BattingView = () => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
      let sortableItems = [...aggregatedBatting];
      if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
           let valA = a[sortConfig.key];
           let valB = b[sortConfig.key];
           if (!isNaN(Number(valA))) valA = Number(valA);
           if (!isNaN(Number(valB))) valB = Number(valB);
           if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
           if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
           return 0;
        });
      }
      return sortableItems;
    }, [aggregatedBatting, sortConfig]);

    const headers = [
      { k: 'number', l: '#' }, { k: 'name', l: '名前' }, { k: 'games', l: '試合' }, 
      { k: 'pa', l: '打席' }, { k: 'ab', l: '打数' }, { k: 'h', l: '安打' }, 
      { k: 'hr', l: '本塁' }, { k: 'rbi', l: '打点' }, { k: 'sb', l: '盗塁' }, 
      { k: 'bb', l: '四球' }, { k: 'so', l: '三振' },
      { k: 'avg', l: '打率' }, { k: 'obp', l: '出塁' }, { k: 'ops', l: 'OPS' },
      { k: 'bbK', l: 'BB/K' }
    ];

    return (
      <div className="space-y-4">
        <FilterPanel />
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                <tr>
                    {headers.map(h => (
                    <th key={h.k} onClick={() => requestSort(h.k)} className={`px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortConfig.key === h.k ? 'bg-gray-100 text-primary-600' : ''}`}>
                        {h.l}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.number}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{row.name}</td>
                    <td className="px-3 py-2 text-gray-600">{row.games}</td>
                    <td className="px-3 py-2 text-gray-600">{row.pa}</td>
                    <td className="px-3 py-2 text-gray-600">{row.ab}</td>
                    <td className="px-3 py-2 text-gray-900 font-bold">{row.h}</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">{row.hr}</td>
                    <td className="px-3 py-2 text-blue-600">{row.rbi}</td>
                    <td className="px-3 py-2 text-green-600">{row.sb}</td>
                    <td className="px-3 py-2 text-gray-400">{row.bb}</td>
                    <td className="px-3 py-2 text-gray-400">{row.so}</td>
                    <td className="px-3 py-2 bg-yellow-50 font-bold text-gray-900">{formatRate(row.avg)}</td>
                    <td className="px-3 py-2 text-gray-600">{formatRate(row.obp)}</td>
                    <td className="px-3 py-2 text-gray-600">{row.ops}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{row.bbK}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </Card>
      </div>
    );
  };

  const PitchingView = () => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
      let sortableItems = [...aggregatedPitching];
      if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
           let valA = a[sortConfig.key];
           let valB = b[sortConfig.key];
           if (!isNaN(Number(valA))) valA = Number(valA);
           if (!isNaN(Number(valB))) valB = Number(valB);
           if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
           if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
           return 0;
        });
      }
      return sortableItems;
    }, [aggregatedPitching, sortConfig]);

    const headers = [
      { k: 'number', l: '#' }, { k: 'name', l: '名前' }, { k: 'games', l: '登板' }, 
      { k: 'displayInnings', l: '回' }, { k: 'win', l: '勝' }, { k: 'loss', l: '敗' },
      { k: 'sv', l: 'S' }, { k: 'so', l: '奪三振' }, { k: 'bb', l: '四球' }, { k: 'hbp', l: '死球' },
      { k: 'era', l: '防御率' }, { k: 'whip', l: 'WHIP' }, { k: 'kbb', l: 'K/BB' }
    ];

    return (
       <div className="space-y-4">
        <FilterPanel />
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                <tr>
                    {headers.map(h => (
                    <th key={h.k} onClick={() => requestSort(h.k)} className={`px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortConfig.key === h.k ? 'bg-gray-100 text-primary-600' : ''}`}>
                        {h.l}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.number}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{row.name}</td>
                    <td className="px-3 py-2 text-gray-600">{row.games}</td>
                    <td className="px-3 py-2 text-gray-900">{row.displayInnings}</td>
                    <td className="px-3 py-2 text-red-600 font-bold">{row.win}</td>
                    <td className="px-3 py-2 text-blue-600">{row.loss}</td>
                    <td className="px-3 py-2 text-gray-600">{row.sv}</td>
                    <td className="px-3 py-2 text-green-600 font-bold">{row.so}</td>
                    <td className="px-3 py-2 text-gray-400">{row.bb}</td>
                    <td className="px-3 py-2 text-gray-400">{row.hbp}</td>
                    <td className="px-3 py-2 bg-yellow-50 font-bold text-gray-900">{row.era.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-600">{row.whip.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-400">{row.kbb.toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </Card>
      </div>
    );
  };

  const ManualView = () => (
    <div className="space-y-6 max-w-4xl mx-auto text-gray-700">
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">ありんこアントス Dashboard - 使い方マニュアル</h2>
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary-700">1. データの準備とインポート</h3>
            <div className="pl-4 space-y-4 border-l-2 border-primary-100">
              <div>
                <h4 className="font-semibold">1.1. CSVファイルの形式</h4>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>打撃成績</strong>: ファイル名の末尾が <code className="bg-gray-200 px-1 rounded">_b.csv</code> となるようにしてください。（例: <code className="bg-gray-200 px-1 rounded">team_stats_2025_b.csv</code>）</li>
                  <li><strong>投手成績</strong>: ファイル名の末尾が <code className="bg-gray-200 px-1 rounded">_p.csv</code> となるようにしてください。（例: <code className="bg-gray-200 px-1 rounded">team_stats_2025_p.csv</code>）</li>
                </ul>
                <p className="text-xs text-gray-500 mt-1">アプリはファイル名でどちらのデータかを自動的に判別します。</p>
              </div>
              <div>
                <h4 className="font-semibold">1.2. データのインポート方法</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>画面上部のナビゲーションから<strong>「データ管理」</strong>タブをクリックします。</li>
                  <li><strong>「ファイルを選択」</strong>ボタンを押し、準備した打撃・投手両方のCSVファイルを選択します。（複数ファイルを一度に選択可能です）</li>
                  <li>ファイルが選択されると、データが自動的にインポートされ、ブラウザ内に保存されます。</li>
                  <li>「最終更新」に日時が表示されれば、インポートは完了です。</li>
                </ol>
              </div>
            </div>
          </section>
  
          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary-700">2. 各画面の機能</h3>
            <div className="pl-4 space-y-4 border-l-2 border-primary-100">
              <div>
                <h4 className="font-semibold">ホーム画面</h4>
                <p className="text-sm mt-1">チーム全体のパフォーマンスをひと目で把握するためのダッシュボードです。サマリー、月別成績推移、打撃タイプ分析などが表示されます。</p>
              </div>
              <div>
                <h4 className="font-semibold">打撃成績・投手成績画面</h4>
                <p className="text-sm mt-1">全選手の集計成績をテーブルで表示します。各列のヘッダーをクリックすると、その指標で選手を並べ替えることができます。</p>
              </div>
              <div>
                <h4 className="font-semibold">推移画面</h4>
                <p className="text-sm mt-1">「チーム推移」と「個人推移」を切り替えて、成績が時間と共にどう変化したかを確認できます。個人の場合は選手を選択して詳細な推移をグラフで見ることができます。</p>
              </div>
              <div>
                <h4 className="font-semibold">分析・比較画面</h4>
                <p className="text-sm mt-1">選手間のパフォーマンスをより深く比較・分析します。「ランキング」で特定の指標の順位を見たり、「相関分析」で2つの指標の関係性を散布図で確認したり、「一括表示」で主要指標のランキングをまとめて見ることができます。</p>
              </div>
            </div>
          </section>
  
          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary-700">3. 注意事項</h3>
            <div className="pl-4 space-y-4 border-l-2 border-primary-100">
              <div>
                <h4 className="font-semibold">データはブラウザに保存されます</h4>
                <p className="text-sm mt-1">インポートしたデータは、お使いのPCのブラウザ内（ローカルストレージ）に保存されます。サーバーには一切送信されません。</p>
              </div>
              <div>
                <h4 className="font-semibold">キャッシュクリアにご注意</h4>
                <p className="text-sm mt-1">ブラウザのキャッシュや閲覧履歴を全削除すると、インポートしたデータも一緒に消えてしまう可能性があります。元のCSVファイルも必ずバックアップとして保管してください。</p>
              </div>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );

  const GlossaryView = () => {
    const terms = [
      { term: "打率 (AVG)", definition: "安打 ÷ 打数。打者がヒットを打つ確率を示します。", category: "打撃" },
      { term: "出塁率 (OBP)", definition: "(安打 + 四球 + 死球) ÷ (打数 + 四球 + 死球 + 犠飛)。打者がどれだけ塁に出たかを示す確率です。", category: "打撃" },
      { term: "長打率 (SLG)", definition: "塁打 ÷ 打数。1打数あたりに獲得できる塁打の期待値。パワーを示します。", category: "打撃" },
      { term: "OPS", definition: "出塁率 + 長打率。得点への貢献度を測る総合的な指標です。", category: "打撃" },
      { term: "BB/K", definition: "四球 ÷ 三振。選球眼の良さを示し、1.0以上が優秀とされます。", category: "打撃" },
      { term: "PA (打席)", definition: "打席に立った回数。打数 + 四球 + 死球 + 犠打 + 犠飛。", category: "打撃" },
      { term: "AB (打数)", definition: "打席数から四球、死球、犠打、犠飛、打撃妨害を除いた数。", category: "打撃" },
      { term: "投球回 (IP)", definition: "Innings Pitched. 投手が投げたイニング数。小数点以下はアウトカウントを表し、.1は1アウト、.2は2アウトを意味します。", category: "投手" },
      { term: "防御率 (ERA)", definition: "(自責点 × 7) ÷ 投球回。投手が1試合（7回）投げた場合に何点取られるかを示します。低いほど優秀です。", category: "投手" },
      { term: "WHIP", definition: "(与四球 + 被安打) ÷ 投球回。1イニングあたりに何人の走者を出したかを示します。低いほど優秀です。", category: "投手" },
      { term: "K/BB", definition: "奪三振 ÷ 与四球。三振を四球で割った値で、投手の安定性を示します。高いほど優秀です。", category: "投手" },
      { term: "S率 (ストライク率)", definition: "ストライク数 ÷ 総投球数。投球全体のうちストライクが占める割合です。", category: "投手" },
      { term: "奪三振率 (K/7)", definition: "(奪三振 × 7) ÷ 投球回。1試合（7回）あたりに奪う三振の数。", category: "投手" },
      { term: "与四死球率 (BB/7)", definition: "((与四球 + 与死球) × 7) ÷ 投球回。1試合（7回）あたりに与える四死球の数。", category: "投手" },
    ];

    const battingTerms = terms.filter(t => t.category === '打撃');
    const pitchingTerms = terms.filter(t => t.category === '投手');

    const TermList = ({ title, data }) => (
      <section>
        <h3 className="text-xl font-semibold mb-3 text-primary-700">{title}</h3>
        <dl className="space-y-4">
          {data.map(t => (
            <div key={t.term} className="pl-4 border-l-2 border-primary-100">
              <dt className="font-bold text-gray-800">{t.term}</dt>
              <dd className="ml-4 text-gray-600 text-sm">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    );

    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">野球指標 用語集</h2>
          <div className="space-y-8">
            <TermList title="打撃指標" data={battingTerms} />
            <TermList title="投手指標" data={pitchingTerms} />
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-800">
      <header className="bg-primary-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-yellow-400" />
              <h1 className="text-xl font-bold tracking-tight">ありんこアントス Dashboard</h1>
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              <button onClick={() => handleNavClick('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}>ホーム</button>
              <button onClick={() => handleNavClick('batting')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'batting' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}>打撃成績</button>
              <button onClick={() => handleNavClick('pitching')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pitching' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}>投手成績</button>
              <button onClick={() => handleNavClick('trends')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'trends' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'} flex items-center`}>
                  <LineChartIcon className="w-4 h-4 mr-1"/>推移
              </button>
              <button onClick={() => handleNavClick('comparison')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'comparison' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'} flex items-center`}>
                  <BarChart2 className="w-4 h-4 mr-1"/>分析・比較
              </button>
              <div className="border-l border-primary-700 h-6 mx-2"></div>
              <button onClick={() => handleNavClick('manual')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'} flex items-center`}><BookOpen className="w-4 h-4 mr-1"/>使い方</button>
              <button onClick={() => handleNavClick('glossary')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'glossary' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'} flex items-center`}><HelpCircle className="w-4 h-4 mr-1"/>用語集</button>
              <button onClick={() => handleNavClick('settings')} className={`ml-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-primary-700 hover:bg-primary-600 text-white flex items-center`}><Save className="w-4 h-4 mr-1" />データ管理</button>
            </div>
            {/* Hamburger Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-800 focus:outline-none">
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => handleNavClick('dashboard')} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${activeTab === 'dashboard' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}>ホーム</button>
              <button onClick={() => handleNavClick('batting')} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${activeTab === 'batting' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}>打撃成績</button>
              <button onClick={() => handleNavClick('pitching')} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${activeTab === 'pitching' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}>投手成績</button>
              <button onClick={() => handleNavClick('trends')} className={`w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium ${activeTab === 'trends' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}><LineChartIcon className="w-5 h-5 mr-2"/>推移</button>
              <button onClick={() => handleNavClick('comparison')} className={`w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium ${activeTab === 'comparison' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}><BarChart2 className="w-5 h-5 mr-2"/>分析・比較</button>
              <div className="border-t border-primary-700 my-2"></div>
              <button onClick={() => handleNavClick('manual')} className={`w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium ${activeTab === 'manual' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}><BookOpen className="w-5 h-5 mr-2"/>使い方</button>
              <button onClick={() => handleNavClick('glossary')} className={`w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium ${activeTab === 'glossary' ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-800'}`}><HelpCircle className="w-5 h-5 mr-2"/>用語集</button>
              <button onClick={() => handleNavClick('settings')} className={`w-full text-left flex items-center mt-2 px-3 py-2 rounded-md text-base font-medium bg-primary-700 hover:bg-primary-600 text-white`}><Save className="w-5 h-5 mr-2" />データ管理</button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!lastUpdated && activeTab !== 'settings' && (
           <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-2xl mx-auto mt-10">
             <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Upload className="text-primary-600 w-10 h-10" /></div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">データがありません</h2>
             <p className="text-gray-500 mb-6">まずは「データ管理」からCSVファイルをインポートしてください。<br/>成績データをドラッグ＆ドロップで読み込めます。</p>
             <button onClick={() => handleNavClick('settings')} className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-primary-700 transition-colors">データをインポートする</button>
           </div>
        )}

        {lastUpdated && activeTab === 'dashboard' && <DashboardView />}
        {lastUpdated && activeTab === 'batting' && <BattingView />}
        {lastUpdated && activeTab === 'pitching' && <PitchingView />}
        {lastUpdated && activeTab === 'trends' && <TrendsView />}
        {lastUpdated && activeTab === 'comparison' && <ComparisonView />}
        {activeTab === 'manual' && <ManualView />}
        {activeTab === 'glossary' && <GlossaryView />}
        {activeTab === 'settings' && <ImportSection />}
      </main>
      
      <footer className="bg-slate-200 mt-12 py-6 text-center text-sm text-gray-500">
        <p>Data stored locally in your browser. Clearing cache will remove stats.</p>
        <p className="mt-1">ありんこアントス Dashboard v1.5</p>
      </footer>
    </div>
  );
}