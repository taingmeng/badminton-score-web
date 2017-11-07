import React, { Component } from 'react'
import annyang from 'annyang'
import Speech from 'speak-tts'

import { getNumber } from './ScoreHelper'
import undo from './svg/undo-button.svg'
import help from './svg/help-button.svg'
import reset from './svg/reset-button.svg'
import change from './svg/change-button.svg'
import plus from './svg/plus-button.svg'
import minus from './svg/minus-button.svg'
import listenOn from './svg/listen-on.svg'
import listenOff from './svg/listen-off.svg'
import speakOn from './svg/speak-on.svg'
import speakOff from './svg/speak-off.svg'
import './App.css'

const intialState = {
  voiceError: '',
  voiceInput: '',
  voiceEngine: '',
  speakOn: true,
  listenOn: true,
  gameMode: 'single',
  leftFirst: true,
  lastScorers: [],
  players: [
    {
      name: "Player 1",
      score: 0,
    },
    {
      name: "Player 2",
      score: 0,
    }
  ],
}

class App extends Component {
  constructor(params) {
    super(params)
    this.state = intialState
  }

  componentDidMount() {
    Speech.init()
    if (annyang) {
      annyang.addCommands({
        'player one *scores': (scores) => this.increaseSpecificPlayerScore(0),
        'player two *scores': (scores) => this.increaseSpecificPlayerScore(1),
        'reset': () => this.reset(),
        'change': () => this.changeSide(),
        'undo': () => this.undo()
      })

      annyang.addCallback('start', event => this.engine('on'))
      annyang.addCallback('soundstart', event => this.engine('listening'))
      annyang.addCallback('end', event => this.engine('off'))
      annyang.addCallback('error', event => this.errorCallback(event))
      annyang.addCallback('errorNetwork', event => this.errorCallback(event))
      annyang.addCallback('errorPermissionBlocked', event => this.errorCallback(event))
      annyang.addCallback('errorPermissionDenied', event => this.errorCallback(event))
      annyang.addCallback('result', event => this.resultCallback(event))
      if (this.state.listenOn) {
        annyang.start({ autoRestart: true, continuous: false })
      }
    }
  }

  componentWillUnmount() {
    annyang.removeCallback('start')
    annyang.removeCallback('soundstart')
    annyang.removeCallback('end')
    annyang.removeCallback('error')
    annyang.removeCallback('errorNetwork')
    annyang.removeCallback('errorPermissionBlocked')
    annyang.removeCallback('errorPermissionDenied')
    annyang.removeCallback('result')
    annyang.abort()
  }

  toggleListen() {
    if (this.state.listenOn) {
      annyang.abort()
    } else {
      annyang.start({ autoRestart: true, continuous: false })
    }
    this.setState({ listenOn: !this.state.listenOn })
  }

  engine = (event) => {
    this.setState({
      voiceEngine: event
    })
  }

  errorCallback = (event) => {
    this.setState({
      voiceError: event.error,
      voiceInput: ''
    })
  }

  resultCallback = (event) => {
    this.setState({
      voiceError: '',
      voiceInput: 'Result: ' + event
    })
    event.some((phrase, index) => {
      const scores = phrase.trim().toLowerCase().split(/[\s,:0]/)
      if (scores && scores.length === 2) {
        const score0 = getNumber(scores[0])
        const score1 = getNumber(scores[1])
        if (score0 !== -1 && score1 === -2) {
          this.updatePlayerScore([score0, score0])
          return true
        } else if (score0 !== -1 && score1 !== -1) {
          this.updatePlayerScore([score0, score1])
          return true
        }
      }
      return false
    })
  }

  onScoreIncrease(index) {
    this.updateScore(index, 1)
  }

  onScoreDecrease(index) {
    this.updateScore(index, -1)
  }

