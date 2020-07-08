import React from 'react'
import PropTypes from 'prop-types'

require('./DropdownLang.styl')

const DropdownLang = props => {
  // INFO - GB - 2020-06-08 - If the user doesn't have a language set yet (first connection of a new user), we set English as the default language
  const activeLang = props.langList.find(l => l.id === props.langActiveId) || 'en'
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
              className='dropdownlang__dropdown__subdropdown__link primaryColorBgActive dropdown-item'
              data-cy={l.id}
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
