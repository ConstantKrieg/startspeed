#!/usr/bin/env node
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import Redis from "ioredis";
import ora from 'ora';
import { program } from 'commander';

import { fetchTrackId, fetchStartId, fetchHorsesForStart } from './start-list-processing';
import { fetchHorseRaceHistory, fetchHorseStatId, fetchStartInfromationForHorse, HorseStartSpeedInfo } from './stat-processing';
import { computeCacheKey } from './common';

require('dotenv').config();


type StartInfo = {
	track: string,
	start: number,
}

const secondsInADay = 60 * 60 * 24

const connectToRedis = (): Promise<Redis> => {
	return new Promise<Redis>((resolve, reject) => {

		let redis: Redis;

		redis = new Redis(parseInt(process.env.REDIS_PORT!), process.env.REDIS_HOSTNAME!, {
			username: 'default',
			password: process.env.REDIS_PASSWORD,
			lazyConnect: true
		})

		const redisSpinner = ora('Connecting to databse').start();


		redis.on('error', _ => {
			redisSpinner.fail();
			reject();
		})

		redis.connect()
			.then(() => {
				redisSpinner.succeed()
				resolve(redis);
			})


	});

}

const parseArguments = (): StartInfo => {
	program
		.option('-t, --track <string>')
		.option('-s, --start <number>');

	program.parse(process.argv);

	const options = program.opts();
	const track: string = options.track;
	const start: string = options.start;

	if (!track || !start) {
		console.log(chalk.red('Missing track and/or start info!'));
		program.outputHelp()
		process.exit(1);
	}

	return { track, start: parseInt(start) }
}




clear();
console.log(
	chalk.red(
		figlet.textSync('startspeed', { horizontalLayout: 'full' })
	)
)

const { track, start } = parseArguments();
connectToRedis()
	.then(cache => {
		if (!cache) {
			process.exit(1);
		}

		const cacheKey = computeCacheKey(track, start)

		cache.get(cacheKey)
			.then(result => {

				if (result) {

					console.log(chalk.greenBright('Found info from cache'));
					const infos: HorseStartSpeedInfo[] = JSON.parse(result);
					infos.forEach(result => console.log(chalk.green(result.startNumber + ' ' + result.name + ': ' + result.startScore.toFixed(2))))
					process.exit(0);
				}

				console.log(chalk.yellow('Cache miss. Retrieving data'));

				fetchTrackId(track)
					.then(trackId => fetchStartId(trackId, start))
					.then(raceId => fetchHorsesForStart(raceId))
					.then(horses => {

						horses.sort((a, b) => a.startNumber - b.startNumber);
						const horsePromises: Promise<HorseStartSpeedInfo>[] = horses.map(horse => {
							return new Promise((resolve, reject) => {
								fetchHorseStatId(horse.startNumber, horse.horseName)
									.then(statId => fetchHorseRaceHistory(horse.startNumber, horse.horseName, statId))
									.then(horseStats => fetchStartInfromationForHorse(horseStats))
									.then(result => {
										resolve(result);
									})
							})
						})

						Promise.all(horsePromises)
							.then(startSpeedInfos => {
								const finalList = startSpeedInfos.sort((a, b) => a.startNumber - b.startNumber)
								finalList.forEach( result => console.log(chalk.green(result.startNumber + ' ' + result.name + ': ' + result.startScore.toFixed(2))))
								cache.set(cacheKey, JSON.stringify(finalList), 'EX', secondsInADay)

								process.exit(0);
							}); 
					})
			})
	})
	.catch(_ => process.exit(1))