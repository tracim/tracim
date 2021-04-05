import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { SelectStatus } from '../Input/SelectStatus/SelectStatus.jsx'

// require('./Delimiter.styl') // see https://github.com/tracim/tracim/issues/1156

export const Delimiter = props => <div className={classnames(props.customClass, 'delimiter primaryColorBg')} />

export default Delimiter

SelectStatus.propTypes = {
  customClass: PropTypes.string
}

SelectStatus.defaultProps = {
  customClass: ''
}
