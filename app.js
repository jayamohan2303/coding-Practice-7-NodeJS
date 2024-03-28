const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
let database = null

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error: ${e.message}')
    process.exit(1)
  }
}

initializeDBAndServer()

//match_detailsDBObject;
const convertMatchDBObjectToServerObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

//player_detailsDBObject;
const convertPlayerDBObjectToServerObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

//player_match_scoreDBObject;
const convertPlayerMatchScoreDBObjectToServerObject = dbObject => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
}

//API 1

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
  SELECT * FROM player_details
  `
  const playersArray = await database.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDBObjectToServerObject(eachPlayer),
    ),
  )
})

//API 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  SELECT * FROM player_details
  WHERE player_id=${playerId}
  `
  const playerArray = await database.get(getPlayerQuery)
  response.send(convertPlayerDBObjectToServerObject(playerArray))
})

//API 3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
    UPDATE 
      player_details
    SET 
      player_name ='${playerName}'
    WHERE  player_id=${playerId} 

  `
  await database.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

//API 4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
  SELECT * FROM match_details 
  WHERE 
  match_id=${matchId}
  `
  const matchArray = await database.get(getMatchQuery)
  response.send(convertMatchDBObjectToServerObject(matchArray))
})

//API 5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN match_details
    WHERE 
      player_id=${playerId}
  `
  const playerMatchArray = await database.all(getPlayerMatchesQuery)
  response.send(
    playerMatchArray.map(eachPlayerMatches =>
      convertMatchDBObjectToServerObject(eachPlayerMatches),
    ),
  )
})

//API 6

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getplayerMatchQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
     FROM player_match_score NATURAL JOIN player_details
  WHERE match_id= ${matchId};
  `
  const playerMatchArrays = await database.all(getplayerMatchQuery)
  response.send(playerMatchArrays)
})

//API 7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScores = `
  SELECT 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(player_match_score.fours) AS totalFours,
  SUM(player_match_score.sixes) AS totalSixes FROM 
  player_details INNER JOIN player_match_score ON 
  player_details.player_id = player_match_score.player_id
  WHERE player_details.player_id = ${playerId}
  `
  const playerScores = await database.get(getPlayerScores)
  response.send(playerScores)
})

module.exports = app
