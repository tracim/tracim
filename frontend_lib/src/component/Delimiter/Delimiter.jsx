import React from 'react'
import classnames from 'classnames'

// require('./Delimiter.styl') // see https://github.com/tracim/tracim/issues/1156

export const Delimiter = props => <div className={classnames(props.customClass, 'delimiter primaryColorBg')} />

export default Delimiter
