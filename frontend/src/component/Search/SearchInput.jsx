import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./SearchInput.styl')

export class SearchInput extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      searchedKeywords: ''
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.searchedKeywords !== this.props.searchedKeywords) {
      this.setState({ searchedKeywords: this.props.searchedKeywords })
    }
  }

  handleNewSearch = e => this.setState({ searchedKeywords: e.target.value })

  handleClickSearch = () => {
    this.props.onClickSearch(this.state.searchedKeywords)
  }

  handleKeyDown = e => e.key === 'Enter' && this.state.searchedKeywords !== '' && this.handleClickSearch()

  render () {
    const { props } = this

    return (
      <div className='search primaryColorBorder'>
        <input
          className='search__text'
          data-cy='search__text'
          type='text'
          placeholder={props.t('Search')}
          onChange={this.handleNewSearch}
          onKeyDown={this.handleKeyDown}
          value={this.state.searchedKeywords}
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
export default translate()(SearchInput)

SearchInput.propTypes = {
  searchedKeywords: PropTypes.string
}

SearchInput.defaultProps = {
  searchedKeywords: ''
}
