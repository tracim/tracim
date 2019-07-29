import React from 'react'
import Radium from 'radium'
import { withTranslation } from 'react-i18next'

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
        title={props.t('Archive')}
        style={styleColorBtn}
        key={'archiveDeleteContent__archive'}
        data-cy='archive__button'
      >
        <i className='fa fa-fw fa-archive' />
      </button>
      <button
        type='button'
        className='wsContentGeneric__option__menu__action d-none d-sm-block btn iconBtn'
        onClick={props.onClickDeleteBtn}
        disabled={props.disabled}
        title={props.t('Delete')}
        style={styleColorBtn}
        key={'archiveDeleteContent__delete'}
        data-cy='delete__button'
      >
        <i className='fa fa-fw fa-trash' />
      </button>
    </div>
  )
}

export default withTranslation()(Radium(ArchiveDeleteContent))
