import React from 'react'
import { translate } from 'react-i18next'

require('./Search.styl')

export class Search extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      searchedKeywords: ''
    }
  }

  handleNewSearch = e => this.setState({ searchedKeywords: e.target.value })

  handleClickSearch = () => {
    this.props.onClickSearch(this.state.searchedKeywords)
  }

  handleKeyDown = e => e.key === 'Enter' && this.state.searchedKeywords !== '' && this.handleClickSearch()

  render () {
    const { props, state } = this

    return (
      <div className='search primaryColorBorder'>
        <input
          className='search__text'
          data-cy='search__text'
          type='text'
          placeholder={props.t('Search')}
          onChange={this.handleNewSearch}
          onKeyDown={this.handleKeyDown}
        />
        <button
          className='search__btn'
          data-cy='search__btn'
          onClick={this.handleClickSearch}
          title={props.t('Search')}
        >
          <i className='fas fa-search' />
        </button>
      </div>
    )
  }
}
export default translate()(Search)
