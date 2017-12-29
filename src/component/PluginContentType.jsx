import React from 'react'
import PageHtml from '../plugin/ContentType/PageHtml/PageHtml.jsx'
import Thread from '../plugin/ContentType/Thread/Thread.jsx'
import Timeline from './Timeline.jsx'
import {FILE_TYPE} from '../helper.js'

const PluginContentType = props => {
  // const [leftPart, rightPart] = (() => {
  //   switch (props.file.type) {
  //     case FILE_TYPE[0].name: // pageHtml
  //       return [
  //         <PageHtml version={props.file.version} text={props.file.text} />,
  //         <Timeline customClass={`${props.customClass}__contentpage`} />
  //       ]
  //     case FILE_TYPE[3].name: // thread
  //       return [
  //         <Thread />
  //       ]
  //   }
  // })()
  // return [leftPart, rightPart]
  const { componentLeft, componentRight, customClass, } = FILE_TYPE.find(p => p.name === props.file.type)

  return [
    genericPlugin.componentLeft,
    genericPlugin.componentRight
  ]
}

export default PluginContentType
