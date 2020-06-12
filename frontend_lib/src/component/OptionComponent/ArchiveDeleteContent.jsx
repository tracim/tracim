import React from 'react'
import Radium from 'radium'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

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
      {/* INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347 */}
      {/*
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
      */}

      <button
        type='button'
        className='wsContentGeneric__option__menu__action d-none d-sm-block btn iconBtn'
        onClick={props.onClickDeleteBtn}
        disabled={props.disabled}
        title={props.t('Delete')}
        style={styleColorBtn}
        key='archiveDeleteContent__delete'
        data-cy='delete__button'
      >
        <i className='fa fa-fw fa-trash' />
      </button>
    </div>
  )
}

export default translate()(Radium(ArchiveDeleteContent))

ArchiveDeleteContent.propTypes = {
  onClickDeleteBtn: PropTypes.func,
  onClickArchiveBtn: PropTypes.func,
  disabled: PropTypes.bool,
  customColor: PropTypes.string
}

ArchiveDeleteContent.defaultProps = {
  onClickDeleteBtn: () => {},
  onClickArchiveBtn: () => {},
  disabled: false,
  customColor: ''
}
