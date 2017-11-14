const annyang = jest.mock('annyang')

annyang.init = jest.fn()
annyang.addCommands = jest.fn()
annyang.addCallback = jest.fn()
annyang.abort = jest.fn()
annyang.resume = jest.fn()
annyang.isSupported = jest.fn()

export default annyang
