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
      className={classnames('FilenameWithExtension', props.customClass)}
      title={file.label}
    >
      <span className='FilenameWithExtension__label' data-cy='FilenameWithExtension__label'>
        {file.label}
      </span>
      {(isFile && (
        <Badge text={file.fileExtension || file.file_extension} customClass='badgeBackgroundColor' />
      ))}
    </div>
  )
}
