import React from 'react'
import Radium from 'radium'

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
      Modifier
      <i className='fa fa-plus-circle ml-3' />
    </button>
  )
}

export default Radium(NewVersionBtn)
