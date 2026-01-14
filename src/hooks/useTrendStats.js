import { useMemo } from 'react';
import { safeDiv } from '../utils/formatters';
import { parseDate } from '../utils/date';

export const useTrendStats = (filteredBattingData, filteredPitchingData, trendPeriod, trendTarget, trendType, selectedPlayerId, comparisonChartType, comparisonSelectedPlayers, comparisonTrendPeriod, comparisonDataType) => {
  const monthlyBattingTrend = useMemo(() => {
    const periods = {};
    filteredBattingData.forEach(row => {
        const d = parseDate(row['日付']);
        if (!d) return;
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
    
    return Object.values(periods).sort((a, b) => new Date(a.month) - new Date(b.month)).map(m => {
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
        if (!d) return;
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
    
    return Object.values(periods).sort((a, b) => new Date(a.month) - new Date(b.month)).map(m => {
        const strikeRate = safeDiv(m.s, m.pitches) * 100;
        return { ...m, bbhbp: m.bb + m.hbp, strikeRate: Number(strikeRate.toFixed(1)) };
    });
  }, [filteredPitchingData]);

  const teamTrendData = useMemo(() => {
    const getKey = (row, period) => {
        const d = parseDate(row['日付']);
        if (!d) return null;
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (period) {
            case 'game':
                const homeTeam = row['後攻'] || '';
                const awayTeam = row['先攻'] || '';
                const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
                const opponent = isHomeArinko ? awayTeam : homeTeam;
                const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                return `${formattedDate} vs ${opponent || '不明'}`;
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
    
    const battingResult = Object.values(battingPeriods).sort((a, b) => {
        if (trendPeriod === 'game') {
            const dateA = parseDate(a.periodKey.split(' vs ')[0]);
            const dateB = parseDate(b.periodKey.split(' vs ')[0]);
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();
            if (timeA !== timeB) {
                return timeA - timeB;
            }
            return a.periodKey.localeCompare(b.periodKey); // Keep for same-day games
        }
        if (trendPeriod === 'monthly') {
            return new Date(a.periodKey) - new Date(b.periodKey);
        }
        return a.periodKey.localeCompare(b.periodKey);
    }).map(m => {
       const avg = safeDiv(m.h, m.ab);
       const obp = safeDiv(m.h + m.bb + m.hbp, m.ab + m.bb + m.hbp + m.sf);
       const slg = safeDiv((m.h - m.doubles - m.triples - m.hr) + m.doubles*2 + m.triples*3 + m.hr*4, m.ab);
       const pa = m.ab + m.bb + m.hbp + m.sf;
       const bbRate = safeDiv(m.bb + m.hbp, pa) * 100;
       const soRate = safeDiv(m.so, pa) * 100;
       
       let displayKey = m.periodKey;
       if (trendPeriod === 'game') {
           const dateStr = m.periodKey.split(' vs ')[0];
           const opponent = m.periodKey.split(' vs ')[1] || '不明';
           const d = parseDate(dateStr);
           const month = (d.getMonth() + 1).toString().padStart(2, '0');
           const day = d.getDate().toString().padStart(2, '0');
           displayKey = `${month}/${day} vs ${opponent}`;
       }

       return {
          ...m,
          displayKey,
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
    
    const pitchingResult = Object.values(pitchingPeriods).sort((a, b) => {
        if (trendPeriod === 'game') {
            const dateA = parseDate(a.periodKey.split(' vs ')[0]);
            const dateB = parseDate(b.periodKey.split(' vs ')[0]);
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();
            if (timeA !== timeB) {
                return timeA - timeB;
            }
            return a.periodKey.localeCompare(b.periodKey); // Keep for same-day games
        }
        if (trendPeriod === 'monthly') {
            return new Date(a.periodKey) - new Date(b.periodKey);
        }
        return a.periodKey.localeCompare(b.periodKey);
    }).map(m => {
        const innings = m.outs / 3;
        const era = safeDiv(m.er * 7, innings);
        const whip = safeDiv(m.h + m.bb + m.hbp, innings);
        const kPer7 = safeDiv(m.so * 7, innings);
        const bbPer7 = safeDiv((m.bb + m.hbp) * 7, innings);
        const strikeRate = safeDiv(m.s, m.pitches) * 100;
        
        let displayKey = m.periodKey;
        if (trendPeriod === 'game') {
           const dateStr = m.periodKey.split(' vs ')[0];
           const opponent = m.periodKey.split(' vs ')[1] || '不明';
           const d = parseDate(dateStr);
           const month = (d.getMonth() + 1).toString().padStart(2, '0');
           const day = d.getDate().toString().padStart(2, '0');
           displayKey = `${month}/${day} vs ${opponent}`;
        }

        return { 
            ...m,
            displayKey,
            bbhbp: m.bb + m.hbp, 
            era: Number(era.toFixed(2)), 
            whip: Number(whip.toFixed(2)), 
            kPer7: Number(kPer7.toFixed(2)), 
            bbPer7: Number(bbPer7.toFixed(2)), 
            strikeRate: Number(strikeRate.toFixed(1)) 
        };
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

    const sortedGames = Array.from(gamesMap.values())
    .filter(game => parseDate(game.date)) // Filter out games with invalid dates
    .sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      // No need to check for nulls here due to the filter above
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.opponent.localeCompare(b.opponent);
    });

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
        if (!d) return null;
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (period) {
            case 'game':
                const homeTeam = row['後攻'] || '';
                const awayTeam = row['先攻'] || '';
                const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
                const opponent = isHomeArinko ? awayTeam : homeTeam;
                const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                return `${formattedDate} vs ${opponent || '不明'}`;
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

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (trendPeriod === 'game') {
            const dateA = parseDate(a.split(' vs ')[0]);
            const dateB = parseDate(b.split(' vs ')[0]);
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();
            if (timeA !== timeB) {
                return timeA - timeB;
            }
            return a.localeCompare(b);
        }
        if (trendPeriod === 'monthly') {
            return new Date(a) - new Date(b);
        }
        return a.localeCompare(b);
    });

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
        if (!d) return null;
        const year = d.getFullYear();
        const month = d.getMonth();

        switch (period) {
            case 'game':
                const homeTeam = row['後攻'] || '';
                const awayTeam = row['先攻'] || '';
                const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
                const opponent = isHomeArinko ? awayTeam : homeTeam;
                const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                return `${formattedDate} vs ${opponent || '不明'}`;
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

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (trendPeriod === 'game') {
            const dateA = parseDate(a.split(' vs ')[0]);
            const dateB = parseDate(b.split(' vs ')[0]);
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();
            if (timeA !== timeB) {
                return timeA - timeB;
            }
            return a.localeCompare(b);
        }
        if (trendPeriod === 'monthly') {
            return new Date(a) - new Date(b);
        }
        return a.localeCompare(b);
    });

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

    const multiPlayerTrendData = useMemo(() => {
        if (comparisonChartType !== 'player-comparison' || comparisonSelectedPlayers.length === 0) return [];

        const getKey = (row, period) => {
            const d = parseDate(row['日付']);
            if (!d) return null;
            const year = d.getFullYear();
            const month = d.getMonth();

            switch (period) {
                case 'game':
                    const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                    // game modeでは対戦相手もKeyに含めるが、複数人比較の場合は日付を軸にするのが自然。
                    // ただ、同日に複数試合ある場合を考慮し、既存ロジックに合わせて一意性を保つなら対戦相手も含める。
                    const homeTeam = row['後攻'] || '';
                    const awayTeam = row['先攻'] || '';
                    const isHomeArinko = homeTeam.includes('ありんこ') || homeTeam.includes('アントス');
                    const opponent = isHomeArinko ? awayTeam : homeTeam;
                    return `${formattedDate} vs ${opponent || '不明'}`;
                case 'quarterly':
                    const quarter = Math.floor(month / 3) + 1;
                    return `${year}-Q${quarter}`;
                case 'monthly':
                default:
                    return `${year}-${(month + 1).toString().padStart(2, '0')}`;
            }
        };

        // Calculate trend for each player
        const playersData = comparisonSelectedPlayers.map(pid => {
            const rows = comparisonDataType === 'batting'
                ? filteredBattingData.filter(r => (r['選手ID'] || r['名前']) === pid)
                : filteredPitchingData.filter(r => (r['選手ID'] || r['名前']) === pid);
            
            const grouped = {};
            rows.forEach(row => {
                const key = getKey(row, comparisonTrendPeriod);
                if (!key) return;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(row);
            });

            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                if (comparisonTrendPeriod === 'game') {
                    const dateA = parseDate(a.split(' vs ')[0]);
                    const dateB = parseDate(b.split(' vs ')[0]);
                    const timeA = dateA.getTime();
                    const timeB = dateB.getTime();
                    if (timeA !== timeB) return timeA - timeB;
                    return a.localeCompare(b);
                }
                if (comparisonTrendPeriod === 'monthly') return new Date(a) - new Date(b);
                return a.localeCompare(b);
            });

            // Cumulative Calculation
            const cumulative = comparisonDataType === 'batting'
                ? { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, doubles: 0, triples: 0, hr: 0, so: 0 }
                : { outs: 0, er: 0, bb: 0, hbp: 0, h: 0, so: 0, pitches: 0, strikes: 0 };
            
            return sortedKeys.map(key => {
                const periodRows = grouped[key];
                
                // Period stats
                if (comparisonDataType === 'batting') {
                    periodRows.forEach(row => {
                        cumulative.ab += (row['打数'] || 0);
                        cumulative.h += (row['安打'] || 0);
                        cumulative.bb += (row['四球'] || 0);
                        cumulative.hbp += (row['死球'] || 0);
                        cumulative.sf += (row['犠飛'] || 0);
                        cumulative.doubles += (row['二塁打'] || 0);
                        cumulative.triples += (row['三塁打'] || 0);
                        cumulative.hr += (row['本塁打'] || 0);
                        cumulative.so += (row['三振'] || 0);
                    });
                    const avg = safeDiv(cumulative.h, cumulative.ab);
                    const obp = safeDiv(cumulative.h + cumulative.bb + cumulative.hbp, cumulative.ab + cumulative.bb + cumulative.hbp + cumulative.sf);
                    const slg = safeDiv((cumulative.h - cumulative.doubles - cumulative.triples - cumulative.hr) + cumulative.doubles*2 + cumulative.triples*3 + cumulative.hr*4, cumulative.ab);
                    const ops = obp + slg;
                    const pa = cumulative.ab + cumulative.bb + cumulative.hbp + cumulative.sf;
                    const bbRate = safeDiv(cumulative.bb + cumulative.hbp, pa) * 100;
                    const soRate = safeDiv(cumulative.so, pa) * 100;

                    return { periodKey: key, [`${pid}_avg`]: avg, [`${pid}_ops`]: ops, [`${pid}_slg`]: slg, [`${pid}_obp`]: obp, [`${pid}_bbRate`]: bbRate, [`${pid}_soRate`]: soRate };
                } else {
                    periodRows.forEach(row => {
                        cumulative.outs += (row['アウト数'] || 0);
                        cumulative.er += (row['自責点'] || 0);
                        cumulative.bb += (row['四球'] || 0);
                        cumulative.hbp += (row['死球'] || 0);
                        cumulative.h += (row['安打'] || 0);
                        cumulative.so += (row['三振'] || 0);
                        cumulative.pitches += (row['球数'] || 0);
                        cumulative.strikes += (row['S数'] || 0);
                    });
                    const era = safeDiv(cumulative.er * 7, cumulative.outs / 3);
                    const whip = safeDiv(cumulative.bb + cumulative.hbp + cumulative.h, cumulative.outs / 3);
                    const kbb = safeDiv(cumulative.so, cumulative.bb);
                    const kPer7 = safeDiv(cumulative.so * 7, cumulative.outs / 3);
                    const bbPer7 = safeDiv((cumulative.bb + cumulative.hbp) * 7, cumulative.outs / 3);
                    const strikeRate = safeDiv(cumulative.strikes, cumulative.pitches) * 100;
                    
                    return { periodKey: key, [`${pid}_era`]: era, [`${pid}_whip`]: whip, [`${pid}_kbb`]: kbb, [`${pid}_kPer7`]: kPer7, [`${pid}_bbPer7`]: bbPer7, [`${pid}_strikeRate`]: strikeRate };
                }
            });
        });

        // Merge logic
        const allKeys = new Set();
        playersData.forEach(pData => pData.forEach(item => allKeys.add(item.periodKey)));
        
        const merged = Array.from(allKeys).sort((a, b) => {
            if (comparisonTrendPeriod === 'game') {
                const dateA = parseDate(a.split(' vs ')[0]);
                const dateB = parseDate(b.split(' vs ')[0]);
                const timeA = dateA.getTime();
                const timeB = dateB.getTime();
                if (timeA !== timeB) return timeA - timeB;
                return a.localeCompare(b);
            }
            if (comparisonTrendPeriod === 'monthly') return new Date(a) - new Date(b);
            return a.localeCompare(b);
        }).map(key => {
            const obj = { periodKey: key };
            playersData.forEach(pData => {
                const found = pData.find(d => d.periodKey === key);
                if (found) Object.assign(obj, found);
            });
            return obj;
        });

        return merged;
    }, [comparisonChartType, comparisonSelectedPlayers, comparisonTrendPeriod, comparisonDataType, filteredBattingData, filteredPitchingData]);


    return {
        monthlyBattingTrend,
        monthlyPitchingTrend,
        teamTrendData,
        gameByGameStats,
        playerBattingTrendData,
        playerPitchingTrendData,
        multiPlayerTrendData
    };
};
