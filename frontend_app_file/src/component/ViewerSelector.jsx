import React, { useState, useEffect } from 'react'
import { PropTypes } from 'prop-types'
import IfcViewer from './IfcViewer/IfcViewer.jsx'
import JpegAndVideoViewer from './JpegAndVideoViewer/JpegAndVideoViewer.jsx'
import TextViewerSyntaxHighlight from './TextViewerSyntaxHighlight/TextViewerSyntaxHighlight.jsx'
import { prismJsLanguageList } from './prismJsLanguageList.js'
import FileTooHeavyWarning from './FileTooHeavyWarning/FileTooHeavyWarning.jsx'
import ThreeDViewer from './ThreeDViewer/ThreeDViewer.jsx'

const HANDLED_VIEWER_EXTENSION_LIST = [
  'ifc', 'xyz', 'e57', 'obj', '3ds', 'max', 'stl', 'dae', 'gcode', 'svg', 'ttf'
]
const RUN_VIEWER_MAX_FILE_SIZE_IN_OCTET = 500000 // 500ko

export const ViewerSelector = props => {
  const [showSizeWarning, setShowSizeWarning] = useState(true)

  useEffect(() => {
    setShowSizeWarning(props.content?.size > RUN_VIEWER_MAX_FILE_SIZE_IN_OCTET)
  }, [props.content])

  const fileExtension = props.content?.file_extension?.toLowerCase().replace('.', '') || ''
  const availableViewerExtensionList = [
    ...prismJsLanguageList,
    ...HANDLED_VIEWER_EXTENSION_LIST
  ]

  if (availableViewerExtensionList.includes(fileExtension)) {
    if (showSizeWarning === true) {
      return (
        <FileTooHeavyWarning
          contentSize={props.content.size}
          onRunAnyway={() => setShowSizeWarning(false)}
        />
      )
    }

    if (fileExtension === 'ifc') {
      return <IfcViewer contentRawUrl={props.contentRawUrl} />
    }

    if (HANDLED_VIEWER_EXTENSION_LIST.includes(fileExtension)) {
      return (
        <ThreeDViewer
          contentRawUrl={props.contentRawUrl}
          contentExtension={fileExtension}
        />
      )
    }

    const canPrismJsHandleExtension = prismJsLanguageList.some(extension => extension === fileExtension)
    if (canPrismJsHandleExtension) {
      return (
        <TextViewerSyntaxHighlight
          contentRawUrl={props.contentRawUrl}
          language={fileExtension}
        />
      )
    }
  }

  return (
    // INFO - CH - 2025-03-13 - Default viewer using the jpeg file from Preview Generator
    <JpegAndVideoViewer
      color={props.customColor}
      contentRawUrl={props.contentRawUrl}
      isPdfAvailable={props.isPdfAvailable}
      isJpegAvailable={props.isJpegAvailable}
      isVideo={props.isVideo}
      downloadPdfPageUrl={props.downloadPdfPageUrl}
      downloadPdfFullUrl={props.downloadPdfFullUrl}
      previewList={props.previewList}
      preview={props.preview}
      filePageNb={props.filePageNb}
      fileCurrentPage={props.fileCurrentPage}
      lightboxUrlList={props.lightboxUrlList}
      onClickPreviousPage={props.onClickPreviousPage}
      onClickNextPage={props.onClickNextPage}
      onTogglePreviewVideo={props.onTogglePreviewVideo}
    />
  )
}

export default ViewerSelector

ViewerSelector.propTypes = {
  content: PropTypes.object,
  color: PropTypes.string,
  contentRawUrl: PropTypes.string,
  isPdfAvailable: PropTypes.bool,
  isJpegAvailable: PropTypes.bool,
  isVideo: PropTypes.bool,
  downloadPdfPageUrl: PropTypes.string,
  downloadPdfFullUrl: PropTypes.string,
  previewList: PropTypes.array,
  preview: PropTypes.object,
  filePageNb: PropTypes.number,
  fileCurrentPage: PropTypes.number,
  lightboxUrlList: PropTypes.array,
  onClickPreviousPage: PropTypes.func,
  onClickNextPage: PropTypes.func,
  onTogglePreviewVideo: PropTypes.func
}

ViewerSelector.defaultProps = {
  content: {},
  color: '',
  contentRawUrl: '',
  isPdfAvailable: false,
  isJpegAvailable: false,
  isVideo: false,
  downloadPdfPageUrl: '',
  downloadPdfFullUrl: '',
  previewList: [],
  preview: {},
  filePageNb: 0,
  fileCurrentPage: 0,
  lightboxUrlList: [],
  onClickPreviousPage: () => {},
  onClickNextPage: () => {},
  onTogglePreviewVideo: () => {}
}
