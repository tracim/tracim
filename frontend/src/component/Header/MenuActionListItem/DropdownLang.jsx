import React from 'react'
import PropTypes from 'prop-types'

require('./DropdownLang.styl')

const DropdownLang = props => {
  const activeLang = props.langList.find(l => l.id === props.langActiveId)
  return (
    <li className='dropdownlang'>
      <div className='dropdownlang__dropdown dropdown'>
        <button
          type='button'
          className='dropdownlang__dropdown__btnlanguage btn outlineTextBtn nohover primaryColorBorder dropdown-toggle'
          id='headerDropdownMenuButton'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'
        >
          <img className='dropdownlang__dropdown__btnlanguage__imgselected' src={activeLang.icon} />
          {activeLang.label}
        </button>

        <div className='dropdownlang__dropdown__subdropdown dropdown-menu' aria-labelledby='headerDropdownMenuButton'>
          {props.langList.filter(l => l.id !== props.langActiveId).map(l =>
            <div
              className='dropdownlang__dropdown__subdropdown__link primaryColorBgLightenHover dropdown-item'
              onClick={() => props.onChangeLang(l.id)}
              key={l.id}
            >
              <img className='dropdownlang__dropdown__subdropdown__link__flag' src={l.icon} />
              {l.label}
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
  langActiveId: PropTypes.string.isRequired,
  onChangeLang: PropTypes.func.isRequired
}
