import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { getUrlPreview } from '../../action.async.js'
import { handleFetchResult } from '../../helper.js'

const MAX_DESCRIPTION_LENGTH = 0 // 0 means no limit

export default class LinkPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      title: '',
      url: '',
      description: '',
      image: ''
    }
  }

  getSelectedLink () {
    const linkList = (
      new DOMParser().parseFromString(
        this.props.findLinkInHTML,
        'text/html'
      ).body.querySelectorAll('a[href]')
    )

    for (const link of linkList) {
      const href = link.href
      if (href.startsWith('https://') && !href.startsWith('https://' + location.hostname)) {
        return href
      }
    }

    return null
  }

  async updatePreview () {
    const url = this.getSelectedLink()

    if (!url) {
      if (this.state.url) {
        this.setState({ title: '', url: '', description: '', image: '' })
      }

      return
    }

    if (url === this.state.url) return

    const fetchGetUrlPreview = await handleFetchResult(await getUrlPreview(this.props.apiUrl, url))

    if (fetchGetUrlPreview.ok) {
      const { title, description, image } = fetchGetUrlPreview.body
      this.setState({
        title,
        url,
        description: (
          MAX_DESCRIPTION_LENGTH && (description.length > MAX_DESCRIPTION_LENGTH)
            ? description.substr(0, MAX_DESCRIPTION_LENGTH) + '…'
            : description
        ),
        image
      })
    } else {
      this.setState({ title: '', description: '', image: '' })
    }
  }

  componentDidMount () {
    this.updatePreview()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.findLinkInHTML !== this.props.findLinkInHTML) {
      this.updatePreview()
    }
  }

  handleImageError = () => {
    this.setState({ image: '' })
  }

  render () {
    const { state } = this

    if (!state.url || !state.description) return null

    return (
      <a
        href={state.url}
        target='_blank'
        rel='noopener noreferrer'
        className={classnames('linkPreview', { bigPreviewImage: !state.description })}
      >
        {(state.image && (
          <img
            alt=''
            src={state.image}
            className='linkPreview__img'
            onError={this.handleImageError}
            onLoad={this.handleImageLoad}
          />
        ))}

        <div className='linkPreview__content'>
          <div className='linkPreview__content__title'>
            <strong>{state.title}</strong>
          </div>
          <div className='linkPreview__content__link'>
            {new URL(state.url).hostname}
          </div>
          <div className='linkPreview__content__description'>
            {state.description}
          </div>
        </div>
      </a>
    )
  }
}

LinkPreview.propTypes = {
  findLinkInHTML: PropTypes.string.isRequired,
  apiUrl: PropTypes.string.isRequired
}
