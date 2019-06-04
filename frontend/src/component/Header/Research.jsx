import React from 'react'
import { translate } from 'react-i18next'

require('./Research.styl')

class Research extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      keyWordResearch: ''
    }
  }

  handleNewResearch = e => this.setState({keyWordResearch: e.target.value})

  handleClickResearch = () => {
    this.props.onClickResearch(this.state.keyWordResearch)
  }

  handleKeyDown = e => e.key === 'Enter' && this.state.keyWordResearch !== '' && this.handleClickResearch()

  render () {
    const { props, state } = this

    return (
      <div className='research primaryColorBorder'>
        <input
          className='research__text'
          data-cy={'research__text'}
          type='text'
          placeholder={props.t('Research')}
          onChange={this.handleNewResearch}
          onKeyDown={this.handleKeyDown}
        />
        <button
          className='research__btn'
          data-cy={'research__btn'}
          onClick={this.handleClickResearch}
          disabled={state.keyWordResearch === ''}
        >
          <i className='fa fa-search' />
        </button>
      </div>
    )
  }
}
export default translate()(Research)
