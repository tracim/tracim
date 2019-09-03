import React from 'react'
import Radium from 'radium'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

const DeleteContent = props => {
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
        onClick={props.onClickDeleteBtn}
        disabled={props.disabled}
        title={props.t('Delete')}
        style={styleColorBtn}
        key={'deleteContent__delete'}
        data-cy='delete__button'
      >
        <i className='fa fa-fw fa-trash' />
      </button>
    </div>
  )
}

export default translate()(Radium(DeleteContent))

DeleteContent.propTypes = {
  onClickDeleteBtn: PropTypes.func,
  disabled: PropTypes.bool,
  customColor: PropTypes.string
}

DeleteContent.defaultProps = {
  onClickDeleteBtn: () => {},
  disabled: false,
  customColor: ''
}
