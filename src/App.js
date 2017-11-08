import React, { Component } from 'react'
import annyang from 'annyang'
import Speech from 'speak-tts'

import EditPlayerModal from './EditPlayerModal'
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
  speakOn: true,
  listenOn: true,
  gameMode: 'single',
  leftFirst: true,
  lastScorers: [],
  players: [
    {
      name: 'Player 1',
      score: 0,
      commands: ['Player One', 'Victor']
    },
    {
      name: 'Player 2',
      score: 0,
      commands: ['Player Two', 'Champion']
    }
  ],
  isOpenEditPlayer: false,
  activePlayerIndex: -1
}

class App extends Component {
  constructor(params) {
    super(params)
    this.state = intialState
    this.speakCount = 0
  }

  componentDidMount() {
    Speech.init({
      lang: 'en-GB'
    })
    if (annyang) {
      this.setState({
        voiceSupported: true
      })
      annyang.addCommands({
        'reset': () => this.reset(),
        'change': () => this.changeSide(),
        'undo': () => this.undo()
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
    this.updateScore(playerIndex, 1)
  }

  decreaseScore(playerIndex) {
    this.updateScore(playerIndex, -1)
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

  handleScoresFromVoiceRecognition(scores) {
    const newScorerIndex = this.getNewScorerIndex()
    if (newScorerIndex === -1) {
      this.setState({
        voiceEngine: 'Invalid score update'
      })
      this.speak('Invalid score update for ' + scores)
    } else {
      this.increaseScore(newScorerIndex)
    }
  }

  undo() {
    const lastScorers = this.state.lastScorers
    if (lastScorers.length > 0) {
      const lastScorer = lastScorers[lastScorers.length - 1]
      this.decreaseScore(lastScorer)
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
    const index = this.getLastScorerIndex()
    const serveSide = this.state.players[index].score % 2 === 0 ? 'right' : 'left'
    this.speak(`${this.getScoresOrderByLastScorer()}, ${this.state.players[index].name} serves on the ${serveSide}}`)
  }

  speak(message) {
    if (this.state.speakOn) {
      if (annyang && this.state.listenOn) {
        console.log('speak', new Date())
        console.log('speak', 'abort')
        annyang.abort()
      }
      this.speakCount += 1
      Speech.speak({
        text: message,
        onError: () => {
          this.speakCount -= 1
        },
        onEnd: () => {
          this.speakCount -= 1
          if (annyang && this.state.listenOn && this.speakCount === 0) {
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
    if (this.state.lastScorers.length === 0) {
      return 0
    }
    return this.state.lastScorers[this.state.lastScorers.length - 1]
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
    })
    this.closeEditPlayerModal()
  }

  render() {
    const playerNames = this.state.players.map(player => player.name)
    const leftPositions = this.hasEvenScore(this.getLastScorerIndex()) ? [] : playerNames
    const rightPositions = leftPositions.length === 0 ? playerNames : []

    const scores = this.state.players.map((player, index) => (
      <div className="score-container" key={index}>
        <img src={plus} className="score-control" onClick={() => this.increaseScore(index)} alt="" />
        <div className="score">{player.score}</div>
        <img src={minus} className="score-control" onClick={() => this.decreaseScore(index)} alt="" />
      </div>
    ))

    const listenButton = this.state.voiceSupported ?
      <img
        className="button"
        alt=""
        src={this.state.listenOn ? listenOn : listenOff}
        onClick={() => this.toggleListen()} /> : null

    return (
      <div className="app">
        {this.state.activePlayerIndex !== -1 ?
          <EditPlayerModal
            onCancel={() => this.closeEditPlayerModal()}
            onConfirm={(updatedPlayer) => this.updatePlayer(updatedPlayer)}
            isOpen={this.state.isOpenEditPlayer}
            index={this.state.activePlayerIndex}
            player={this.state.players[this.state.activePlayerIndex]} /> : null}
        <div className="menu">
          <div className="menu-title">Badminton Score Keeper</div>
          <div className="button-container">
            {listenButton}
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
              <div className="box" onClick={() => { if (leftPositions[0]) this.openEditPlayerModal(0) }}>{leftPositions[0]}</div>
              <div className="box" onClick={() => { if (rightPositions[0]) this.openEditPlayerModal(0) }}>{rightPositions[0]}</div>
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
