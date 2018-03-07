import React from 'react'
import PropTypes from 'prop-types'

const DropdownLang = props => {
  const activeLang = props.langList.find(l => l.active) || {id: 'fr', name: 'Français', src: '', active: true}
  return (
    <li className='header__menu__rightside__itemlanguage'>
      <div className='header__menu__rightside__itemlanguage__languagedropdown dropdown'>
        <button
          type='button'
          className='languagedropdown__btnlanguage btnnavbar btn btn-secondary dropdown-toggle'
          id='headerDropdownMenuButton'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'
        >
          <img className='languagedropdown__btnlanguage__imgselected' src={activeLang.src} alt={activeLang.name} />
        </button>
        <div className='languagedropdown__subdropdown dropdown-menu' aria-labelledby='headerDropdownMenuButton'>
          { props.langList.map((l, i) => l.active === false &&
            <div className='subdropdown__link dropdown-item' onClick={() => props.onChangeLang(l.id)} key={i}>
              <img className='subdropdown__flag' src={l.src} alt={l.name} />
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
  onChangeLang: PropTypes.func.isRequired
}
