import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const ResetPasswordBtn = props => {
  return (
    <div
      className={classnames(props.customClass)}
      onClick={props.onClickForgotPasswordBtn}
    >
      {props.label}
    </div>
  )
}

export default ResetPasswordBtn

ResetPasswordBtn.propTypes = {
  customClass: PropTypes.string,
  label: PropTypes.string
}

ResetPasswordBtn.defaultProps = {
  customClass: '',
  label: ''
}
