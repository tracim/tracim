import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Link } from 'react-router-dom'

import { darkenColor } from '../../helper.js'

require('./LinkHtmlButton.styl')

const LinkHtmlButton = props => {
  const style = {
    '--primaryColor': props.color,
    '--primaryDarkColor': darkenColor(props.color)
  }

  return (
    <Link
      to={props.href}
      className={classnames('LinkHtmlButton', props.customClass)}
      style={style}
      title={props.text}
    >
      {props.icon && (
        <i className={`fa-fw ${props.icon} LinkHtmlButton__icon`} />
      )}

      <span className='LinkHtmlButton__label'>
        {props.text}
      </span>
    </Link>
  )
}

LinkHtmlButton.propTypes = {
  href: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  color: PropTypes.string,
  target: PropTypes.string,
  icon: PropTypes.string
}

LinkHtmlButton.defaultProps = {
  customClass: '',
  color: GLOBAL_primaryColor,
  target: '_blank',
  icon: null
}

export default LinkHtmlButton
