import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

// INFO - CH - 2019-04-17 - Component deprecated because unused

const Search = props => {
  return (
    <li className='header__menu__rightside__itemsearch'>
      <div className='header__menu__rightside__itemsearch__search input-group'>
        <input
          type='text'
          className='search__input form-control'
          placeholder={`${props.t('Search…')}`}
          aria-describedby='headerInputSearch'
          onChange={props.onChangeInput}
        />
        <button
          className='search__addonsearch input-group-addon primaryColorBgLightenHover primaryColorFontHover'
          id='headerInputSearch'
          onClick={props.onClickSubmit}
        >
          <i className='fas fa-search' />
        </button>
      </div>
    </li>
  )
}
export default translate()(Search)

Search.propTypes = {
  onChangeInput: PropTypes.func.isRequired,
  onClickSubmit: PropTypes.func.isRequired
}
