import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Badge from '../Badge/Badge.jsx'
import { CONTENT_TYPE } from '../../constant.js'
import classnames from 'classnames'

export const FilenameWithBadges = (props) => {
  const content = props.content
  const contentType = content.type || content.content_type || content.contentType
  const isFile = contentType && ((contentType.slug || contentType) === CONTENT_TYPE.FILE)

  return (
    <div
      className={classnames('FilenameWithBadges', props.customClass)}
      title={content.label}
    >
      <span className='FilenameWithBadges__label' data-cy='FilenameWithBadges__label'>
        {content.label}
      </span>
      {(isFile && (
        <Badge text={content.fileExtension || content.file_extension} />
      ))}
      {(props.isTemplate && (
        <Badge text={props.t('Template')} />
      ))}
    </div>
  )
}

export default translate()(FilenameWithBadges)

FilenameWithBadges.propTypes = {
  content: PropTypes.object,
  isTemplate: PropTypes.bool
}

FilenameWithBadges.defaultProps = {
  content: {},
  isTemplate: false
}
