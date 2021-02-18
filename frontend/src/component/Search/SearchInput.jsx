import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./SearchInput.styl')

export class SearchInput extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      searchString: ''
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.searchString !== this.props.searchString) {
      this.setState({ searchString: this.props.searchString })
    }
  }

  handleNewSearch = e => this.setState({ searchString: e.target.value })

  handleClickSearch = () => {
    this.props.onClickSearch(this.state.searchString)
  }

  handleKeyDown = e => e.key === 'Enter' && this.state.searchString !== '' && this.handleClickSearch()

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
          value={this.state.searchString}
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
  searchString: PropTypes.string
}

SearchInput.defaultProps = {
  searchString: ''
}
