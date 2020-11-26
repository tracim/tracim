import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  buildFilePreviewUrl as jpgPreviewUrl,
  removeExtensionOfFilename,
  removeInteractiveContentFromHTML,
  HTMLContent,
  CONTENT_TYPE,
  SCREEN_SIZE
} from 'tracim_frontend_lib'
import { FETCH_CONFIG, PAGE } from '../../util/helper.js'
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

class Preview extends React.Component {
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
    const type = this.props.content.content_type
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
    if (content.content_type === CONTENT_TYPE.HTML_DOCUMENT) {
      return content.raw_content
    }

    const fetchResultGetHTMLPreview = await getHTMLPreview(
      content.workspace_id,
      content.content_type,
      content.content_id,
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

    this.setState({
      previewHtmlCode: removeInteractiveContentFromHTML(htmlCode)
    })
  }

  getJPEGPreviewComponent (previewUrl) {
    const { content } = this.props
    const filenameNoExtension = removeExtensionOfFilename(content.filename)
    const FIRST_PAGE = 1

    const previewURL = (width) => (
      jpgPreviewUrl(
        FETCH_CONFIG.apiUrl,
        content.workspace_id,
        content.content_id,
        content.current_revision_id,
        filenameNoExtension,
        FIRST_PAGE,
        width,
        MAX_PREVIEW_HEIGHT
      )
    )

    const src = ([mediaQuery, width]) => `${previewURL(width)} ${width}w`

    return (
      <div className='activityFeed__preview__image'>
        <img
          alt={this.props.t('Preview of {{content}}', { content: content.label })}
          title={content.label}
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
      previewComponent = this.getJPEGPreview()
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

  componentDidUpdate (prevProps) {
    if (prevProps.content === this.props.content) {
      this.testPreviewOverflow()
    } else if (prevProps.content.current_revision_id !== this.props.content.current_revision_id) {
      this.updatePreview()
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return (
      nextProps.content.current_revision_id !== this.props.content.current_revision_id ||
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
    return this.noPreviewComponent(this.props.t('No preview available'))
  }

  noPreviewComponent (details) {
    return (
      <>
        <i className='fa fa-eye-slash' />
        <span>{details}</span>
      </>
    )
  }

  getHTMLPreviewComponent () {
    if (!this.state.previewHtmlCode) {
      const { props } = this

      return this.noPreviewComponent(
        props.content.content_type === CONTENT_TYPE.THREAD
          ? props.t('Empty thread')
          : props.t('Empty note')
      )
    }

    return (
      <div className='activityFeed__preview__html'>
        <HTMLContent>{this.state.previewHtmlCode}</HTMLContent>
      </div>
    )
  }

  getPreviewComponent () {
    const { props, state } = this
    if (state.previewLoading) {
      return <>{props.t('Preview loading...')}</>
    }

    if (state.previewUnavailable) {
      return this.getUnavailablePreviewComponent()
    }

    if (this.isHtmlPreview()) {
      if (state.previewHtmlCode === null) {
        return this.getUnavailablePreviewComponent()
      }

      return this.getHTMLPreviewComponent()
    }

    return this.getJPEGPreviewComponent()
  }

  render () {
    const { props, state } = this
    const { content } = props

    return (
      <div
        className={classnames(
          'activityFeed__preview', {
            activityFeed__preview__overflow: state.previewOverflow,
            activityFeed__preview__unavailable: state.previewUnavailable || (this.isHtmlPreview() && state.previewHtmlCode === ''),
            activityFeed__preview__loading: state.previewLoading
          }
        )}
        ref={(ref) => this.receivePreviewRef(ref)}
      >
        <Link to={PAGE.WORKSPACE.CONTENT(content.workspace_id, content.content_type, content.content_id)}>
          {this.getPreviewComponent()}
          {state.previewOverflow && (
            <div className='activityFeed__preview__overflow_overlay' />
          )}
        </Link>
      </div>
    )
  }
}

Preview.propTypes = {
  content: PropTypes.object.isRequired
}

export default translate()(Preview)
