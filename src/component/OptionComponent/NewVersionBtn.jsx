import React from 'react'

const NewVersionBtn = props => {
  return (
    <div
      className='wsContentGeneric__option__menu__addversion newversionbtn btn btn-outline-primary mr-auto'
      onClick={props.onClickNewVersionBtn}
    >
      Nouvelle version
      <i className='fa fa-plus-circle ml-3' />
    </div>
  )
}

export default NewVersionBtn
