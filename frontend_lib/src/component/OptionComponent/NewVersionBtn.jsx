import React from 'react'
import Radium from 'radium'
import { translate } from 'react-i18next'

const NewVersionBtn = props => {
  return (
    <button
      className='wsContentGeneric__option__menu__addversion newversionbtn btn outlineTextBtn'
      onClick={props.onClickNewVersionBtn}
      disabled={props.disabled}
      style={{
        backgroundColor: '#fdfdfd',
        color: '#333',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: props.customColor,
        ':hover': {
          backgroundColor: props.customColor,
          color: '#fdfdfd'
        }
      }}
    >
      {props.t('Edit')}
      <i className='fa fa-plus-circle ml-3' />
    </button>
  )
}

export default translate()(Radium(NewVersionBtn))
