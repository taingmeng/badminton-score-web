import React from 'react'
import ReactDOM from 'react-dom'
import { shallow, mount } from 'enzyme'
import { expect } from 'chai'
jest.mock('speak-tts')
import Speech from 'speak-tts'

import App from './App'

beforeEach(() => {
  localStorage.clear()
})

describe('Plus buttons', () => {
  const LEFT_PLUS_BUTTON = 0
  const LEFT_MINUS_BUTTON = 1
  const RIGHT_PLUS_BUTTON = 2
  const RIGHT_MINUS_BUTTON = 3

  it('incease score when click on plus button for player 1', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 2 },
        { score: 1 }
      ]
    })

    app.find('.score-control').at(LEFT_PLUS_BUTTON).simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('3')
  })

  it('does not incease score when player 1 is at winning point', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 11 },
        { score: 1 }
      ]
    })

    app.find('.score-control').at(LEFT_PLUS_BUTTON).simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('11')
  })
})

describe('Player name positions on the court', () => {
  const LEFT_ODD_POSITION = 0
  const LEFT_EVEN_POSITION = 1
  const RIGHT_EVEN_POSITION = 2
  const RIGHT_ODD_POSITION = 3

  it('opens edit player dialog when click on box with name', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { name: 'Alice', score: 2, commands: [] },
        { name: 'Bob', score: 1, commands: [] }
      ],
      lastScorers: [0, 1, 0]
    })
    app.find('.box').at(LEFT_EVEN_POSITION).simulate('click')
    expect(app.find('EditPlayerModal')).to.have.length(1)
    expect(app.find('EditPlayerModal').prop('isOpen')).to.be.true
  })

  it('does not open edit player dialog when click on box without name', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { name: 'Alice', score: 2, commands: [] },
        { name: 'Bob', score: 1, commands: [] }
      ],
      lastScorers: [0, 1, 0]
    })
    app.find('.box').at(LEFT_ODD_POSITION).simulate('click')
    expect(app.find('EditPlayerModal')).to.have.length(0)
  })

  it('when server is player 1 and server score is even, displays names on the even positions', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { name: 'Alice', score: 2, commands: [] },
        { name: 'Bob', score: 1, commands: [] }
      ]
    })
    expect(app.find('.box').at(LEFT_EVEN_POSITION).text()).to.eq('Alice')
    expect(app.find('.box').at(RIGHT_EVEN_POSITION).text()).to.eq('Bob')
    expect(app.find('.box').at(LEFT_ODD_POSITION).text()).to.be.empty
    expect(app.find('.box').at(RIGHT_ODD_POSITION).text()).to.be.empty
  })

  it('when server is player 2 and server score is even, displays names on the even positions', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { name: 'Alice', score: 1, commands: [] },
        { name: 'Bob', score: 2, commands: [] }
      ],
      serverHistory: [1]
    })
    expect(app.find('.box').at(LEFT_EVEN_POSITION).text()).to.eq('Alice')
    expect(app.find('.box').at(RIGHT_EVEN_POSITION).text()).to.eq('Bob')
    expect(app.find('.box').at(LEFT_ODD_POSITION).text()).to.be.empty
    expect(app.find('.box').at(RIGHT_ODD_POSITION).text()).to.be.empty
  })

  it('when server is player 1 and server score is odd, displays names on the odd positions', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { name: 'Alice', score: 1, commands: [] },
        { name: 'Bob', score: 2, commands: [] }
      ]
    })
    expect(app.find('.box').at(LEFT_ODD_POSITION).text()).to.eq('Alice')
    expect(app.find('.box').at(RIGHT_ODD_POSITION).text()).to.eq('Bob')
    expect(app.find('.box').at(LEFT_EVEN_POSITION).text()).to.be.empty
    expect(app.find('.box').at(RIGHT_EVEN_POSITION).text()).to.be.empty
  })

  it('when server is player 2 and server score is odd, displays names on the odd positions', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { name: 'Alice', score: 2, commands: [] },
        { name: 'Bob', score: 1, commands: [] }
      ],
      serverHistory: [1]
    })
    expect(app.find('.box').at(LEFT_ODD_POSITION).text()).to.eq('Alice')
    expect(app.find('.box').at(RIGHT_ODD_POSITION).text()).to.eq('Bob')
    expect(app.find('.box').at(LEFT_EVEN_POSITION).text()).to.be.empty
    expect(app.find('.box').at(RIGHT_EVEN_POSITION).text()).to.be.empty
  })
})

describe('Undo score', () => {
  it('undoes the score previously increased', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 1 },
        { score: 1 }
      ],
      serverHistory: [1, 0]
    })

    app.find('[title="Undo"]').simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('0')

    app.find('[title="Undo"]').simulate('click')
    expect(app.find('.score').at(1).text()).to.eq('0')
  })
})

describe('constructor()', () => {
  it('initials state with default state if cache does not exist', () => {
    const app = shallow(<App />);
    expect(app.state().voiceInput).to.be.empty
    expect(app.state().voiceEngine).to.eq('Unsupported')
    expect(app.state().voiceSupported).to.be.false
    expect(app.state().listenOn).to.be.false
    expect(app.state().speakOn).to.be.false
    expect(app.state().serverHistory).to.be.empty
    expect(app.state().winningPoint).to.eq(11)
  })

  it('intializes state with local storage if cache exists', () => {
    const cache = {
      players: [
        {
          name: 'Test Player 1',
          score: 3,
          commands: ['Test Command 1']
        },
        {
          name: 'Test Player 2',
          score: 1,
          commands: ['Test Command 2']
        }
      ],
      serverHistory: [1, 0, 0, 0]
    }
    localStorage.setItem('badminton-score-keeper', JSON.stringify(cache))

    const app = shallow(<App />);
    expect(app.state().players).to.eql(cache.players)
    expect(app.state().serverHistory).to.eql(cache.serverHistory)
  })
})
