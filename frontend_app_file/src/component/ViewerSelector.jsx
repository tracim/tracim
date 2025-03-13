import React from 'react'
import { PropTypes } from 'prop-types'
import IfcViewer from './IfcViewer/IfcViewer.jsx'
import JpegAndVideoViewer from './JpegAndVideoViewer/JpegAndVideoViewer.jsx'
import TextViewerSyntaxHighlight from './TextViewerSyntaxHighlight/TextViewerSyntaxHighlight.jsx'
import { prismJsLanguageList } from './prismJsLanguageList.js'

export const ViewerSelector = props => {
  if (props.contentExtension === '.ifc') {
    return (
      <IfcViewer contentRawUrl={props.contentRawUrl} />
    )
  }

  const fileExtensionForPrismJsLanguage = props.contentExtension.replace('.', '')
  if (prismJsLanguageList.some(extension => extension === fileExtensionForPrismJsLanguage)) {
    return (
      <TextViewerSyntaxHighlight
        contentRawUrl={props.contentRawUrl}
        language={fileExtensionForPrismJsLanguage}
      />
    )
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
  contentExtension: PropTypes.string,
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
  contentExtension: '',
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
