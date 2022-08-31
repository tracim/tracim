import React, { useEffect, useState } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { isMobile } from 'react-device-detect'
import { LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE } from '../../container/Sidebar.jsx'

require('./SearchInput.styl')

export const SearchInput = (props) => {
  const [searchString, setSearchString] = useState('')

  useEffect(() => {
    setSearchString(props.searchString)
  }, [props.searchString])

  const handleNewSearch = e => setSearchString(e.target.value)

  const handleClickSearch = () => props.onClickSearch(searchString)

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      handleClickSearch()
    }
  }

  return (
    <div className='search'>
      <input
        className={`search__text ${LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE}`}
        data-cy='search__text'
        type='text'
        placeholder={props.t('Search')}
        onChange={handleNewSearch}
        onKeyDown={handleKeyDown}
        value={searchString}
      />
      <button
        className='search__btn'
        data-cy='search__btn'
        onClick={handleClickSearch}
        title={props.t('Search')}
        data-toggle={isMobile ? 'collapse' : ''}
        data-target='#navbarSupportedContent'
      >
        <i className='fas fa-search' />
      </button>
    </div>
  )
}
export default translate()(SearchInput)

SearchInput.propTypes = {
  onClickSearch: PropTypes.func,
  searchString: PropTypes.string
}

SearchInput.defaultProps = {
  onClickSearch: () => { },
  searchString: ''
}