  updateScore(playerIndex, scoreOffset) {
    let players = this.state.players.slice()
    if (players[playerIndex].score === 0 && scoreOffset < 0) {
      return
    }

    players[playerIndex].score += scoreOffset
    this.setState({
      players: players
    })

    if (scoreOffset > 0) {
      this.setState({
        lastScorers: [...this.state.lastScorers, playerIndex]
      }, () => this.announceServingSide())

    } else {
      this.setState({
        lastScorers: this.state.lastScorers.slice(0, -1)
      })
    }
  }

  increaseSpecificPlayerScore(playerIndex) {
    this.onScoreDecrease(playerIndex)
  }

  undo() {
    const lastScorers = this.state.lastScorers
    if (lastScorers.length > 0) {
      const lastScorer = lastScorers[lastScorers.length - 1]
      this.onScoreDecrease(lastScorer)
    }
  }

  updatePlayerScore(scores) {
    const currentScores = this.state.players.map(player => player.score)
    if (scores[0] - currentScores[0] === 1 && scores[1] === currentScores[1]) {
      this.onScoreIncrease(0)
    } else if (scores[1] - currentScores[1] === 1 && scores[0] === currentScores[0]) {
      this.onScoreIncrease(1)
    } else if (scores[0] - currentScores[1] === 1 && scores[1] === currentScores[0]) {
      this.onScoreIncrease(1)
    } else if (scores[1] - currentScores[0] === 1 && scores[0] === currentScores[1]) {
      this.onScoreIncrease(0)
    } else {
      this.setState({
        voiceError: 'Invalid score update'
      })
      this.speak('Invalid score update')
    }
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

  announceServingSide() {
    if (this.state.speakOn) {
      const index = this.getLastScorerIndex()
      const serveSide = this.state.players[index].score % 2 === 0 ? 'right' : 'left'
      Speech.speak({
        text: `${this.state.players[index].name} serves on the ${serveSide}}`
      })
    }
  }

  getLastScorerIndex() {
    if (this.state.lastScorers.length === 0) {
      return 0
    }
    return this.state.lastScorers[this.state.lastScorers.length - 1]
  }

  hasEvenScore(playerIndex) {
    return this.state.players[playerIndex].score % 2 === 0
  }

  render() {
    const playerNames = this.state.players.map(player => player.name)
    const leftPositions = this.hasEvenScore(this.getLastScorerIndex()) ? [] : playerNames
    const rightPositions = leftPositions.length === 0 ? playerNames : []

    const scores = this.state.players.map((player, index) => (
      <div className="score-container" key={index}>
        <img src={plus} className="score-control" onClick={() => this.onScoreIncrease(index)} alt=""/>
        <div className="score">{player.score}</div>
        <img src={minus} className="score-control" onClick={() => this.onScoreDecrease(index)} alt=""/>
      </div>
    ))

    return (
      <div className="app">
        <div className="menu">
          <div className="menu-title">Badminton Score Keeper</div>
          <div className="button-container">
            <img className="button" alt="" src={this.state.listenOn ? listenOn : listenOff} onClick={() => this.toggleListen()} />
            <img className="button" alt="" src={this.state.speakOn ? speakOn : speakOff} onClick={() => this.setState({ speakOn: !this.state.speakOn })} />
            <img className="button" alt="" src={undo} onClick={() => this.undo()} />
            <img className="button" alt="" src={change} onClick={() => this.changeSide()} />
            <img className="button" alt="" src={reset} onClick={() => this.reset()} />
            <img className="button" alt="" src={help} onClick={() => this.help()} />
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="box">{leftPositions[0]}</div>
              <div className="box">{rightPositions[0]}</div>
            </div>
            <div className="row">
              {scores}
            </div>
            <div className="col">
              <div className="box">{rightPositions[1]}</div>
              <div className="box">{leftPositions[1]}</div>
            </div>
          </div>
          <div className="info-container">
            <div>
              <span>Voice Engine Status: </span><span style={{ fontWeight: 'bold' }}>{this.state.voiceEngine.toUpperCase()}</span>
            </div>
            <div>
              {this.state.voiceInput}
            </div>
            <div>
              {this.state.voiceError}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App
