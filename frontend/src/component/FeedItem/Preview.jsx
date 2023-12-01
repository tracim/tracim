import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import { isEqual } from 'lodash'
import {
  buildFilePreviewUrl as jpgPreviewUrl,
  removeExtensionOfFilename,
  removeInteractiveContentFromHTML,
  HTMLContent,
  AttachedFile,
  CONTENT_TYPE,
  SCREEN_SIZE
} from 'tracim_frontend_lib'
import { FETCH_CONFIG } from '../../util/helper.js'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { getHTMLPreview } from '../../action-creator.async.js'

require('./Preview.styl')

// INFO - RJ - 2020-11-17 - possible preview sizes with their media queries, ordered from smallest to biggest
const PREVIEW_WIDTHS = [
  [
    `(max-width: ${SCREEN_SIZE.MAX_SM})`,
    376 // 400px - margins (10 * 2px) - borders (2 * 1px)
  ],
  [
    '',
    776 // 800px - margins (10 * 2px) - borders (2 * 1px)
  ]
]

const MAX_PREVIEW_HEIGHT = 300

const LINK_TYPE = {
  NONE: 'none',
  DOWNLOAD: 'download',
  OPEN_IN_APP: 'open_in_app'
}

export class Preview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      previewOverflow: false,
      previewLoading: this.isHtmlPreview(),
      previewUnavailable: false,
      previewHtmlCode: null
    }
  }

  isHtmlPreview () {
    const type = this.props.content.type
    return type === CONTENT_TYPE.HTML_DOCUMENT || type === CONTENT_TYPE.THREAD
  }

  handleUnavailablePreview = () => {
    this.setState({
      previewLoading: false,
      previewHtmlCode: null,
      previewUnavailable: true
    })
  }

  setPreviewLoading () {
    this.setState({ previewLoading: true })
  }

  async getHTMLPreviewCode (content) {
    if (Object.hasOwnProperty.call(content, 'translatedRawContent')) {
      return content.translatedRawContent
    }

    if (content.type === CONTENT_TYPE.HTML_DOCUMENT) {
      return content.rawContent
    }

    const fetchResultGetHTMLPreview = await getHTMLPreview(
      content.workspaceId,
      content.type,
      content.id,
      content.label
    )

    if (!fetchResultGetHTMLPreview.ok) {
      return null
    }

    return fetchResultGetHTMLPreview.text()
  }

  async retrieveHtmlPreviewCode () {
    const { content } = this.props

    const htmlCode = await this.getHTMLPreviewCode(content)

    if (htmlCode === null) {
      // RJ - NOTE - 2020-11-18: comparing to null, since the empty string
      // would be a valid HTML preview code

      this.handleUnavailablePreview()
    }

    const previewHtmlCode = this.props.linkType !== LINK_TYPE.NONE
      ? removeInteractiveContentFromHTML(htmlCode)
      : htmlCode
    this.setState({
      previewHtmlCode,
      previewUnavailable: htmlCode === null
    })
  }

  getJPEGPreviewComponent (previewUrl) {
    const { content } = this.props
    const filenameNoExtension = removeExtensionOfFilename(content.fileName)
    const FIRST_PAGE = 1

    const previewURL = (width) => (
      jpgPreviewUrl(
        FETCH_CONFIG.apiUrl,
        content.workspaceId,
        content.id,
        content.currentRevisionId,
        filenameNoExtension,
        FIRST_PAGE,
        width,
        MAX_PREVIEW_HEIGHT
      )
    )

    const src = ([mediaQuery, width]) => `${previewURL(width)} ${width}w`

    return (
      <div className='feedItem__preview__image'>
        <img
          alt={this.props.t('Preview of {{content}}', { content: content.label })}
          src={previewURL(PREVIEW_WIDTHS[0][1])} // fall back on the smallest image size
          srcSet={PREVIEW_WIDTHS.map(src).join(',')}
          sizes={
            PREVIEW_WIDTHS
              .map(([mediaQuery, width]) => `${mediaQuery} ${width}px`.trim())
              .join(',')
          }
          onError={() => this.handleUnavailablePreview()}
        />
      </div>
    )
  }

  async updatePreview () {
    let previewComponent = null

    if (this.isHtmlPreview()) {
      if (!this.state.previewComponent) {
        this.setPreviewLoading()
      }

      try {
        this.retrieveHtmlPreviewCode()
      } catch (e) {
        this.handleUnavailablePreview()
        console.error('Unable to produce the preview of content ', this.props.content, e)
        return
      }
    } else {
      previewComponent = this.getJPEGPreviewComponent()
    }

    this.setState({
      previewComponent,
      previewLoading: false
    })
  }

  receivePreviewRef (ref) {
    this.previewRef = ref
    this.testPreviewOverflow()
  }

  isContentDifferent = (oldContent, newContent) => (
    newContent.firstComment !== oldContent.firstComment ||
    !isEqual(newContent.commentList, oldContent.commentList) ||
    newContent.translatedRawContent !== oldContent.translatedRawContent ||
    newContent.currentRevisionId !== oldContent.currentRevisionId
  )

  componentDidUpdate (prevProps) {
    const { props } = this
    if (prevProps.content === props.content) {
      this.testPreviewOverflow()
    } else if (this.isContentDifferent(prevProps.content, props.content)) {
      this.updatePreview()
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return (
      this.isContentDifferent(this.props.content, nextProps.content) ||
      Object.entries(nextState).some(([key, val]) => val !== this.state[key])
    )
  }

  componentDidMount () {
    if (this.isHtmlPreview()) {
      this.updatePreview()
    } else {
      this.testPreviewOverflow()
    }
  }

  testPreviewOverflow () {
    const ref = this.previewRef
    if (ref) {
      const previewOverflow = ref.scrollHeight > ref.offsetHeight
      if (this.state.previewOverflow !== previewOverflow) {
        this.setState({ previewOverflow })
      }
    }
  }

  getUnavailablePreviewComponent () {
    return (
      this.props.fallbackToAttachedFile
        ? <AttachedFile fileName={this.props.content.fileName} />
        : this.noPreviewComponent(this.props.t('No preview available'))
    )
  }

  noPreviewComponent (details) {
    return (
      <>
        <i className='far fa-eye-slash' />
        <span>{details}</span>
      </>
    )
  }

  getHTMLPreviewComponent () {
    const { props } = this

    if (!this.state.previewHtmlCode) {
      return this.noPreviewComponent(
        props.content.type === CONTENT_TYPE.THREAD
          ? props.t('Empty thread')
          : props.t('Empty note')
      )
    }

    return (
      <div className='feedItem__preview__html'>
        <HTMLContent>{this.state.previewHtmlCode}</HTMLContent>
      </div>
    )
  }

  getPreviewComponent () {
    const { props, state } = this
    let component = null
    if (state.previewLoading) {
      component = <>{props.t('Preview loading...')}</>
    }

    if (state.previewUnavailable) {
      component = this.getUnavailablePreviewComponent()
    } else if (this.isHtmlPreview()) {
      if (state.previewHtmlCode === null) {
        component = this.getUnavailablePreviewComponent()
      } else {
        component = this.getHTMLPreviewComponent()
      }
    } else {
      component = this.getJPEGPreviewComponent()
    }
    return (
      <>
        {component}
        {state.previewOverflow && <div className='feedItem__preview__overflowOverlay' />}
      </>
    )
  }

  getPreviewWithLink () {
    const { props } = this
    switch (props.linkType) {
      case LINK_TYPE.NONE:
        return this.getPreviewComponent()
      case LINK_TYPE.OPEN_IN_APP:
        return <Link to={props.link}>{this.getPreviewComponent()}</Link>
      case LINK_TYPE.DOWNLOAD:
        return (
          <a
            href={props.link}
            download
          >
            {this.getPreviewComponent()}
          </a>
        )
    }
    return null
  }

  render () {
    const { state } = this
    return (
      <div
        className={classnames(
          'feedItem__preview', {
            feedItem__preview__overflow: state.previewOverflow,
            feedItem__preview__unavailable: state.previewUnavailable || (this.isHtmlPreview() && state.previewHtmlCode === ''),
            feedItem__preview__loading: state.previewLoading
          }
        )}
        ref={(ref) => this.receivePreviewRef(ref)}
      >
        {this.getPreviewWithLink()}
      </div>
    )
  }
}

Preview.propTypes = {
  fallbackToAttachedFile: PropTypes.bool,
  content: PropTypes.object.isRequired,
  link: PropTypes.string.isRequired,
  linkType: PropTypes.oneOf(Object.values(LINK_TYPE))
}

Preview.defaultProps = {
  fallbackToAttachedFile: false,
  linkType: LINK_TYPE.OPEN_IN_APP
}

export default translate()(Preview)
export { LINK_TYPE }
