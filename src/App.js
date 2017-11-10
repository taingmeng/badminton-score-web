import React, { Component } from 'react'
import annyang from 'annyang'
import Speech from 'speak-tts'

import EditPlayerModal from './EditPlayerModal'
import HelpModal from './HelpModal'
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
  voiceInput: [],
  voiceEngine: '',
  voiceSupported: false,
  listenOn: false,
  speakOn: false,
  speakSupported: false,
  serverHistory: [],
  players: [
    {
      name: 'Player 1',
      score: 0,
      commands: ['Player One']
    },
    {
      name: 'Player 2',
      score: 0,
      commands: ['Player Two']
    }
  ],
  isOpenHelp: false,
  isOpenEditPlayer: false,
  activePlayerIndex: -1,
  winningPoint: 11,
}

class App extends Component {
  constructor(params) {
    super(params)
    this.state = {
      ...intialState,
      ...this.getDataFromLocalStorage()
    }
    this.speakCount = 0
    this.speakCountQueue = []
  }

  saveDataToLocalStorage() {
    localStorage.setItem('badminton-score-keeper', JSON.stringify(this.state))
  }

  getDataFromLocalStorage() {
    const fromLocalStorage = localStorage.getItem('badminton-score-keeper')
    if (fromLocalStorage) {
      return JSON.parse(fromLocalStorage)
    }
    return null
  }

  componentDidMount() {
    Speech.init({
      lang: 'en-GB'
    })
    if (annyang) {
      this.setState({
        voiceSupported: true,
        listenOn: true
      })
      annyang.addCommands({
        'reset': () => this.reset(),
        'change': () => this.changeSide(),
        'undo': () => this.undoScore()
      })

      annyang.addCallback('start', event => this.engine('on'))
      annyang.addCallback('soundstart', event => this.engine('listening'))
      annyang.addCallback('end', event => this.engine('off'))
      annyang.addCallback('error', event => this.engine(event.error))
      annyang.addCallback('errorNetwork', event => this.engine('network error'))
      annyang.addCallback('errorPermissionBlocked', event => this.engine('permission blocked'))
      annyang.addCallback('errorPermissionDenied', event => this.engine('permission denied'))
      annyang.addCallback('result', event => this.resultCallback(event))
      if (this.state.listenOn) {
        annyang.start({ autoRestart: true, continuous: false })
      }
    } else {
      this.setState({
        voiceSupported: false,
        voiceEngine: 'Unsupported'
      })
    }

    this.setState({
      speakSupported: Speech.browserSupport()
    })
  }

