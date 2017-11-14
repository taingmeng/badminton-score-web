jest.mock('speak-tts')
jest.mock('../Annyang')

import React from 'react'
import ReactDOM from 'react-dom'
import { shallow, mount } from 'enzyme'
import { expect } from 'chai'
import annyang from '../Annyang'

import listenOff from '../svg/listen-off.svg'
import listenOn from '../svg/listen-on.svg'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

describe('Score labels', () => {
  it('inceases score when click on score', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 2 },
        { score: 1 }
      ]
    })

    app.find('.score').filterWhere(score => score.key() === '0').simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('3')

    app.find('.score').filterWhere(score => score.key() === '1').simulate('click')
    expect(app.find('.score').at(1).text()).to.eq('2')
  })

  it('inceases score when score is deuce', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 11 },
        { score: 11 }
      ]
    })

    app.find('.score').filterWhere(score => score.key() === '0').simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('12')

    app.find('.score').filterWhere(score => score.key() === '1').simulate('click')
    expect(app.find('.score').at(1).text()).to.eq('12')
  })

  it('does not incease score when a player is at winning point', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 11 },
        { score: 1 }
      ]
    })

    app.find('.score').filterWhere(score => score.key() === '0').simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('11')

    app.find('.score').filterWhere(score => score.key() === '1').simulate('click')
    expect(app.find('.score').at(1).text()).to.eq('1')
  })
})

describe('Undo score', () => {
  it('undos the score previously increased', () => {
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
    expect(app.state().serverHistory).to.eql([1])

    app.find('[title="Undo"]').simulate('click')
    expect(app.find('.score').at(1).text()).to.eq('0')
    expect(app.state().serverHistory).to.eql([])
  })

  it('does nothing when the score is 0 - 0 or there is not more history', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 0 },
        { score: 0 }
      ],
      serverHistory: []
    })

    app.find('[title="Undo"]').simulate('click')
    expect(app.find('.score').at(0).text()).to.eq('0')
    expect(app.state().serverHistory).to.eql([])

    app.find('[title="Undo"]').simulate('click')
    expect(app.find('.score').at(1).text()).to.eq('0')
    expect(app.state().serverHistory).to.eql([])
  })

  it('undo button opacity should be 0.2 when there is no history', () => {
    const app = shallow(<App />);
    app.setState({
      players: [
        { score: 0 },
        { score: 0 }
      ],
      serverHistory: []
    })

    expect(app.find('[title="Undo"]').props().style).to.have.property('opacity', 0.2)
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

describe('constructor()', () => {
  it('initials state with default state if cache does not exist', () => {
    annyang.isSupported.mockImplementation(() => { return true })
    const app = shallow(<App />);

    expect(app.state().voiceInput).to.be.empty
    expect(app.state().voiceEngine).to.eq('Supported')
    expect(app.state().voiceSupported).to.be.true
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

describe('Menu', () => {
  const VOICE_ON_TEXT = 'Disable voice recognition'
  const VOICE_OFF_TEXT = 'Enable voice recognition'

  it('Winning Point: toggles between 11 and 21', () => {
    const app = shallow(<App />)

    app.find('[title="Winning Point"]').simulate('click')
    expect(app.state().winningPoint).to.eq(21)
    expect(app.find('[title="Winning Point"]').text()).to.eq('21')

    app.find('[title="Winning Point"]').simulate('click')
    expect(app.state().winningPoint).to.eq(11)
    expect(app.find('[title="Winning Point"]').text()).to.eq('11')
  })

  it('Voice Regconition: shows the button when voice recognition is supported', () => {
    const app = shallow(<App />)
    // annyang.isSupported.mockImplementation(() => { return false })
    app.setState({
      voiceSupported: true,
      listenOn: true
    })
    expect(app.find('[title="Disable voice recognition"]')).to.have.length(1)
  })

  it('Voice Regconition: hides the button when voice recognition is not supported', () => {
    const app = shallow(<App />)
    app.setState({
      voiceSupported: false,
      listenOn: true
    })
    expect(app.find('[title="Disable voice recognition"]')).to.have.length(0)
  })

  it('Voice Regconition: toggle when voice recognition on/off', () => {
    const app = shallow(<App />)
    app.setState({
      voiceSupported: true,
      listenOn: true
    })

    app.find('[title="Disable voice recognition"]').simulate('click')
    expect(app.find('[title="Enable voice recognition"]').props().src).to.eq(listenOff)

    app.find('[title="Enable voice recognition"]').simulate('click')
    expect(app.find('[title="Disable voice recognition"]').props().src).to.eq(listenOn)
  })
})

fdescribe('getNewScorerIndex', () => {
  it('returns player one index when player one is leading', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 3 }, { score: 1 }]
    })

    expect(app.instance().getNewScorerIndex([4, 1])).to.eq(0)
  })

  it('returns player one index when player one is trailing', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 1 }, { score: 3 }]
    })

    expect(app.instance().getNewScorerIndex([2, 3])).to.eq(0)
  })

  it('returns player two index when player two is trailing', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 3 }, { score: 1 }]
    })

    expect(app.instance().getNewScorerIndex([2, 3])).to.eq(1)
  })

  it('returns player two index when player two is leading', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 2 }, { score: 3 }]
    })

    expect(app.instance().getNewScorerIndex([4, 2])).to.eq(1)
  })

  it('returns invalid index', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 3 }, { score: 2 }]
    })

    expect(app.instance().getNewScorerIndex([2, 2])).to.eq(-1)
    expect(app.instance().getNewScorerIndex([1, 2])).to.eq(-1)
    expect(app.instance().getNewScorerIndex([4, 3])).to.eq(-1)
    expect(app.instance().getNewScorerIndex([3, 4])).to.eq(-1)
  })

  it('returns player one index when scores are equal', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 3 }, { score: 3 }]
    })

    expect(app.instance().getNewScorerIndex([4, 3])).to.eq(0)
  })

  it('returns player two index when scores are equal', () => {
    const app = shallow(<App />)
    app.setState({
      players: [{ score: 3 }, { score: 3 }]
    })

    expect(app.instance().getNewScorerIndex([3, 4])).to.eq(1)
  })
})
