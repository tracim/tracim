import React from 'react'
import PropTypes from 'prop-types'
import PopinFixed from '../common/PopinFixed/PopinFixed'
import PopinFixedHeader from '../common/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from '../common/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from '../common/PopinFixed/PopinFixedContent.jsx'
import PageHtml from './FileType/PageHtml.jsx'
import Thread from './FileType/Thread.jsx'
import Timeline from '../Timeline.jsx'
import { FILE_TYPE } from '../../helper.js'

const FileContentViewer = props => {
  const { customClass, icon } = FILE_TYPE.find(f => f.name === props.file.type) || {customClass: '', icon: ''}

  const [leftPart, rightPart] = (() => {
    switch (props.file.type) {
      case FILE_TYPE[0].name: // pageHtml
        return [
          <PageHtml version={props.file.version} text={props.file.text} />,
          <Timeline customClass={`${customClass}__contentpage`} />
        ]
      case FILE_TYPE[3].name: // thread
        return [
          <Thread />
        ]
    }
  })()

  return (
    <PopinFixed customClass={`${customClass}`}>
      <PopinFixedHeader
        customClass={`${customClass}`}
        icon={icon}
        name={props.file.title}
        onClickCloseBtn={props.onClose}
      />

      <PopinFixedOption customClass={`${customClass}`} />

      <PopinFixedContent customClass={`${customClass}__contentpage`}>
        { leftPart }
        { rightPart }
      </PopinFixedContent>
    </PopinFixed>
  )
}

export default FileContentViewer

FileContentViewer.PropTypes = {
  file: PropTypes.shape({
    type: PropTypes.oneOf(FILE_TYPE.map(f => f.name)).isRequired,
    title: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
}
