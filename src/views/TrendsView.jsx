import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, AreaChart, Area
} from 'recharts';
import Card from '../components/Card';
import FilterPanel from '../components/FilterPanel';

const TrendsView = ({
    activeFilters,
    onApplyFilters,
    categories,
    defaultFilters,
    clearedFilters,
    trendTarget,
    setTrendTarget,
    trendType,
    setTrendType,
    playerList,
    selectedPlayerId,
    setSelectedPlayerId,
    trendPeriod,
    setTrendPeriod,
    teamTrendData,
    playerBattingTrendData,
    playerPitchingTrendData
}) => {

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
                                  <YAxis domain={[0, 'auto']} tickFormatter={(v) => v.toFixed(3)} />
                                  <RechartsTooltip content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
                                          return (
                                              <div className="bg-white p-2 border shadow-sm text-sm">
                                                  <p className="font-bold mb-1">{label}</p>
                                                  <p className="text-gray-500 text-xs mb-2">vs {payload[0].payload.opponent}</p>
                                                  {payload.map(p => (
                                                      <p key={p.name} style={{color: p.color}}>
                                                          {p.name}: {p.value.toFixed(3)}
                                                      </p>
                                                  ))}
                                              </div>
                                          );
                                      }
                                      return null;
                                  }}/>
                                  <Legend />
                                  <Line type="monotone" dataKey="avg" name="累積打率" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                                  <Line type="monotone" dataKey="ops" name="累積OPS" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
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
                                  <RechartsTooltip formatter={(v) => v.toFixed(3)} />
                                  <Legend />
                                  <Area type="monotone" dataKey="avg" name="打率" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                  <Area type="monotone" dataKey="obp" name="出塁率" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                  <Area type="monotone" dataKey="slg" name="長打率" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
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
                                  <YAxis domain={[0, 'auto']} unit="%" tickFormatter={(v) => v.toFixed(1)} />
                                  <RechartsTooltip formatter={(v) => `${v.toFixed(1)}%`} />
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
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
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
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis yAxisId="left" label={{ value: '回', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} />
                                    <RechartsTooltip content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-2 border shadow-sm text-sm">
                                                    <p className="font-bold mb-1">{label}</p>
                                                    <p>投球回: {data.innings.toFixed(1)}</p>
                                                    <p>S率: {data.strikeRate.toFixed(1)}% ({data.pitches}球)</p>
                                                    <p>四球: {data.bb}, 死球: {data.hbp}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}/>
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="innings" name="投球回" fill="#3b82f6" />
                                    <Line yAxisId="right" type="monotone" dataKey="strikeRate" name="S率" stroke="#10b981" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">累積 K/7・BB/7 推移</h3>
                        {playerPitchingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={playerPitchingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis domain={[0, 'auto']} label={{ value: 'K/7, BB/7', angle: -90, position: 'insideLeft' }} tickFormatter={(v) => v.toFixed(2)} />
                                    <RechartsTooltip formatter={(value) => value.toFixed(2)} />
                                    <Legend />
                                    <Line type="monotone" dataKey="kPer7" name="K/7" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                                    <Line type="monotone" dataKey="bbPer7" name="BB/7" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">累積 奪三振率・与四死球率 推移</h3>
                        {playerPitchingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={playerPitchingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis domain={[0, 'auto']} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                                    <RechartsTooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="kRate" name="奪三振率" stroke="#10b981" strokeWidth={2} dot={{r: 3}} />
                                    <Line type="monotone" dataKey="bbRate" name="与四死球率" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">累積 K/BB</h3>
                        {playerPitchingTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={playerPitchingTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="periodKey" tick={{fontSize: 10}} />
                                    <YAxis domain={[0, 'auto']} tickFormatter={(v) => v.toFixed(2)} />
                                    <RechartsTooltip formatter={(value) => value.toFixed(2)} />
                                    <Legend />
                                    <Area type="monotone" dataKey="kbb" name="K/BB" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>}
                    </Card>
                </div>
            );
        }
    };

    const renderTeamCharts = () => {
        if (trendType === 'batting') {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム打撃成績推移</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.batting}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayKey" tick={{fontSize: 10}} />
                                <YAxis domain={[0, 'auto']} tickFormatter={(v) => v.toFixed(3)} />
                                <RechartsTooltip formatter={(v) => v.toFixed(3)} />
                                <Legend />
                                <Line type="monotone" dataKey="avg" name="打率" stroke="#3b82f6" strokeWidth={2} />
                                <Line type="monotone" dataKey="ops" name="OPS" stroke="#f59e0b" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム四死球率・三振率推移</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.batting}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayKey" tick={{fontSize: 10}} />
                                <YAxis domain={[0, 'auto']} unit="%" tickFormatter={(v) => v.toFixed(1)} />
                                <RechartsTooltip formatter={(v) => `${v.toFixed(1)}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="bbRate" name="四死球率(BB%)" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="soRate" name="三振率(K%)" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96 lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム打撃結果</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={teamTrendData.batting}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayKey" tick={{fontSize: 10}} />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="runs" name="得点" fill="#3b82f6" />
                                <Bar dataKey="h" name="安打" fill="#10b981" />
                                <Bar dataKey="hr" name="本塁打" fill="#f59e0b" />
                                <Bar dataKey="sb" name="盗塁" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            );
        } else {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム投手成績推移 (ERA, WHIP)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.pitching}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayKey" tick={{fontSize: 10}} />
                                <YAxis yAxisId="left" domain={[0, 'auto']} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} />
                                <RechartsTooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="era" name="防御率" stroke="#ef4444" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="whip" name="WHIP" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム投手成績推移 (K/7, BB/7)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.pitching}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayKey" tick={{fontSize: 10}} />
                                <YAxis domain={[0, 'auto']} tickFormatter={(v) => v.toFixed(2)}/>
                                <RechartsTooltip formatter={(value) => value.toFixed(2)} />
                                <Legend />
                                <Line type="monotone" dataKey="kPer7" name="K/7" stroke="#3b82f6" strokeWidth={2} />
                                <Line type="monotone" dataKey="bbPer7" name="BB/7" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="h-96">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">チーム投手成績推移 (奪三振率, 与四死球率)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={teamTrendData.pitching}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayKey" tick={{fontSize: 10}} />
                                <YAxis domain={[0, 'auto']} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                                <RechartsTooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="kRate" name="奪三振率" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="bbRate" name="与四死球率" stroke="#f59e0b" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            );
        }
    };
    return (
        <div className="space-y-6">
            <FilterPanel 
              activeFilters={activeFilters}
              onApplyFilters={onApplyFilters}
              categories={categories}
              defaultFilters={defaultFilters}
              clearedFilters={clearedFilters}
            />
            <Card>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-700">対象:</label>
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setTrendTarget('team')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${trendTarget === 'team' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>チーム</button>
                            <button onClick={() => setTrendTarget('player')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${trendTarget === 'player' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>個人</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-700">成績:</label>
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setTrendType('batting')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${trendType === 'batting' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>打撃</button>
                            <button onClick={() => setTrendType('pitching')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${trendType === 'pitching' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>投手</button>
                        </div>
                    </div>

                    {trendTarget === 'player' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-700">選手:</label>
                            <select 
                                value={selectedPlayerId} 
                                onChange={e => setSelectedPlayerId(e.target.value)}
                                className="p-2 border rounded-md"
                            >
                                {playerList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-700">集計単位:</label>
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setTrendPeriod('game')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendPeriod === 'game' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>試合別</button>
                            <button onClick={() => setTrendPeriod('monthly')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendPeriod === 'monthly' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>月別</button>
                            <button onClick={() => setTrendPeriod('quarterly')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${trendPeriod === 'quarterly' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>3ヶ月単位</button>
                        </div>
                    </div>
                </div>
            </Card>

            {trendTarget === 'player' ? renderPlayerCharts() : renderTeamCharts()}
        </div>
    );
}

export default TrendsView;