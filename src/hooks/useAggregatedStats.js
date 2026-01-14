import { useMemo } from 'react';
import { safeDiv } from '../utils/formatters';

export const useAggregatedStats = (filteredBattingData, filteredPitchingData) => {
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

    return { aggregatedBatting, aggregatedPitching, teamStats };
};
