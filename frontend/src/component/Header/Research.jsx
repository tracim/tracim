import React from 'react'
import { translate } from 'react-i18next'

require('./Research.styl')

class Research extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      stringResearch: ''
    }
  }

  handleNewResearch = e => this.setState({stringResearch: e.target.value})

  handleClickResearch = () => {
    this.props.onClickResearch(this.state.stringResearch)
    document.getElementsByClassName('research__text')[0].value = ''
  }

  handleKeyDown = e => e.key === 'Enter' && this.handleClickResearch()

  render () {
    const { props } = this

    return (
      <div className='research primaryColorBorder'>
        <input
          className='research__text'
          type='text'
          placeholder={props.t('Research')}
          onChange={this.handleNewResearch}
          onKeyDown={this.handleKeyDown}
        />
        <button
          className='research__btn'
          onClick={this.handleClickResearch}
        >
          <i className='fa fa-search' />
        </button>
      </div>
    )
  }
}
export default translate()(Research)
