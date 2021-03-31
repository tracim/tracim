import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { getUrlPreview } from '../../action.async.js'
import { handleFetchResult } from '../../helper.js'

const MAX_DESCRIPTION_LENGTH = 0 // 0 means no limit

function getDomain (url) {
  // RJ - NOTE - 2021-03-30
  // - getDomain("http://perdu.com") if given "perdu.com"
  // - getDomain("https://example.org/index.html") = "example.org"
  // - getDomain("https://example.org:443/index.html") = "example.org"
  // - getDomain("https://example.org:443") = "example.org"
  // Returns the original URL if the regular expression does not match it.
  // This function might have its place in helper.js.

  const match = url.match(/^[a-z]+:\/\/([^/:]+)(?::[0-9]+)?(?:\/(?:[\s\S]+)?)?$/i)
  return (match && match[1]) || url
}

export default class LinkPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      title: '',
      url: '',
      description: ''
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

  async componentDidMount () {
    const url = this.getSelectedLink()

    if (!url) return

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
    }
  }

  handleImageError = () => {
    this.setState({ image: '' })
  }

  render () {
    const { title, url, description, image } = this.state

    if (!url || !description) return null

    return (
      <a
        href={url}
        target='_blank'
        rel='noopener noreferrer'
        className={classnames('linkPreview', { bigPreviewImage: !description })}
      >
        {(image && (
          <img
            alt=''
            src={image}
            className='linkPreview__img'
            onError={this.handleImageError}
            onLoad={this.handleImageLoad}
          />
        ))}

        <div className='linkPreview__content'>
          <div className='linkPreview__content__title'>
            <strong>{title}</strong>
          </div>
          <div className='linkPreview__content__link'>
            {getDomain(url)}
          </div>
          <div className='linkPreview__content__description'>
            {description}
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
