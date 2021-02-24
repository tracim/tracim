import React from 'react'
import PropTypes from 'prop-types'
import Radium from 'radium'

const GenericButton = props => {
  return (
    <button
      className={props.customClass}
      data-cy={props.dataCy}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title || props.label}
      style={{
        backgroundColor: '#fdfdfd',
        color: '#333',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: props.customColor,
        ':hover': {
          backgroundColor: props.customColor,
          color: '#fdfdfd'
        },
        ...props.style
      }}
    >
      {props.faIcon !== '' && (
        <i className={`${props.faIcon} genericButton__icon`} />
      )}
      <span className='genericButton__label'>
        {props.label}
      </span>
    </button>
  )
}

export default Radium(GenericButton)

GenericButton.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  customClass: PropTypes.string,
  title: PropTypes.string,
  label: PropTypes.string,
  faIcon: PropTypes.string,
  dataCy: PropTypes.string,
  style: PropTypes.object,
  customColor: PropTypes.string
}

GenericButton.defaultProps = {
  onClick: () => {},
  disabled: false,
  customClass: '',
  label: '',
  title: '',
  dataCy: '',
  faIcon: '',
  style: {},
  customColor: ''
}
