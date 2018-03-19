import React from 'react'
import classnames from 'classnames'

require('./Delimiter.styl')

export const Delimiter = props => <div className={classnames(props.customClass, 'delimiter')} />

export default Delimiter