  componentWillUnmount() {
    if (annyang) {
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
  }

  toggleListen() {
    if (annyang) {
      if (this.state.listenOn) {
        annyang.abort()
      } else {
        annyang.resume()
      }
      this.setState({ listenOn: !this.state.listenOn })
    }
  }

  engine = (event) => {
    this.setState({
      voiceEngine: event
    })
  }

  errorCallback = (event) => {
    this.setState({
      voiceInput: []
    })
  }

  resultCallback = (event) => {
    this.setState({
      voiceInput: event
    })
    event.some((phrase, index) => {
      this.state.players.some((player, index) => {
        if (player.commands.map(command => command.toLocaleLowerCase()).includes(phrase.toLowerCase())) {
          this.increaseScore(index)
          return true
        }
        return false
      })
      const scores = phrase.trim().toLowerCase().split(/[\s,:0]/)
      if (scores && scores.length === 2) {
        const score0 = getNumber(scores[0])
        const score1 = getNumber(scores[1])
        if (score0 !== -1 && score1 === -2) {
          this.handleScoresFromVoiceRecognition([score0, score0])
          return true
        } else if (score0 !== -1 && score1 !== -1) {
          this.handleScoresFromVoiceRecognition([score0, score1])
          return true
        }
      }
      return false
    })
  }

  increaseScore(playerIndex) {
    if (this.getWinnerIndex() !== -1) {
      return
    }
    let players = this.state.players.slice()
    players[playerIndex].score += 1
    this.setState({
      players: players,
      serverHistory: [...this.state.serverHistory, playerIndex]
    }, () => {
      this.saveDataToLocalStorage()
      this.announceServingSide()
    })
  }

  undoScore() {
    const serverHistory = this.state.serverHistory
    if (serverHistory.length > 0) {
      const lastServerIndex = serverHistory[serverHistory.length - 1]
      const players = this.state.players.slice()
      players[lastServerIndex].score -= 1
      this.setState({
        players: players,
        serverHistory: serverHistory.slice(0, -1)
      })
    }
  }

  handleScoresFromVoiceRecognition(scores) {
    const newScorerIndex = this.getNewScorerIndex(scores)
    if (newScorerIndex === -1) {
      this.setState({
        voiceEngine: 'Invalid score update'
      })
      this.speak('Invalid score update for ' + scores)
    } else {
      this.increaseScore(newScorerIndex)
    }
  }

  reset() {
    let players = this.state.players.slice()
    players.forEach(player => player.score = 0)
    this.setState({
      players: players,
      serverHistory: []
    }, () => this.saveDataToLocalStorage())
  }

  changeSide() {
    this.setState({
      players: this.state.players.reverse()
    }, () => this.saveDataToLocalStorage())
  }

  announceServingSide() {
    const annoucements = []

    const winnerIndex = this.getWinnerIndex()
    if (winnerIndex !== -1) {
      //Announce winner
      annoucements.push(`Good game! Winner is ${this.state.players[winnerIndex].name}`)
    } else {
      //Announce deuce
      if (this.isDeuce()) {
        annoucements.push('Deuce')
      }

      //Announce scores
      annoucements.push(this.getScoresOrderByLastScorer())

      //Announce serving side
      const index = this.getLastScorerIndex()
      const serveSide = this.state.players[index].score % 2 === 0 ? 'right' : 'left'
      annoucements.push(`${this.state.players[index].name} serves on the ${serveSide}`)
    }

    this.speak(annoucements.join(', '))
  }

  isDeuce() {
    const gamePoint = this.state.winningPoint - 1
    return this.state.players[0].score === this.state.players[1].score && this.state.players[0].score >= gamePoint
  }

  getWinnerIndex() {
    const gamePoint = this.state.winningPoint - 1
    const scores = this.state.players.map(player => player.score)
    const isDeucing = scores.every(score => score >= gamePoint)
    if (isDeucing) {
      const sum = scores.reduce((sum, score) => sum + score, 0)
      return this.state.players.findIndex(player => player.score - 1 >= sum / 2)
    } else {
      return this.state.players.findIndex(player => player.score > gamePoint)
    }
  }

  speak(message) {
    if (this.state.speakOn) {
      if (annyang && this.state.listenOn) {
        annyang.abort()
      }
      this.speakCount += 1
      this.speakCountQueue.push(this.speakCount)
      Speech.speak({
        text: message,
        onEnd: () => {
          this.speakCount -= 1
          this.speakCountQueue.pop()
          if (annyang && this.state.listenOn) {
            annyang.resume()
          }
        }
      })
    }
  }

  getNewScorerIndex(newScores) {
    const currentScores = this.state.players.map(player => player.score)
    let newScorerIndex = newScores.findIndex((newScore, index) => newScore - currentScores[index] == 1)
    if (newScorerIndex === -1) {
      newScorerIndex = newScores.reverse().findIndex((newScore, index) => newScore - currentScores[index] == 1)
    }
    return newScorerIndex
  }

  getLastScorerIndex() {
    const serverHistory = this.state.serverHistory
    if (serverHistory.length === 0) {
      return 0
    }
    return serverHistory[serverHistory.length - 1]
  }

  getScoresOrderByLastScorer() {
    const scores = this.state.players.map(player => player.score)
    return this.getLastScorerIndex() === 0 ? scores : scores.reverse()
  }

  hasEvenScore(playerIndex) {
    return this.state.players[playerIndex].score % 2 === 0
  }

  openEditPlayerModal(playerIndex) {
    this.setState({
      isOpenEditPlayer: true,
      activePlayerIndex: playerIndex
    })
  }

  closeEditPlayerModal() {
    this.setState({
      isOpenEditPlayer: false,
      activePlayerIndex: -1
    })
  }

  updatePlayer(updatedPlayer) {
    const players = this.state.players.slice()
    players[this.state.activePlayerIndex].name = updatedPlayer.name
    players[this.state.activePlayerIndex].commands = updatedPlayer.commands
    this.setState({
      players: players,
    }, () => this.saveDataToLocalStorage())
    this.closeEditPlayerModal()
  }

  help() {
    this.setState({
      isOpenHelp: true
    })
  }

  toggleWinningPoint() {
    this.setState({
      winningPoint: this.state.winningPoint === 11 ? 21 : 11
    })
  }

  render() {
    const playerNames = this.state.players.map(player => player.name)
    const leftPositions = this.hasEvenScore(this.getLastScorerIndex()) ? [] : playerNames
    const rightPositions = leftPositions.length === 0 ? playerNames : []

    const scores = this.state.players.map((player, index) => (
      <div className="score-container" key={index}>
        <img src={plus} className="score-control" onClick={() => this.increaseScore(index)} alt="" style={{ opacity: `${this.getWinnerIndex() !== -1 ? 0.2 : 1}` }} />
        <div className="score">{player.score}</div>
        <img src={minus} className="score-control" onClick={() => this.undoScore(index)} alt="" style={{ opacity: `${this.state.players[index].score === 0 ? 0.2 : 1}` }} />
      </div>
    ))

    const listenButton = this.state.voiceSupported ?
      <img
        className="button"
        alt=""
        src={this.state.listenOn ? listenOn : listenOff}
        onClick={() => this.toggleListen()} /> : null

    const speakButton = this.state.speakSupported ?
      <img
        className="button"
        alt=""
        src={this.state.speakOn ? speakOn : speakOff}
        onClick={() => this.setState({ speakOn: !this.state.speakOn })} /> : null

    return (
      <div className="app">
        {this.state.isOpenEditPlayer ?
          <EditPlayerModal
            onCancel={() => this.closeEditPlayerModal()}
            onConfirm={(updatedPlayer) => this.updatePlayer(updatedPlayer)}
            isOpen={this.state.isOpenEditPlayer}
            player={this.state.players[this.state.activePlayerIndex]} /> : null}

        {this.state.isOpenHelp ?
          <HelpModal
            onCancel={() => this.setState({ isOpenHelp: false })}
            isOpen={this.state.isOpenHelp} /> : null}

        <div className="menu">
          <div className="menu-title">Badminton Score Keeper</div>
          <div className="button-container">
            <div className="button point-mode" onClick={() => this.toggleWinningPoint()} >{this.state.winningPoint}</div>
            {listenButton}
            {speakButton}
            <img className="button" alt="" title="Undo" src={undo} onClick={() => this.undoScore()} />
            <img className="button" alt="" src={change} onClick={() => this.changeSide()} />
            <img className="button" alt="" src={reset} onClick={() => this.reset()} />
            <img className="button" alt="" src={help} onClick={() => this.help()} />
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col">
              <div id="leftBox" className="box" onClick={() => { if (leftPositions[0]) this.openEditPlayerModal(0) }}>{leftPositions[0]}</div>
              <div id="rightBox" className="box" onClick={() => { if (rightPositions[0]) this.openEditPlayerModal(0) }}>{rightPositions[0]}</div>
            </div>
            <div className="row">
              {scores}
            </div>
            <div className="col">
              <div className="box" onClick={() => { if (rightPositions[1]) this.openEditPlayerModal(1) }}>{rightPositions[1]}</div>
              <div className="box" onClick={() => { if (leftPositions[1]) this.openEditPlayerModal(1) }}>{leftPositions[1]}</div>
            </div>
          </div>
          <div className="info-container">
            <div>
              <span>Voice Engine Status: </span><span style={{ fontWeight: 'bold' }}>{this.state.voiceEngine.toUpperCase()}</span>
            </div>
            {this.state.voiceInput.length > 0 ?
              <div className="info-voice-input">
                Voice input:
                {this.state.voiceInput.map((input, index) => <li key={index}>{input}</li>)}
              </div> : null
            }

          </div>
        </div>
      </div>
    )
  }
}

export default App
