import React from 'react'
import PropTypes from 'prop-types'
import PopinFixed from '../common/PopinFixed/PopinFixed'
import PopinFixedHeader from '../common/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from '../common/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from '../common/PopinFixed/PopinFixedContent.jsx'
import { FILE_TYPE } from '../../helper.js'
// import PluginContentType from '../PluginContentType.jsx'
import PageHtml from '../../plugin/ContentType/PageHtml/PageHtml.jsx'
// import Thread from '../../plugin/ContentType/Thread/Thread.jsx'

const FileContentViewer = props => {
  const defaultPlugin = {
    customClass: '',
    icon: '',
    componentLeft: undefined,
    componentRight: undefined
  }
  const { customClass, icon, componentLeft, componentRight } = FILE_TYPE.find(f => f.name === props.file.type) || defaultPlugin

  const PluginLeft = props => {
    console.log('componentLeft === PageHtml.name', componentLeft === PageHtml.name)
    switch (componentLeft) {
      case PageHtml.name:
        return <PageHtml version={props.file.version} text={props.file.text} />
    }
    // componentLeft is a string, I cant do <componentLeft /> because it needs to be a react object (component) like PageHtml is
  }

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
        {/* <PluginContentType customeClass={customClass} file={props.file} /> */}
        <PluginLeft file={props.file} />
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
