import React from 'react'
import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'

export const Tab = props => {
  return (
    <Link
      className={classnames(
        'tab',
        { 'tab__active primaryColorBorder': props.location.pathname.includes(props.page) }
      )}
      title={props.label}
      to={props.page}
    >
      <i className={`${props.icon}`} />
      <span className='tab__label'>{props.label}</span>
    </Link>
  )
}

export default withRouter(Tab)

Tab.propTypes = {
  label: PropTypes.string.isRequired,
  page: PropTypes.string.isRequired,
  icon: PropTypes.string
}

Tab.defaultProps = {
  icon: ''
}
