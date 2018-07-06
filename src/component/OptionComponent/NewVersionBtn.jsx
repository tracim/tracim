import React from 'react'

const NewVersionBtn = props => {
  return (
    <button
      className='wsContentGeneric__option__menu__addversion newversionbtn btn btn-outline-primary'
      onClick={props.onClickNewVersionBtn}
      disabled={props.disabled}
    >
      Modifier
      <i className='fa fa-plus-circle ml-3' />
    </button>
  )
}

export default NewVersionBtn
