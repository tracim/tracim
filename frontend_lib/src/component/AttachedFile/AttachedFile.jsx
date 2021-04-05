import Icon from '../Icon/Icon.jsx'
import React from 'react'
import PropTypes from 'prop-types'
// require('./AttachedFile.styl') // see https://github.com/tracim/tracim/issues/1156

export default function AttachedFile (props) {
  return (
    <span className='attachedFile'>
      <Icon icon='fas fa-fw fa-paperclip' title='' />
      {` ${props.fileName}`}
    </span>
  )
}

AttachedFile.propTypes = {
  fileName: PropTypes.string.isRequired
}
