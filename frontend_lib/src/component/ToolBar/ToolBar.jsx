import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./ToolBar.styl')

const ToolBar = (props) => {
  return (
    <div data-cy={props.dataCy} className={classnames('toolBar', props.customClass)}>
      {props.children}
    </div>
  )
}

ToolBar.propTypes = {
  dataCy: PropTypes.string,
  customClass: PropTypes.string
}

ToolBar.defaultProps = {
  dataCy: null,
  customClass: null
}

export default ToolBar
