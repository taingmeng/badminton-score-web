import React, { Component } from 'react'
import annyang from 'annyang'

import { getNumber } from './ScoreHelper'
import plus from './svg/plus-button.svg'
import minus from './svg/minus-button.svg'
import './App.css'

const COMMAND_RESET = 'reset'
const COMMAND_CHANGE_SIDE = 'change'

const intialState = {
  voiceError: '',
  voiceInput: '',
  gameMode: 'single',
  leftFirst: true,
  lastScorer: 0,
  players: [
    {
      name: "Player 1",
      score: 0
    },
    {
      name: "Player 2",
      score: 0
    }
  ]
}

class App extends Component {
  constructor(params) {
    super(params)
    this.state = intialState
  }

  componentDidMount() {
    if (annyang) {
      annyang.addCommands({
        COMMAND_RESET: () => this.reset(),
        COMMAND_CHANGE_SIDE: () => this.changeSide()
      })
      annyang.addCallback('error', event => this.errorCallback(event))
      annyang.addCallback('errorNetwork', event => this.errorCallback(event))
      annyang.addCallback('errorPermissionBlocked', event => this.errorCallback(event))
      annyang.addCallback('errorPermissionDenied', event => this.errorCallback(event))

      annyang.addCallback('result', event => this.resultCallback(event))
      annyang.addCallback('resultMatch', (userSaid, commandText, phrases) => this.resultMatchCallback(userSaid, commandText, phrases))

      annyang.start({ autoRestart: true, continuous: true });
    }
  }

  componentDidUnmount() {
    annyang.removeCallback('error')
    annyang.removeCallback('errorNetwork')
    annyang.removeCallback('errorPermissionBlocked')
    annyang.removeCallback('errorPermissionDenied')
    annyang.removeCallback('result')
    annyang.removeCallback('resultMatch')
    annyang.abort()
  }

  errorCallback = (event) => {
    this.setState({
      voiceError: 'Error ' + event.error
    })
  }

  resultCallback = (event) => {
    this.setState({
      voiceInput: 'Result ' + event
    })
  }

  resultMatchCallback = (userSaid, commandText, phrases) => {
    this.setState({
      voiceInput: userSaid
    })
    if (phrases && phrases.length == 2) {
      phrases.forEach((phrase, index) => {
        const score = getNumber(phrase)
        if (score != -1) {
          this.updatePlayerScore(index, score)
        }
      })
    }
  }

  onScoreIncrease(index) {
    let players = this.state.players.slice()
    players[index].score += 1
    this.setState({
      players: players,
      lastScorer: index
    })
  }

  onScoreDecrease(index) {
    let players = this.state.players.slice()
    players[index].score -= 1
    this.setState({
      players: players
    })
  }

  updatePlayerScore(index, score) {
    let players = this.state.players.slice()
    players[index].score = score
    this.setState({
      players: players,
      lastScorer: index
    })
  }

  reset() {
    let players = this.state.players.slice()
    players.forEach(player => player.score = 0)
    this.setState({
      players: players,
      lastScorer: 0
    })
  }

  changeSide() {
    this.setState({
      leftFirst: !this.state.leftFirst,
      players: this.state.players.reverse()
    })
  }

  render() {
    let oddScorePosition0
    let evenScorePosition0
    let oddScorePosition1
    let evenScorePosition1
    if (this.state.lastScorer == 0) {
      if (this.state.players[0].score % 2 == 0) {
        evenScorePosition0 = this.state.players[0].name
        evenScorePosition1 = this.state.players[1].name
      } else {
        oddScorePosition0 = this.state.players[0].name
        oddScorePosition1 = this.state.players[1].name
      }
    } else {
      if (this.state.players[1].score % 2 == 0) {
        evenScorePosition0 = this.state.players[0].name
        evenScorePosition1 = this.state.players[1].name
      } else {
        oddScorePosition0 = this.state.players[0].name
        oddScorePosition1 = this.state.players[1].name
      }
    }

    const scores = this.state.players.map((player, index) => (
      <div className="score-container">
        <img src={plus} className="score-control" onClick={() => this.onScoreIncrease(index)} />
        <div className="score">{player.score}</div>
        <img src={minus} className="score-control" onClick={() => this.onScoreDecrease(index)} />
      </div>
    ))

    return (
      <div className="App">
        <div className="row">
          <div className="button" onClick={() => this.reset()}>Reset</div>
          <div className="button" onClick={() => this.changeSide()}>Change Side</div>
        </div>
        <div className="row">
          <div className="col">
            <div className="box">{oddScorePosition0}</div>
            <div className="box">{evenScorePosition0}</div>
          </div>
          <div className="row">
            {scores}
          </div>
          <div className="col">
            <div className="box">{evenScorePosition1}</div>
            <div className="box">{oddScorePosition1}</div>
          </div>
        </div>
        <div>
          {this.state.voiceError}
        </div>
        <div>
          {this.state.voiceInput}
        </div>

      </div>
    )
  }
}

export default App
