import React from 'react'
import PropTypes from 'prop-types'
import { DropdownMenu } from 'tracim_frontend_lib'

require('./DropdownLang.styl')

const DropdownLang = props => {
  const activeLang = props.langList.find(lang => lang.id === props.langActiveId)
  return (
    <li className='dropdownlang'>
      <DropdownMenu
        buttonImage={activeLang.icon}
        buttonLabel={activeLang.label}
        buttonCustomClass='dropdownlang__dropdown__btnlanguage outlineTextBtn'
        menuCustomClass='dropdownlang__dropdown__subdropdown'
        isButton
      >
        {props.langList.filter(lang => lang.id !== props.langActiveId).map(lang =>
          <button
            className='transparentButton'
            data-cy={lang.id}
            onClick={() => props.onChangeLang(lang.id)}
            key={lang.id}
            childrenKey={lang.id}
          >
            <img className='dropdownlang__dropdown__subdropdown__link__flag' src={lang.icon} />
            {lang.label}
          </button>
        )}
      </DropdownMenu>
    </li>
  )
}
export default DropdownLang

DropdownLang.propTypes = {
  langList: PropTypes.array.isRequired,
  langActiveId: PropTypes.string.isRequired,
  onChangeLang: PropTypes.func.isRequired
}
