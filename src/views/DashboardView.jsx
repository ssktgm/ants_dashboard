import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line, ComposedChart, ScatterChart, Scatter, ZAxis, ReferenceLine, LabelList
} from 'recharts';
import { Activity, Award, AlertCircle, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import FilterPanel from '../components/FilterPanel';
import { formatBattingRate, formatPitchingStat } from '../utils/formatters';

const DashboardView = ({
    activeFilters,
    categories,
    defaultFilters,
    clearedFilters,
    onApplyFilters,
    teamStats,
    aggregatedBatting,
    monthlyBattingTrend,
    monthlyPitchingTrend,
    gameByGameStats
}) => {
    const [showHomeScatterLabels, setShowHomeScatterLabels] = useState(false);

  return (
    <div className="space-y-6">
      <FilterPanel 
        activeFilters={activeFilters}
        categories={categories}
        defaultFilters={defaultFilters}
        clearedFilters={clearedFilters}
        onApplyFilters={onApplyFilters}
      />
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
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 0.6]} tickFormatter={(val) => formatBattingRate(val)} />
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
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 1]} tickFormatter={(val) => formatBattingRate(val)} label={{ value: '勝率', angle: 90, position: 'insideRight' }} />
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
                                {winningPercentagePayload && <p style={{color: winningPercentagePayload.color}}>勝率: {formatBattingRate(data.winningPercentage)}</p>}
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
}

export default DashboardView;
