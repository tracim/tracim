import React from 'react'
import PropTypes from 'prop-types'

export const ConnectionForm = props => {
  return (
    <div>
      { props.user.isLoggedIn
        ? 'You are already logged in.'
        : (
          <div>
            Login:
            <input type='text' onChange={props.onChangeLogin} placeholder='Login' />
            <input type='text' onChange={props.onChangePassword} placeholder='Password' />
            <button type='button' onClick={props.onClickSubmit}>Connect</button>
          </div>
        )
      }
    </div>
  )
}

ConnectionForm.PropTypes = {
  user: PropTypes.shape({
    isLoggedIn: PropTypes.bool.isRequired
  }),
  onChangeLogin: PropTypes.func,
  onChangePassword: PropTypes.func,
  onClickSubmit: PropTypes.func
}
