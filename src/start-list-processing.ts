import chalk from 'chalk';
import { fetchData, ResponseCallbackParams } from './common';
require('dotenv').config();

type CardInfo = {
    trackName: string,
    cardId: number,
}

type RaceInfo = {
    number: number,
    raceId: number,
}

type HorseInfo = {
    startNumber: number,
    horseName: string
}

const START_LIST_API_BASE_URL = process.env.START_LIST_API_BASE_URL;

const fetchTrackId = (trackName: string): Promise<number> => {

    const url = START_LIST_API_BASE_URL + '/cards/today'
    const spinnerText = 'Finding cards for track: ' + chalk.blue(trackName)

    const responseCallback = (params: ResponseCallbackParams) => {
        if (!params.resp.data.collection) {
            params.reject(-1)
        }

        const raceCards: CardInfo[] = params.resp.data.collection;

        const possibleCardIds: number[] = raceCards
            .filter(card => card.trackName.toLowerCase() === trackName.toLowerCase())
            .map(card => card.cardId);


        if (possibleCardIds.length < 1) {
            params.spinner.fail();
            console.log(chalk.red('Could not find track id with track name', trackName))
            process.exit(1);
        }

        params.spinner.succeed();
        params.resolve(possibleCardIds.pop() || -1);
    }

    return fetchData(url, responseCallback, spinnerText)
}


const fetchStartId = (trackId: number, startNumber: number): Promise<number> => {

    const url = START_LIST_API_BASE_URL + '/card/' + trackId + '/races';
    const spinnerText = 'Finding id for start ' + chalk.blue(startNumber);

    const responseCallback = (params: ResponseCallbackParams) => {
        if (!params.resp.data.collection) {
            params.reject(-1)
        }

        const races: RaceInfo[] = params.resp.data.collection;
        const possibleRaceIds: number[] = races.filter(race => race.number === startNumber).map(race => race.raceId);

        if (possibleRaceIds.length < 1) {
            params.spinner.fail();
            console.log(chalk.red('Could not find start', startNumber, 'for given track'))
            process.exit(1);
        }

        params.spinner.succeed()
        params.resolve(possibleRaceIds.pop() || -1);
    }

    return fetchData(url, responseCallback, spinnerText)
}


const fetchHorsesForStart = (startId: number): Promise<HorseInfo[]> => {

    const url = START_LIST_API_BASE_URL + '/race/' + startId + '/runners';
    const spinnerText = 'Finding horses for start';

    const responseCallback = (params: ResponseCallbackParams) => {
        if (!params.resp.data.collection) {
            params.reject([])
        }

        const horses: HorseInfo[] = params.resp.data.collection.map((horse: HorseInfo) => {
            return { horseName: horse.horseName.split('*')[0], startNumber: horse.startNumber }
        });

        params.spinner.succeed();
        params.resolve(horses);
    }

    return fetchData(url, responseCallback, spinnerText);
}


export {fetchTrackId, fetchStartId, fetchHorsesForStart};