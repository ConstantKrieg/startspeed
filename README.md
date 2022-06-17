# startspeed

![showcase](https://raw.githubusercontent.com/ConstantKrieg/startspeed/master/startspeed.gif)


This project scores participant horses in a trotting race based on how often they have led a race after the first 500m in the past. It gives higher scores based on the start track from which the lead has been taken. It is intended for personal use as assistance when betting on trotting races.

The API's used do not allow any kind of readily available application to be made public so API addresses are not available on this repo. 

startspeed is a CLI application. To run the application one must have the following:
- a redis database hosted and it's set as an environmental variable along with credentials
- API address for retrieving upcoming races and their participants as an env variable
- API address for retrieving previous race results for participants as an env variable

When these are set the application can be installed by running the following commands

`npm install`

`npm run build`

`npm run install local` (requires sudo rights)

Application can then be used by the following command
 
 `startspeed -t {track name} -r {race number}`