import React from 'react'
import PropTypes from 'prop-types'

const DropdownLang = props => {
  return (
    <li className='header__menu__rightside__itemlanguage'>
      <div className='header__menu__rightside__itemlanguage__languagedropdown dropdown'>
        <button
          type='button'
          className='languagedropdown__btnlanguage btnnavbar btn btn-outline-primary dropdown-toggle'
          id='headerDropdownMenuButton'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'
        >
          <img className='languagedropdown__btnlanguage__imgselected' src={props.langList.find(l => l.id === props.idLangActive).icon} />
        </button>
        <div className='languagedropdown__subdropdown dropdown-menu' aria-labelledby='headerDropdownMenuButton'>
          { props.langList.filter(l => l.id !== props.idLangActive).map((l, i) =>
            <div className='subdropdown__link dropdown-item' onClick={() => props.onChangeLang(l.id)} key={i}>
              <img className='subdropdown__flag' src={l.icon} />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
export default DropdownLang

DropdownLang.propTypes = {
  langList: PropTypes.array.isRequired,
  idLangActive: PropTypes.string.isRequired,
  onChangeLang: PropTypes.func.isRequired
}
