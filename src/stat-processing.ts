import axios from 'axios';
import { fetchData, ResponseCallbackParams } from './common';
require('dotenv').config();

type StatRaceInfo = {
    raceInformation: {
        raceId: number,
        raceDayId: number
    },
    startPosition: {
        sortValue: number
    }
    startMethod: string, 
    withdrawn: boolean
}

type HorseStats = {
    startNumber: number,
    horseName: string,
    raceIdList: RaceId[]
}

type RaceId = {
    raceId: number,
    raceDayId: number,
    horseStartNumber: number
}

type StartLeaderInfo = {
    horseStartNumber: number
    tempo: string,
}


type HistoryRaceInfo = {
    raceId: number,
    generalInfo: {
        tempoText: string
    }
}

type RaceDayInfo = {
    racesWithReadyResult: HistoryRaceInfo[]
}

type HorseStartSpeedInfo = {
    name: string,
    startNumber: number,
    startScore: number
}


const STAT_API_URL_BASE = process.env.STAT_API_URL_BASE;

const fetchHorseStatId = (startNumber: number, horseName: string): Promise<number> => {

    const url = STAT_API_URL_BASE + '/horses/search/organisation/TROT'

    const queryParams = {
        age: 0,
        gender: 'BOTH',
        horseName: horseName,
        trotBreed: 'ALL',
        autoSuffixWildcard: true
    }

    const responseCallback = (params: ResponseCallbackParams) => {
        const results = params.resp.data;
        const horseInfo = results[0] || {horseId: -1}
        params.resolve(horseInfo.horseId);
    }

    return fetchData(url, responseCallback, undefined, queryParams);
}


const fetchHorseRaceHistory = (startNumber: number, horseName: string, horseStatId: number, ): Promise<HorseStats> => {
    const url = STAT_API_URL_BASE + '/horses/results/organisation/TROT/sourceofdata/SPORT/horseid/' + horseStatId

    const responseCallback = (params: ResponseCallbackParams) => {
        const raceList: StatRaceInfo[] = params.resp.data
            .filter((race: StatRaceInfo) => 
                race.withdrawn === false && race.startMethod === 'A' && race.startPosition.sortValue < 9);
        
        const raceIdList: RaceId[] = raceList.map((race: StatRaceInfo) => {return { raceId: race.raceInformation.raceId, raceDayId: race.raceInformation.raceDayId, horseStartNumber: race.startPosition.sortValue}});
        params.resolve({startNumber, horseName, raceIdList});
    }

    return fetchData(url, responseCallback);
}

const fetchStartInfromationForHorse = (horseStats: HorseStats): Promise<HorseStartSpeedInfo> => {
    const startsWithLeaderInfoPromises: Promise<StartLeaderInfo>[] = horseStats.raceIdList.map((raceId : RaceId) => {
        return new Promise<StartLeaderInfo>((resolve, reject) => {
            const raceDayUrl = STAT_API_URL_BASE + '/raceinfo/results/organisation/TROT/sourceofdata/SPORT/racedayid/' + raceId.raceDayId

            axios.get(raceDayUrl)
                .then(resp => {
                    const racesOfTheDay: RaceDayInfo = resp.data;

                    if (!racesOfTheDay.racesWithReadyResult) {
                        resolve({tempo: '', horseStartNumber: raceId.horseStartNumber})
                        return;
                    }

                    
                    const correctRace: HistoryRaceInfo | undefined = racesOfTheDay.racesWithReadyResult
                        .filter((raceInfo: HistoryRaceInfo) => raceInfo.raceId === raceId.raceId).pop();
                    
                    if (!correctRace) {
                        resolve({tempo: '', horseStartNumber: raceId.horseStartNumber})
                        return;
                    } 

                    resolve({tempo: correctRace!.generalInfo.tempoText, horseStartNumber: raceId.horseStartNumber})
                }).catch(e => console.log(e));
        });
    });

    return Promise.all(startsWithLeaderInfoPromises)
        .then(leaderInfos => {
            return leaderInfos.filter( info => info && info.tempo.length > 0).map(info => {
                let leadingHorse = '';
                try {
                    leadingHorse = parseLeaderFromTempoText(info.tempo);
                } catch {}

                const factor = leadingHorse === horseStats.horseName ? 1 : 0
                return factor * info.horseStartNumber / horseStats.raceIdList.length
            }).reduce( (agg, curr) => agg + curr, 0)
        }).then( startScore => {
            return { startNumber: horseStats.startNumber, name: horseStats.horseName, startScore}
        })
}

const parseLeaderFromTempoText = (text: string) => text.split('(', 2)[1].split(')', 2)[0].split(/\d /)[1]

export {HorseStartSpeedInfo, fetchHorseRaceHistory, fetchHorseStatId, fetchStartInfromationForHorse}