import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

const HeaderTpl = props => {
  return (
    <div>
      { props.user.isLoggedIn
        ? `'Soir ${props.user.firstname} ${props.user.lastname}.`
        : 'Why dont you connect yourself ?'
      }
      <ul>
        <li><Link to={'/'}>Home</Link></li>
        <li><Link to={'/login'}>Login</Link></li>
        <li><Link to={'/page'}>Page</Link></li>
      </ul>
      <button onClick={e => props.onChangeLang('fr')}>Click Me</button>
    </div>
  )
}
export default HeaderTpl

HeaderTpl.PropTypes = {
  user: PropTypes.shape({
    isLoggedIn: PropTypes.bool.isRequired
  }),
  onChangeLang: PropTypes.func,
  onSubmitSearch: PropTypes.func
}
