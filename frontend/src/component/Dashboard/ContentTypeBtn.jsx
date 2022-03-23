import React from 'react'
import PropTypes from 'prop-types'
import Radium from 'radium'
import { IconButton } from 'tracim_frontend_lib'

require('./ContentTypeBtn.styl')

export const ContentTypeBtn = props =>
  <IconButton
    text={props.creationLabel}
    icon={props.faIcon}
    title={props.creationLabel}
    type='button'
    iconColor={props.hexcolor}
    onClick={props.onClickBtn}
    intent='secondary'
    mode='dark'
    dataCy={props.dataCy}
  />
export default Radium(ContentTypeBtn)

ContentTypeBtn.propTypes = {
  hexcolor: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  faIcon: PropTypes.string.isRequired,
  creationLabel: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  onClickBtn: PropTypes.func,
  appSlug: PropTypes.string,
  dataCy: PropTypes.string
}

ContentTypeBtn.defaultProps = {
  customClass: '',
  dataCy: ''
}
