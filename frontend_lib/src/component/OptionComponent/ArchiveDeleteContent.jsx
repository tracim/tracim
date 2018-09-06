import React from 'react'
import Radium from 'radium'

const ArchiveDeleteContent = props => {
  const styleColorBtn = {
    backgroundColor: '#fdfdfd',
    color: '#333',
    ':hover': {
      color: props.customColor
    }
  }

  return (
    <div className='d-flex align-items-center'>
      <button
        type='button'
        className='wsContentGeneric__option__menu__action d-none d-sm-block btn iconBtn'
        onClick={props.onClickArchiveBtn}
        disabled={props.disabled}
        title='Archiver'
        style={styleColorBtn}
        key={'archiveDeleteContent__archive'}
      >
        <i className='fa fa-fw fa-archive' />
      </button>
      <button
        type='button'
        className='wsContentGeneric__option__menu__action d-none d-sm-block btn iconBtn'
        onClick={props.onClickDeleteBtn}
        disabled={props.disabled}
        title='Supprimer'
        style={styleColorBtn}
        key={'archiveDeleteContent__delete'}
      >
        <i className='fa fa-fw fa-trash' />
      </button>
    </div>
  )
}

export default Radium(ArchiveDeleteContent)
