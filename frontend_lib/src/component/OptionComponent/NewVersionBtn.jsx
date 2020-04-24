import React from 'react'
import GenericButton from '../Button/GenericButton'
import PropTypes from 'prop-types'

const NewVersionBtn = props => {
  return (
    <GenericButton
      customClass='wsContentGeneric__option__menu__addversion newVersionBtn btn outlineTextBtn'
      dataCy='wsContentGeneric__option__menu__addversion'
      onClick={props.onClickNewVersionBtn}
      disabled={props.disabled}
      style={props.style}
      faIcon={props.icon}
      label={props.label}
      customColor={props.customColor}
    />
  )
}

export default NewVersionBtn

NewVersionBtn.propTypes = {
  icon: PropTypes.string.isRequired,
  onClickNewVersionBtn: PropTypes.func,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  label: PropTypes.string,
  customColor: PropTypes.string
}

NewVersionBtn.defaultProps = {
  onClickNewVersionBtn: () => {},
  disabled: false,
  customColor: '',
  label: '',
  style: {}
}
