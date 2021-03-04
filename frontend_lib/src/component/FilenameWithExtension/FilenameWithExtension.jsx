import React from 'react'
import Badge from '../Badge/Badge.jsx'
import { CONTENT_TYPE } from '../../helper.js'
import classnames from 'classnames'

export default function FilenameWithExtension (props) {
  const file = props.file
  const contentType = file.type || file.content_type || file.contentType
  const isFile = contentType && ((contentType.slug || contentType) === CONTENT_TYPE.FILE)

  return (
    <div
      className='FilenameWithExtension'
      title={file.label}
    >
      <span className={classnames('FilenameWithExtension__label', props.customClass)}>{file.label}</span>
      {(isFile && (
        <Badge text={file.fileExtension || file.file_extension} customClass='badgeBackgroundColor' />
      ))}
    </div>
  )
}
