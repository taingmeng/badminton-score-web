import React from 'react'
import Modal from 'react-modal'
import ReactMarkdown from 'react-markdown'

import './HelpModal.css'

const customStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  content: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
    border: '1px solid #ccc',
    background: '#fff',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '5px',
    outline: 'none',
    padding: '20px'
  }
}

const input = `
# Badminton Score Keeper
---
## Note
Voice recogition only works for **Chrome Desktop** browser.

## Available voice commands
- **Reset** : reset scores to 0
- **Change** : change player side
- **Undo** : undo scores. This can be applied multiple times until 0 - 0

You can also announce the scores, for example **[3, 2]**. In badminton, the score of the player who gets the current point will be announced first, regardless whether the score is leading or trailing behind the other player. For example, given the current socre of player A and player is [4, 2] respectively, when player B scores the next point, it should be announced as [3, 4].

Score update must follow one rule: *only one point increment on either side*. If your score announcement does not follow this rule, the score will not be updated, and an error message will be displayed and announced.

However, when the scores of both players are the same, the order of scores matter. For example, when current scores are [5, 5], announcing [5, 6] means player two scores, while announcing [6, 5] means player one scores.

You can also say one of the **commands** of a player to update the score. By default, if you announce **Player One**, the score of player one will be increased by 1. If you announce **Player Two**, the score of player two will be increased by 1. You can also add your own commands by clicking on the player name. A dialog will be popped up, and you can edit your name and favorite commands. Commands between 2 to 6 words are optimal for voice recognition. Say one of those awesome commands whenever you score, for example:

- *In your face*
- *Ole ole ole ole*
- *You can't see me*
`

class HelpModal extends React.Component {
  render() {
    return (
      <Modal
        style={customStyles}
        isOpen={this.props.isOpen}>
        <div className="help-modal">
          <div className="help-content">
            <ReactMarkdown source={input} />
          </div>
          <div className="help-modal-button-container">
            <button className="help-modal-button" onClick={() => this.props.onCancel()}>Close</button>
          </div>
        </div>
      </Modal>
    )
  }
}

export default HelpModal
