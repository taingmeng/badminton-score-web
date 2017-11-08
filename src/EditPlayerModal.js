import React from 'react'
import Modal from 'react-modal'

import plus from './svg/plus-button.svg'
import minus from './svg/minus-button.svg'
import './EditPlayerModal.css'

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
    top: '25%',
    left: '25%',
    right: '25%',
    bottom: '25%',
    border: '1px solid #ccc',
    background: '#fff',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '5px',
    outline: 'none',
    padding: '20px'
  }
}

class EditPlayerModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: props.player.name,
      commands: props.player.commands,
      newCommand: ''
    }
  }

  addCommand() {
    this.setState({
      commands: [...this.state.commands, this.state.newCommand],
      newCommand: ''
    })
  }

  render() {
    return (
      <Modal
        style={customStyles}
        onRequestClose={this.closeModal}
        isOpen={this.props.isOpen}>
        <div className="edit-player-modal">
          <div>Player Name</div>
          <input value={this.state.name} style={{ marginBottom: '10px' }}
            onChange={e => this.setState({ name: e.target.value })} />
          <div>New Command</div>
          <div style={{
            display: 'flex',
            marginBottom: '10px',
            alignItems: 'center'
          }}>
            <input value={this.state.newCommand} style={{ flex: 1 }}
              onChange={e => this.setState({ newCommand: e.target.value })} />
            <img src={plus} className="command-button" style={{ marginLeft: '10px' }} onClick={() => this.addCommand()} />
          </div>
          <div>Commands</div>
          <div className="commands-container">
            {this.state.commands.map((command, index) =>
              <div key={index} className="command">
                <div>{command}</div>
                <img src={minus} className="command-button" onClick={() => this.setState({
                  commands: this.state.commands.filter((_, row) => row != index)
                })} />
              </div>
            )}
          </div>
          <div className="edit-player-modal-button-container">
            <button className="edit-player-modal-button" onClick={() => this.props.onCancel()}>Cancel</button>
            <button className="edit-player-modal-button" onClick={() => this.props.onConfirm({
              name: this.state.name,
              commands: this.state.commands
            })}>Confirm</button>
          </div>
        </div>
      </Modal>
    )
  }
}

export default EditPlayerModal
