import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis, LabelList
} from 'recharts';
import { Users } from 'lucide-react';
import Card from '../components/Card';
import FilterPanel from '../components/FilterPanel';
import { formatRate } from '../utils/formatters';

//比較グラフ用の色パレット
const COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#6366f1", // Indigo
    "#d946ef"  // Fuchsia
];

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

const ComparisonView = ({
    activeFilters,
    categories,
    defaultFilters,
    clearedFilters,
    onApplyFilters,
    comparisonMetric,
    setComparisonMetric,
    comparisonMinPA,
    setComparisonMinPA,
    comparisonChartType,
    setComparisonChartType,
    scatterX,
    setScatterX,
    scatterY,
    setScatterY,
    showScatterLabels,
    setShowScatterLabels,
    comparisonDataType,
    setComparisonDataType,
    showAllInRankings,
    comparisonSelectedPlayers,
    setComparisonSelectedPlayers,
    comparisonTrendPeriod,
    setComparisonTrendPeriod,
    battingMetricOptions,
    pitchingMetricOptions,
    playerList,
    multiPlayerTrendData,
    aggregatedBatting,
    aggregatedPitching
}) => {
    const currentMetricOptions = comparisonDataType === 'batting' ? battingMetricOptions : pitchingMetricOptions;
    const scatterMetricOptions = comparisonDataType === 'batting' ? battingMetricOptions : pitchingMetricOptions;

    // 選手選択トグル処理
    const togglePlayerSelection = (pid) => {
        if (comparisonSelectedPlayers.includes(pid)) {
            setComparisonSelectedPlayers(comparisonSelectedPlayers.filter(id => id !== pid));
        } else {
            // 5人制限を撤廃
            setComparisonSelectedPlayers([...comparisonSelectedPlayers, pid]);
        }
    };

    // 選手間比較チャートのレンダリング
    const renderPlayerComparisonCharts = () => {
        if (comparisonDataType === 'batting') {
            const charts = [
                { key: 'avg', label: '打率 推移', domain: [0, 0.6], formatter: (v) => v.toFixed(3) },
                { key: 'ops', label: 'OPS 推移', domain: [0, 1.2], formatter: (v) => v.toFixed(3) },
                { key: 'obp', label: '出塁率 推移', domain: [0, 0.7], formatter: (v) => v.toFixed(3) },
                { key: 'slg', label: '長打率 推移', domain: [0, 0.8], formatter: (v) => v.toFixed(3) },
                { key: 'bbRate', label: '四死球率(%) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(1) },
                { key: 'soRate', label: '三振率(%) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(1) },
            ];
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
                                      {comparisonSelectedPlayers.map((pid, idx) => {
                                          const pName = playerList.find(p => p.id === pid)?.name || pid;
                                          return (
                                              <Line 
                                                  key={pid} 
                                                  type="monotone" 
                                                  dataKey={`${pid}_${chart.key}`} 
                                                  name={pName} 
                                                  stroke={COLORS[idx % COLORS.length]} 
                                                  strokeWidth={2} 
                                                  connectNulls
                                                  dot={{r: 3}} 
                                              />
                                          );
                                      })}
                                  </LineChart>
                              </ResponsiveContainer>
                        </Card>
                    ))}
                </div>
            );
        } else {
            const charts = [
                { key: 'era', label: '防御率 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
                { key: 'whip', label: 'WHIP 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
                { key: 'strikeRate', label: 'S率(%) 推移', domain: [0, 100], formatter: (v) => v.toFixed(1) },
                { key: 'kbb', label: 'K/BB 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
                { key: 'kPer7', label: '奪三振率(K/7) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
                { key: 'bbPer7', label: '与四死球率(BB/7) 推移', domain: [0, 'auto'], formatter: (v) => v.toFixed(2) },
            ];
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
                                      {comparisonSelectedPlayers.map((pid, idx) => {
                                          const pName = playerList.find(p => p.id === pid)?.name || pid;
                                          return (
                                              <Line 
                                                  key={pid} 
                                                  type="monotone" 
                                                  dataKey={`${pid}_${chart.key}`} 
                                                  name={pName} 
                                                  stroke={COLORS[idx % COLORS.length]} 
                                                  strokeWidth={2} 
                                                  connectNulls
                                                  dot={{r: 3}} 
                                              />
                                          );
                                      })}
                                  </LineChart>
                              </ResponsiveContainer>
                        </Card>
                    ))}
                </div>
            );
        }
    };

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
        return aggregatedBatting
            .filter(p => p.pa >= comparisonMinPA)
            .map(p => ({
                name: p.name,
                x: p[scatterX],
                y: p[scatterY],
                z: p.ops
            }));
    }, [aggregatedBatting, aggregatedPitching, comparisonMinPA, scatterX, scatterY, comparisonDataType]);

    return (
        <div className="space-y-6">
            <FilterPanel 
              activeFilters={activeFilters}
              categories={categories}
              defaultFilters={defaultFilters}
              clearedFilters={clearedFilters}
              onApplyFilters={onApplyFilters}
            />
            
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
                      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                          <button 
                              onClick={() => setComparisonChartType('ranking')}
                              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'ranking' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              ランキング
                          </button>
                          <button 
                              onClick={() => setComparisonChartType('scatter')}
                              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'scatter' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              相関分析
                          </button>
                          <button 
                              onClick={() => setComparisonChartType('all')}
                              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              主要指標ランキング
                          </button>
                          <button 
                              onClick={() => setComparisonChartType('chart-all')}
                              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'chart-all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              グラフ一括表示
                          </button>
                          <button 
                              onClick={() => setComparisonChartType('player-comparison')}
                              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonChartType === 'player-comparison' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              <Users size={16} className="inline mr-1 mb-0.5"/>
                              選手間比較
                          </button>
                      </div>
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
                        <label className="text-sm text-gray-600 ml-4">
                         {comparisonDataType === 'pitching' ? '最低投球回' : '最低打席数'}: 
                      </label>
                      <input 
                          type="number" 
                          min="0"
                          value={comparisonMinPA}
                          onChange={(e) => setComparisonMinPA(Number(e.target.value))}
                          className="w-16 p-1 border rounded text-center"
                      />
                    </div>
                )}

                {comparisonChartType === 'scatter' && (
                    <div className="flex items-center gap-4 flex-wrap">
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
                                名前の表示
                            </label>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                           <label className="text-sm text-gray-600">{comparisonDataType === 'pitching' ? '最低投球回' : '最低打席数'}:</label>
                           <input type="number" min="0" value={comparisonMinPA} onChange={(e) => setComparisonMinPA(Number(e.target.value))} className="w-16 p-1 border rounded text-center" />
                        </div>
                    </div>
                )}

                {/* 選手間比較モード用の設定エリア */}
                {comparisonChartType === 'player-comparison' && (
                    <div className="flex flex-col gap-4 border-t pt-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-bold text-gray-700">集計単位:</label>
                              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                  <button onClick={() => setComparisonTrendPeriod('game')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${comparisonTrendPeriod === 'game' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>試合別</button>
                                  <button onClick={() => setComparisonTrendPeriod('monthly')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${comparisonTrendPeriod === 'monthly' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>月別</button>
                                  <button onClick={() => setComparisonTrendPeriod('quarterly')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${comparisonTrendPeriod === 'quarterly' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>3ヶ月単位</button>
                              </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-gray-700">比較選手を選択:</label>
                              <span className="text-xs text-gray-500">{comparisonSelectedPlayers.length} 名選択中</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
                                {playerList.map(p => {
                                    const isSelected = comparisonSelectedPlayers.includes(p.id);
                                    return (
                                        <label key={p.id} className={`flex items-center space-x-2 text-xs p-1 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 font-bold text-primary-700' : 'hover:bg-white text-gray-600'}`}>
                                            <input 
                                              type="checkbox" 
                                              checked={isSelected} 
                                              onChange={() => togglePlayerSelection(p.id)}
                                              className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="truncate">{p.number} {p.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Card className={['all', 'chart-all', 'player-comparison'].includes(comparisonChartType) ? '' : 'h-[500px]'}>
                <h3 className="text-lg font-bold text-gray-700 mb-4">
                    {comparisonChartType === 'ranking' ? 
                        `チーム内ランキング: ${currentMetricOptions.find(m => m.v === comparisonMetric)?.l}` : 
                        comparisonChartType === 'scatter' ?
                        `相関分析: ${scatterMetricOptions.find(m => m.v === scatterX)?.l} vs ${scatterMetricOptions.find(m => m.v === scatterY)?.l}` :
                        comparisonChartType === 'chart-all' ?
                        '全指標グラフ表示' :
                        comparisonChartType === 'player-comparison' ?
                        '選手間 推移比較' :
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
                              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
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
                {comparisonChartType === 'player-comparison' && renderPlayerComparisonCharts()}
            </Card>
        </div>
    );
};

export default ComparisonView;
