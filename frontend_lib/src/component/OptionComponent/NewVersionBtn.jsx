import React from 'react'
import GenericButton from '../Button/GenericButton'
import PropTypes from 'prop-types'

const NewVersionBtn = props => {
  return (
    <GenericButton
      customClass='wsContentGeneric__option__menu__addversion newversionbtn btn outlineTextBtn'
      dataCy='wsContentGeneric__option__menu__addversion'
      onClick={props.onClickNewVersionBtn}
      disabled={props.disabled}
      style={props.style}
      faIcon={'plus-circle'}
      label={props.label}
      customColor={props.customColor}
    />
  )
}

export default NewVersionBtn

GenericButton.propTypes = {
  onClickNewVersionBtn: PropTypes.func,
  disabled: PropTypes.bool,
  style: PropTypes.string,
  label: PropTypes.string,
  customColor: PropTypes.string
}

GenericButton.defaultProps = {
  onClickNewVersionBtn: () => {},
  disabled: false,
  customColor: '',
  label: '',
  style: {}
}
