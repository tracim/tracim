import React from 'react'
import PropTypes from 'prop-types'
import { DropdownMenu } from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'

const DropdownLang = props => {
  const activeLang = props.langList.find(lang => lang.id === props.langActiveId)
  return (
    <li className='dropdownlang'>
      <DropdownMenu
        buttonIcon='fas fa-globe'
        buttonLabel={activeLang.label}
        buttonDataCy={`${activeLang.id}-active`}
        buttonCustomClass='dropdownlang__dropdown__btnlanguage outlineTextBtn nohover'
        menuCustomClass='dropdownlang__dropdown__subdropdown'
        isButton
      >
        {props.langList.filter(lang => lang.id !== props.langActiveId).map(lang =>
          <button
            className='transparentButton'
            data-cy={lang.id}
            onClick={() => props.onChangeLang(lang.id)}
            key={lang.id}
            data-toggle={isMobile ? 'collapse' : ''}
            data-target='#navbarSupportedContent'
          >
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
