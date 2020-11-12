import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  buildFilePreviewUrl as jpgPreviewUrl,
  removeExtensionOfFilename,
  removeInteractiveContentFromHTML,
  SCREEN_SIZE
} from 'tracim_frontend_lib'
import { FETCH_CONFIG, PAGE } from '../../util/helper.js'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./Preview.styl')

// possible preview sizes with their media queries, ordered from smallest to biggest
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
  state = {
    preview: this.isHtmlPreview() ? null : this.getJPEGPreview(),
    previewOverflow: false,
    previewLoading: this.isHtmlPreview(),
    previewUnavailable: false
  }

  isHtmlPreview () {
    const type = this.props.content.content_type
    return type === 'html-document' || type === 'thread'
  }

  getHTMLPreviewUrl ({ content_type: type, content_id: id, workspace_id: spaceId, label }) {
    return `${FETCH_CONFIG.apiUrl}/workspaces/${spaceId}/${type}s/${id}/preview/html/${label}.html`
  }

  handleUnavailablePreview = () => {
    this.setState({
      previewLoading: false,
      preview: null,
      previewUnavailable: true
    })
  }

  setLoadingPreview () {
    this.setState({ previewLoading: true })
  }

  async getHTMLPreview () {
    const fetchResult = await fetch(this.getHTMLPreviewUrl(this.props.content), {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    })

    if (!fetchResult.ok) {
      this.handleUnavailablePreview()
      return
    }

    const htmlCode = await fetchResult.text()

    return (
      <div className='activityFeed__preview__html'>
        <article
          dangerouslySetInnerHTML={{
            __html: removeInteractiveContentFromHTML(htmlCode)
          }}
        />
      </div>
    )
  }

  getJPEGPreview (previewUrl) {
    const { content } = this.props
    const label = content.label
    const filenameNoExtension = removeExtensionOfFilename(content.filename)

    const prev = (width) => (
      jpgPreviewUrl(
        FETCH_CONFIG.apiUrl,
        content.workspace_id,
        content.content_id,
        content.current_revision_id,
        filenameNoExtension,
        1,
        width,
        MAX_PREVIEW_HEIGHT
      )
    )

    const src = ([mediaQuery, width]) => prev(width) + ' ' + width + 'w'

    return (
      <div class='activityFeed__preview__image'>
        <img
          alt={this.props.t('Preview of {{content}}', { content: label })}
          title={label}
          src={prev(PREVIEW_WIDTHS[0][1])} // fall back on the smallest image size
          srcset={PREVIEW_WIDTHS.map(src).join(',')}
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

  setPreview (preview) {
    this.setState({
      preview,
      previewLoading: false
    })
  }

  async updatePreview () {
    let preview = null

    if (this.isHtmlPreview()) {
      if (!this.state.preview) {
        this.setLoadingPreview()
      }

      try {
        preview = await this.getHTMLPreview()
      } catch (e) {
        this.handleUnavailablePreview()
        console.error('Unable to produce the preview of content ', this.props.content, e)
        return
      }

    } else {
      preview = this.getJPEGPreview()
    }

    this.setPreview(preview)
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

  render () {
    const { props } = this
    const { content } = props

    return (
      <div
        className={classnames(
          'activityFeed__preview', {
            activityFeed__preview__overflow: this.state.previewOverflow,
            activityFeed__preview__unavailable: this.state.previewUnavailable,
            activityFeed__preview__loading: this.state.previewLoading
        })}
        ref={(ref) => this.receivePreviewRef(ref)}
      >
        <Link to={PAGE.WORKSPACE.CONTENT(content.workspace_id, content.content_type, content.content_id)}>
          {(
            this.state.previewLoading
              ? props.t('Preview loading...')
              : (
                  this.state.previewUnavailable
                    ? (
                      <>
                        <i className='fa fa-eye-slash' />
                        <span>{this.props.t('No preview available')}</span>
                      </>
                    )
                    : this.state.preview
              )
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
