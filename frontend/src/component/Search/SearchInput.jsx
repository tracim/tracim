import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./SearchInput.styl')

export class SearchInput extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      searchedString: ''
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.searchedString !== this.props.searchedString) {
      this.setState({ searchedString: this.props.searchedString })
    }
  }

  handleNewSearch = e => this.setState({ searchedString: e.target.value })

  handleClickSearch = () => {
    this.props.onClickSearch(this.state.searchedString)
  }

  handleKeyDown = e => e.key === 'Enter' && this.state.searchedString !== '' && this.handleClickSearch()

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
          value={this.state.searchedString}
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
  searchedString: PropTypes.string
}

SearchInput.defaultProps = {
  searchedString: ''
}
