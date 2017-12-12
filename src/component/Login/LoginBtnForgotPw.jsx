import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const LoginBtnForgotPw = props => {
  return (
    <div className={classnames(props.customClass)}>
      {props.label}
    </div>
  )
}

export default LoginBtnForgotPw

LoginBtnForgotPw.PropTypes = {
  customClass: PropTypes.string,
  label: PropTypes.string
}

LoginBtnForgotPw.defaultProps = {
  customClass: '',
  label: ''
}
