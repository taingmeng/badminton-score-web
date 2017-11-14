import annyang from 'annyang'

class Annyang {
  abort() {
    if (annyang) {
      annyang.abort()
    }
  }

  resume() {
    if (annyang) {
      annyang.resume()
    }
  }

  addCommands(reset, change, undo) {
    if (annyang) {
      annyang.addCommands({
        'reset': () => reset(),
        'change': () => change(),
        'undo': () => undo()
      })
    }
  }

  addCallback(engineCallback, resultCallback) {
    if (annyang) {
      annyang.addCallback('start', event => engineCallback('on'))
      annyang.addCallback('soundstart', event => engineCallback('listening'))
      annyang.addCallback('end', event => engineCallback('off'))
      annyang.addCallback('error', event => engineCallback(event.error))
      annyang.addCallback('errorNetwork', event => engineCallback('network error'))
      annyang.addCallback('errorPermissionBlocked', event => engineCallback('permission blocked'))
      annyang.addCallback('errorPermissionDenied', event => engineCallback('permission denied'))
      annyang.addCallback('result', event => resultCallback(event))
    }
  }

  removeCallbacks() {
    if (annyang) {
      annyang.removeCallback('start')
      annyang.removeCallback('soundstart')
      annyang.removeCallback('end')
      annyang.removeCallback('error')
      annyang.removeCallback('errorNetwork')
      annyang.removeCallback('errorPermissionBlocked')
      annyang.removeCallback('errorPermissionDenied')
      annyang.removeCallback('result')
    }
  }

  start() {
    if (annyang) {
      annyang.start({ autoRestart: true, continuous: false })
    }
  }

  isSupported() {
    return annyang !== null
  }
}

export default new Annyang()
