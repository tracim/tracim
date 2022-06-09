import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Badge from '../Badge/Badge.jsx'
import { CONTENT_TYPE } from '../../helper.js'
import classnames from 'classnames'

export const FilenameWithBadges = (props) => {
  const file = props.file
  const contentType = file.type || file.content_type || file.contentType
  const isFile = contentType && ((contentType.slug || contentType) === CONTENT_TYPE.FILE)

  return (
    <div
      className={classnames('FilenameWithBadges', props.customClass)}
      title={file.label}
    >
      <span className='FilenameWithBadges__label' data-cy='FilenameWithBadges__label'>
        {file.label}
      </span>
      {(isFile && (
        <Badge text={file.fileExtension || file.file_extension} />
      ))}
      {(props.isTemplate && (
        <Badge text={props.t('Template')} />
      ))}
    </div>
  )
}

export default translate()(FilenameWithBadges)

FilenameWithBadges.propTypes = {
  file: PropTypes.object,
  isTemplate: PropTypes.bool
}

FilenameWithBadges.defaultProps = {
  file: {},
  isTemplate: false
}
