import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import classnames from 'classnames'

export const Tab = props => {
  return (
    <Link
      className={classnames(
        'tab',
        { 'tab__active primaryColorBorder': props.active }
      )}
      title={props.label}
      to={props.page}
    >
      <i className={`fa fa-fw fa-${props.icon}`} />
      <span className='tab__label'>{props.label}</span>
    </Link>
  )
}

export default Tab

Tab.propTypes = {
  label: PropTypes.string.isRequired,
  page: PropTypes.string.isRequired,
  active: PropTypes.bool,
  icon: PropTypes.string
}

Tab.defaultProps = {
  active: false,
  icon: ''
}
