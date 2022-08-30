import React, { useEffect, useState } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { isMobile } from 'react-device-detect'

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
      if (isMobile) props.onClickToggleSidebar(e)
    }
  }

  return (
    <div className='search'>
      <input
        className='search__text'
        data-cy='search__text'
        type='text'
        placeholder={props.t('Search')}
        onChange={handleNewSearch}
        onKeyDown={handleKeyDown}
        value={searchString}
        // INFO - G.B. - 2022-08-30 - The stop propagation below allows to type on sidebar without toogle on mobile
        onClick={(e) => e.stopPropagation()}
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
  onClickToggleSidebar: PropTypes.func,
  searchString: PropTypes.string
}

SearchInput.defaultProps = {
  onClickSearch: () => { },
  onClickToggleSidebar: () => { },
  searchString: ''
}
