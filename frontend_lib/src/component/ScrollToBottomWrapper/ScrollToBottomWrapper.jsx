import React from 'react'
import { CONTENT_TYPE } from '../../helper.js'
import PropTypes from 'prop-types'

export class ScrollToBottomWrapper extends React.Component {
  constructor (props) {
    super(props)
    this.containerScrollHeight = 0
  }

  componentDidMount () {
    this.containerScrollHeight = this.container.scrollHeight
    if (window.innerWidth < 1200) return
    this.containerBottom.scrollIntoView({ behavior: 'instant' })
  }

  componentDidUpdate (prevProps) {
    if (this.props.shouldScrollToBottom && this.props.itemList && prevProps.itemList) {
      this.scrollToBottom(prevProps.itemList)
    }
    this.containerScrollHeight = this.container.scrollHeight
  }

  scrollToBottom = (prevItemList) => {
    const { props } = this

    if (props.itemList.length === 0) return

    const lastCurrentItem = props.itemList[props.itemList.length - 1]
    const isNewContent = prevItemList.length > 0
      ? this.getContentId(prevItemList[prevItemList.length - 1]) !== this.getContentId(lastCurrentItem)
      : false

    const scrollPosition = this.container.scrollTop + this.container.clientHeight
    const isScrollAtTheBottom = scrollPosition === this.containerScrollHeight

    const isLastItemTypeComment = props.itemList[props.itemList.length - 1].content_type === CONTENT_TYPE.COMMENT
    const isLastItemTypePublication = props.itemList[props.itemList.length - 1].type === 'publication'

    // GM - INFO - 2020-06-30 - When width >= 1200: Check if the container scroll is at the bottom
    // or if the new item was created by the current session tokenId or if the content_id has changed.
    // When width >= 1200: Check the if the new comment was created by the current session tokenId.
    if (
      (window.innerWidth >= 1200 && (isNewContent || isScrollAtTheBottom || props.isLastItemAddedFromCurrentToken)) ||
      (window.innerWidth < 1200 && props.isLastItemAddedFromCurrentToken && (isLastItemTypeComment || isLastItemTypePublication))
    ) {
      const behavior = isScrollAtTheBottom && props.isLastItemFromCurrentToken ? 'smooth' : 'instant'
      this.containerBottom.scrollIntoView({ behavior })
    }
  }

  getContentId = (content) => {
    if (!content) return -1
    return content.timelineType === CONTENT_TYPE.COMMENT ? content.parent_id : content.content_id || content.id
  }

  render () {
    const { props } = this

    return (
      <ul className={props.customClass} ref={el => { this.container = el }}>
        {props.children}
        <li style={{ visibility: 'hidden', height: '0' }} ref={el => { this.containerBottom = el }} />
      </ul>
    )
  }
}

export default ScrollToBottomWrapper

ScrollToBottomWrapper.propTypes = {
  itemList: PropTypes.array.isRequired,
  customClass: PropTypes.string,
  isLastItemFromCurrentToken: PropTypes.bool,
  shouldScrollToBottom: PropTypes.bool
}

ScrollToBottomWrapper.defaultProps = {
  customClass: '',
  isLastItemAddedFromCurrentToken: false,
  shouldScrollToBottom: false
}
