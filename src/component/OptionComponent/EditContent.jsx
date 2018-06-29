import React from 'react'

const EditContent = props => {
  return (
    <div className='d-flex align-items-center'>
      <button
        type='button'
        className='wsContentGeneric__option__menu__action optionicon d-none d-sm-block'
        onClick={props.onClickArchiveBtn}
      >
        <i className='fa fa-fw fa-archive' />
      </button>
      <button
        type='button'
        className='wsContentGeneric__option__menu__action optionicon d-none d-sm-block'
        onClick={props.onClickDeleteBtn}
      >
        <i className='fa fa-fw fa-trash' />
      </button>
    </div>
  )
}

export default EditContent
