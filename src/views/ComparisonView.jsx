import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis, LabelList
} from 'recharts';
import { Users, BarChart3, GitCompareArrows, ListOrdered, ClipboardList, CheckSquare } from 'lucide-react';
import Card from '../components/Card';
import FilterPanel from '../components/FilterPanel';
import { formatRate } from '../utils/formatters';

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#6366f1", "#d946ef"];

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
                                <span className="truncate pr-2"><span className="text-gray-500 w-6 inline-block">{index + 1}.</span>{item.name}</span>
                                <span className="font-bold text-primary-600">{formatFunc ? formatFunc(item[displayKey]) : item[displayKey]}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-gray-400 text-center pt-4">該当データなし</p>}
            </div>
        );
    };

    const filteredBatting = battingData.filter(p => p.pa >= minPA);
    const filteredPitching = pitchingData.filter(p => p.inningsVal >= minInnings);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
            <RankingList title="打率" data={filteredBatting} dataKey="avg" displayKey="avg" formatFunc={(v) => formatRate(v)} />
            <RankingList title="OPS" data={filteredBatting} dataKey="ops" displayKey="ops" formatFunc={(v) => v.toFixed(3)} />
            <RankingList title="本塁打" data={filteredBatting} dataKey="hr" displayKey="hr" />
            <RankingList title="打点" data={filteredBatting} dataKey="rbi" displayKey="rbi" />
            <RankingList title="盗塁" data={filteredBatting} dataKey="sb" displayKey="sb" />
            <RankingList title="防御率" data={filteredPitching} dataKey="era" displayKey="era" isAsc={true} formatFunc={(v) => v.toFixed(2)} />
            <RankingList title="WHIP" data={filteredPitching} dataKey="whip" displayKey="whip" isAsc={true} formatFunc={(v) => v.toFixed(2)} />
            <RankingList title="奪三振" data={filteredPitching} dataKey="so" displayKey="so" />
        </div>
    );
};

const AllChartsView = ({ data, metricOptions, isPitching }) => {
     const ChartCard = ({ metric }) => {
        const sortedData = useMemo(() => {
            const items = [...data];
            const sortAsc = ['era', 'whip'].includes(metric.v);
            const sortKey = (isPitching && metric.v === 'displayInnings') ? 'inningsVal' : metric.v;
            items.sort((a, b) => (sortAsc ? (a[sortKey] ?? Infinity) - (b[sortKey] ?? Infinity) : (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity)));
            return items;
        }, [data, metric]);

        const dataKey = (isPitching && metric.v === 'displayInnings') ? 'inningsVal' : metric.v;
        const formatter = (val) => {
            if (typeof val !== 'number') return val;
            if (['era', 'whip', 'kbb'].includes(metric.v)) return val.toFixed(2);
            if (['avg', 'obp', 'slg', 'ops'].includes(metric.v)) return val.toFixed(3);
            return val;
        };

        return (
            <Card className="h-96">
                <h4 className="font-bold text-md text-gray-800 mb-3">{metric.l}</h4>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 'dataMax']} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} interval={0} />
                        <RechartsTooltip formatter={formatter} />
                        <Bar dataKey={dataKey} fill="#3b82f6" radius={[0, 4, 4, 0]}><LabelList dataKey={dataKey} position="right" style={{ fill: '#374151', fontSize: '11px' }} formatter={formatter} /></Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        );
    };
    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">{metricOptions.map(metric => <ChartCard key={metric.v} metric={metric} />)}</div>;
};

