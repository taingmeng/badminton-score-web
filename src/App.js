import React, { Component } from 'react'
import Speech from 'speak-tts'

import EditPlayerModal from './EditPlayerModal'
import HelpModal from './HelpModal'
import { getNumber } from './ScoreUtil'
import undo from './svg/undo-button.svg'
import help from './svg/help-button.svg'
import reset from './svg/reset-button.svg'
import change from './svg/change-button.svg'
import listenOn from './svg/listen-on.svg'
import listenOff from './svg/listen-off.svg'
import speakOn from './svg/speak-on.svg'
import speakOff from './svg/speak-off.svg'
import annyang from './Annyang'
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
      onVoicesLoaded: (data) => { console.log('voices', data.voices) },
      lang: 'en-AU'
    })

    annyang.addCommands(this.reset, this.change, this.undo)
    annyang.addCallback(this.engineCallback, this.resultCallback)
    if (this.state.listenOn) {
      annyang.start()
    }

    this.setState({
      voiceSupported: annyang.isSupported(),
      voiceEngine: annyang.isSupported() ? 'Supported' : 'Unsupported',
      speakSupported: Speech.browserSupport()
    })
  }

  componentWillUnmount() {
    annyang.abort()
  }

  toggleListen() {
    if (this.state.voiceSupported) {
      if (this.state.listenOn) {
        annyang.abort()
      } else {
        annyang.resume()
      }
      this.setState({ listenOn: !this.state.listenOn })
    }
  }

  engineCallback = (status) => {
    this.setState({
      voiceEngine: status
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
      const scores = phrase.trim().split(/[\s,:0]/)
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

  undo = () => {
    const serverHistory = this.state.serverHistory
    if (serverHistory.length == 0) {
      return
    }
    const lastServerIndex = serverHistory[serverHistory.length - 1]
    const players = this.state.players.slice()
    players[lastServerIndex].score -= 1
    this.setState({
      players: players,
      serverHistory: serverHistory.slice(0, -1)
    }, () => {
      this.saveDataToLocalStorage()
      this.announceServingSide()
    })
  }

  reset = () => {
    let players = this.state.players.slice()
    players.forEach(player => player.score = 0)
    this.setState({
      players: players,
      serverHistory: []
    }, () => this.saveDataToLocalStorage())
  }

  change = () => {
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
    // const sumCurrentScores = currentScores.reduce((sum, score) => sum + score)
    // const sumNewScores = currentScores.reduce((sum, score) => sum + score)
    if (currentScores[0] === currentScores[1]) {
      if (newScores[0] - currentScores[0] === 1 && newScores[1] === currentScores[1]) {
        return 0
      } else if (newScores[1] - currentScores[1] === 1 && newScores[0] === currentScores[0]) {
        return 1
      } else {
        return -1
      }
    } else {
      if ((newScores[0] - currentScores[0] === 1 && newScores[1] === currentScores[1]) ||
        (newScores[1] - currentScores[0] === 1 && newScores[0] === currentScores[1])) {
        return 0
      } else if ((newScores[1] - currentScores[1] === 1 && newScores[0] === currentScores[0]) ||
        (newScores[0] - currentScores[1] === 1 && newScores[1] === currentScores[0])) {
        return 1
      } else {
        return -1
      }
    }
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
    if (annyang) {
      annyang.abort()
    }
    this.setState({
      isOpenEditPlayer: true,
      activePlayerIndex: playerIndex
    })
  }

  closeEditPlayerModal() {
    if (annyang) {
      annyang.resume()
    }
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

  help = () => {
    this.setState({
      isOpenHelp: true
    })
  }

  toggleWinningPoint = () => {
    this.setState({
      winningPoint: this.state.winningPoint === 11 ? 21 : 11
    })
  }

  render() {
    const playerNames = this.state.players.map(player => player.name)
    const leftPositions = this.hasEvenScore(this.getLastScorerIndex()) ? [] : playerNames
    const rightPositions = leftPositions.length === 0 ? playerNames : []

    const scores = this.state.players.map((player, index) => (
      <div
        key={index}
        className="score"
        onClick={() => this.increaseScore(index)}>{player.score}</div>
    ))

    const listenButton = this.state.voiceSupported ?
      <img
        className="button"
        alt=""
        title={this.state.listenOn ? 'Disable voice recognition' : 'Enable voice recognition'}
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
            <div className="button point-mode" title="Winning Point" onClick={this.toggleWinningPoint} >{this.state.winningPoint}</div>
            {listenButton}
            {speakButton}
            <img className="button" alt="" title="Undo" src={undo} onClick={this.undo} style={{ opacity: this.state.serverHistory.length === 0 ? 0.2 : 1 }} />
            <img className="button" alt="" title="Change" src={change} onClick={this.change} />
            <img className="button" alt="" title="Reset" src={reset} onClick={this.reset} />
            <img className="button" alt="" title="Help" src={help} onClick={this.help} />
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