const PlayerComparisonCharts = ({ multiPlayerTrendData, comparisonSelectedPlayers, playerList, comparisonDataType }) => {
    const battingCharts = [
        { key: 'avg', label: '打率 推移', domain: [0, 0.6], formatter: (v) => v.toFixed(3) },
        { key: 'ops', label: 'OPS 推移', domain: [0, 1.2], formatter: (v) => v.toFixed(3) },
        { key: 'bbRate', label: '四死球率(%) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(1) },
        { key: 'soRate', label: '三振率(%) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(1) },
    ];
    const pitchingCharts = [
        { key: 'era', label: '防御率 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
        { key: 'whip', label: 'WHIP 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
        { key: 'strikeRate', label: 'S率(%) 推移', domain: [0, 100], formatter: (v) => v.toFixed(1) },
        { key: 'kPer7', label: '奪三振率(K/7) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
        { key: 'bbPer7', label: '与四死球率(BB/7) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
    ];
    const charts = comparisonDataType === 'batting' ? battingCharts : pitchingCharts;

    if (comparisonSelectedPlayers.length === 0) {
        return <div className="text-center py-10 text-gray-500">比較する選手を選択してください。</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {charts.map(chart => (
                <Card key={chart.key} className="h-96">
                      <h4 className="font-bold text-md text-gray-800 mb-3">{chart.label}</h4>
                      <ResponsiveContainer width="100%" height="85%">
                          <LineChart data={multiPlayerTrendData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                              <YAxis domain={chart.domain} tickFormatter={chart.formatter} />
                              <RechartsTooltip />
                              <Legend />
                              {comparisonSelectedPlayers.map((pid, idx) => (
                                  <Line key={pid} type="monotone" dataKey={`${pid}_${chart.key}`} name={playerList.find(p => p.id === pid)?.name || pid} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} connectNulls dot={{r: 3}} />
                              ))}
                          </LineChart>
                      </ResponsiveContainer>
                </Card>
            ))}
        </div>
    );
};


const ComparisonView = ({
    activeFilters, categories, defaultFilters, clearedFilters, onApplyFilters,
    comparisonMetric, setComparisonMetric, comparisonMinPA, setComparisonMinPA,
    comparisonChartType, setComparisonChartType, scatterX, setScatterX,
    scatterY, setScatterY, showScatterLabels, setShowScatterLabels,
    comparisonDataType, setComparisonDataType, showAllInRankings,
    comparisonSelectedPlayers, setComparisonSelectedPlayers, comparisonTrendPeriod, setComparisonTrendPeriod,
    battingMetricOptions, pitchingMetricOptions, playerList, multiPlayerTrendData,
    aggregatedBatting, aggregatedPitching
}) => {
    const currentMetricOptions = comparisonDataType === 'batting' ? battingMetricOptions : pitchingMetricOptions;
    
    const viewModes = [
        { id: 'ranking', label: 'ランキング', icon: ListOrdered },
        { id: 'scatter', label: '相関分析', icon: GitCompareArrows },
        { id: 'all', label: '主要指標一覧', icon: ClipboardList },
        { id: 'chart-all', label: 'グラフ一括表示', icon: BarChart3 },
        { id: 'player-comparison', label: '選手間比較', icon: Users }
    ];

    const togglePlayerSelection = (pid) => setComparisonSelectedPlayers(
        comparisonSelectedPlayers.includes(pid) ? comparisonSelectedPlayers.filter(id => id !== pid) : [...comparisonSelectedPlayers, pid]
    );

    const rankingData = useMemo(() => {
        const isPitching = comparisonDataType === 'pitching';
        const data = isPitching ? aggregatedPitching.filter(p => p.inningsVal >= comparisonMinPA) : aggregatedBatting.filter(p => p.pa >= comparisonMinPA);
        const sortKey = (isPitching && comparisonMetric === 'displayInnings') ? 'inningsVal' : comparisonMetric;
        const sortAsc = ['era', 'whip'].includes(comparisonMetric);

        return [...data].sort((a, b) => (sortAsc ? (a[sortKey] ?? Infinity) - (b[sortKey] ?? Infinity) : (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity)))
            .map(p => {
                const value = p[sortKey];
                let displayValue = value;
                if (['avg', 'obp'].includes(comparisonMetric)) displayValue = formatRate(value);
                else if (typeof value === 'number' && !Number.isInteger(value)) displayValue = value.toFixed(3);
                return { name: p.name, value, displayValue };
            });
    }, [aggregatedBatting, aggregatedPitching, comparisonMetric, comparisonMinPA, comparisonDataType]);
  
    const comparisonScatterData = useMemo(() => (comparisonDataType === 'pitching' ? aggregatedPitching : aggregatedBatting)
        .filter(p => (comparisonDataType === 'pitching' ? p.inningsVal : p.pa) >= comparisonMinPA)
        .map(p => ({ name: p.name, x: p[scatterX], y: p[scatterY], z: comparisonDataType === 'batting' ? p.ops : p.inningsVal })), 
        [aggregatedBatting, aggregatedPitching, comparisonMinPA, scatterX, scatterY, comparisonDataType]
    );

    const renderTitle = () => {
        const mode = viewModes.find(m => m.id === comparisonChartType);
        if (!mode) return "比較分析";
        if (mode.id === 'ranking') return `${mode.label}: ${currentMetricOptions.find(m => m.v === comparisonMetric)?.l}`;
        if (mode.id === 'scatter') return `${mode.label}: ${currentMetricOptions.find(m => m.v === scatterX)?.l} vs ${currentMetricOptions.find(m => m.v === scatterY)?.l}`;
        return mode.label;
    };

    return (
        <div className="space-y-6">
            <FilterPanel {...{activeFilters, categories, defaultFilters, clearedFilters, onApplyFilters}} />
            
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Analysis Type & View Mode */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700">分析設定</h3>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">データ種別</label>
                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setComparisonDataType('batting')} className={`w-full py-2 rounded text-sm font-bold transition-all ${comparisonDataType === 'batting' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>打撃</button>
                                <button onClick={() => setComparisonDataType('pitching')} className={`w-full py-2 rounded text-sm font-bold transition-all ${comparisonDataType === 'pitching' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>投手</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="view-mode-select" className="text-sm font-semibold text-gray-600 mb-2 block">表示モード</label>
                            <select id="view-mode-select" value={comparisonChartType} onChange={e => setComparisonChartType(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                {viewModes.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Column 2: Detailed Settings */}
                    <div className="space-y-4">
                       <h3 className="font-bold text-gray-700">詳細設定</h3>
                        {comparisonChartType === 'ranking' && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-600 block">指標</label>
                                <select value={comparisonMetric} onChange={e => setComparisonMetric(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    {currentMetricOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                </select>
                            </div>
                        )}
                        {comparisonChartType === 'scatter' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600 block">X軸</label>
                                    <select value={scatterX} onChange={e => setScatterX(e.target.value)} className="w-full p-2 border rounded-md bg-white">{currentMetricOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600 block">Y軸</label>
                                    <select value={scatterY} onChange={e => setScatterY(e.target.value)} className="w-full p-2 border rounded-md bg-white">{currentMetricOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                                </div>
                                <div className="col-span-2 flex items-center gap-2 mt-2">
                                    <input type="checkbox" id="show-labels" checked={showScatterLabels} onChange={e => setShowScatterLabels(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    <label htmlFor="show-labels" className="text-sm text-gray-600">名前を表示</label>
                                </div>
                            </div>
                        )}
                         {comparisonChartType === 'player-comparison' && (
                            <div>
                                <label className="text-sm font-semibold text-gray-600 mb-2 block">集計単位</label>
                                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                  <button onClick={() => setComparisonTrendPeriod('game')} className={`w-full py-1.5 rounded text-xs font-bold transition-all ${comparisonTrendPeriod === 'game' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>試合別</button>
                                  <button onClick={() => setComparisonTrendPeriod('monthly')} className={`w-full py-1.5 rounded text-xs font-bold transition-all ${comparisonTrendPeriod === 'monthly' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>月別</button>
                                  <button onClick={() => setComparisonTrendPeriod('quarterly')} className={`w-full py-1.5 rounded text-xs font-bold transition-all ${comparisonTrendPeriod === 'quarterly' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>3ヶ月</button>
                                </div>
                            </div>
                         )}
                         {['ranking', 'scatter', 'chart-all'].includes(comparisonChartType) && (
                            <div className="pt-2">
                                <label className="text-sm font-semibold text-gray-600 mb-2 block">{comparisonDataType === 'pitching' ? '最低投球回' : '最低打席数'}</label>
                                <input type="number" min="0" value={comparisonMinPA} onChange={e => setComparisonMinPA(Number(e.target.value))} className="w-full p-2 border rounded-md" />
                            </div>
                         )}
                    </div>
                    {/* Column 3: Player Selection */}
                    {comparisonChartType === 'player-comparison' && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                               <h3 className="font-bold text-gray-700">選手選択</h3>
                               <span className="text-xs text-gray-500">{comparisonSelectedPlayers.length} 名選択</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                                {playerList.map(p => (
                                    <label key={p.id} className={`flex items-center space-x-2 p-1 rounded cursor-pointer transition-colors ${comparisonSelectedPlayers.includes(p.id) ? 'bg-blue-100 text-primary-700' : 'hover:bg-gray-100'}`}>
                                        <input type="checkbox" checked={comparisonSelectedPlayers.includes(p.id)} onChange={() => togglePlayerSelection(p.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                                        <span className="text-sm truncate">{p.number} {p.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-gray-700 mb-4">{renderTitle()}</h3>
                <div className="min-h-[500px]">
                    {comparisonChartType === 'ranking' && (
                        <ResponsiveContainer width="100%" height={500}>
                            <BarChart data={rankingData} layout="vertical" margin={{ top: 5, right: 40, left: 60, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} interval={0} /><RechartsTooltip cursor={{fill: 'transparent'}} /><Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}><LabelList dataKey="displayValue" position="right" style={{ fill: '#374151', fontSize: '12px' }}/></Bar></BarChart>
                        </ResponsiveContainer>
                    )}
                    {comparisonChartType === 'scatter' && (
                        <ResponsiveContainer width="100%" height={500}>
                            <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}><CartesianGrid /><ZAxis type="number" dataKey="z" range={[20, 400]} name={comparisonDataType === 'batting' ? 'OPS' : '投球回'} /><XAxis type="number" dataKey="x" name={currentMetricOptions.find(m=>m.v===scatterX)?.l} domain={['auto', 'auto']} tickFormatter={v=>Number(v).toFixed(3)} label={{ value: currentMetricOptions.find(m=>m.v===scatterX)?.l, position: 'insideBottom', offset: -10 }} /><YAxis type="number" dataKey="y" name={currentMetricOptions.find(m=>m.v===scatterY)?.l} domain={['auto', 'auto']} tickFormatter={v=>Number(v).toFixed(3)} label={{ value: currentMetricOptions.find(m=>m.v===scatterY)?.l, angle: -90, position: 'insideLeft' }} /><RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => { if (active && payload && payload.length) { const data = payload[0].payload; return <div className="bg-white p-2 border shadow-sm rounded-md text-sm"><p className="font-bold mb-2 text-gray-800">{data.name}</p><p style={{color: payload[0].color}}>{payload[0].name} (X軸): {data.x}</p><p style={{color: payload[1].color}}>{payload[1].name} (Y軸): {data.y}</p><p className="text-xs text-gray-500 mt-1">{comparisonDataType === 'batting' ? `OPS: ${data.z.toFixed(3)}` : `投球回: ${data.z.toFixed(1)}`}</p></div> } return null; }} /><Scatter name="選手" data={comparisonScatterData} fill="#8884d8">{showScatterLabels && <LabelList dataKey="name" position="top" style={{ fontSize: '10px' }} />}</Scatter></ScatterChart>
                        </ResponsiveContainer>
                    )}
                    {comparisonChartType === 'all' && <AllRankingsView battingData={aggregatedBatting} pitchingData={aggregatedPitching} minPA={comparisonMinPA} minInnings={comparisonMinPA} showAll={showAllInRankings}/>}
                    {comparisonChartType === 'chart-all' && <AllChartsView data={(comparisonDataType === 'batting' ? aggregatedBatting : aggregatedPitching).filter(p => (comparisonDataType === 'batting' ? p.pa : p.inningsVal) >= comparisonMinPA)} metricOptions={currentMetricOptions} isPitching={comparisonDataType === 'pitching'}/>}
                    {comparisonChartType === 'player-comparison' && <PlayerComparisonCharts {...{multiPlayerTrendData, comparisonSelectedPlayers, playerList, comparisonDataType}} />}
                </div>
            </Card>
        </div>
    );
};

export default ComparisonView;
