import React from 'react'
import PropTypes from 'prop-types'

/*
 * DOC - SG - 2021-04-08
 * This component keeps the scroll position of its root element at the bottom as long as
 * it hasn't been scrolled externally.
 *
 * It properly handles the resizing of direct children.
 * You can disable its behavior with shouldScrollToBottom=false.

 * You can use isLastItemAddedFromCurrentToken=true to force a scroll to bottom
 * when an element is added even if the scroll wasn't at the bottom.
 */
export class ScrollToBottomWrapper extends React.Component {
  constructor (props) {
    super(props)

    this.atBottom = true
    this.container = null
    this.containerScrollHeight = 0
    this.resizeObserver = new ResizeObserver(this.handleResizeChildren)
  }

  componentWillUnmount () {
    this.resizeObserver = null
  }

  componentDidUpdate () {
    const { props } = this
    this.resizeObserver.disconnect()
    if (!(this.container && props.shouldScrollToBottom)) return
    for (const element of this.container.children) {
      this.resizeObserver.observe(element)
    }
  }

  handleScroll = (event) => {
    // NOTE - SG - 2021-04-08 - the second test is used to ignore
    // scrollHeight changes not already handled by handleResizechildren()
    // as it can be called **after** handleScroll() thanks to asynchronism.
    if (!this.container || this.container.scrollHeight !== this.containerScrollHeight) return
    this.atBottom = (this.container.scrollHeight - Math.abs(this.container.scrollTop)) === this.container.clientHeight
  }

  handleResizeChildren = () => {
    const { props } = this
    if (!this.container || !(this.atBottom || props.isLastItemAddedFromCurrentToken)) return
    const behavior = props.isLastItemFromCurrentToken ? 'smooth' : 'instant'
    // NOTE - SG - 2021-04-08
    // Keep track of the last known scroll height so that scroll events not generated by
    // this function or the user are ignored.
    this.containerScrollHeight = this.container.scrollHeight
    // INFO - SG - 2021-04-08 - using scrollTo() instead of scrollIntoView()
    // avoids to move the view if the wrapper is in a scroll itself.
    const scrollTop = this.container.scrollHeight - this.container.clientHeight
    this.container.scrollTo({
      // INFO - SG - 2021-04-08 - Leave the x scroll unchanged
      left: this.container.scrollLeft,
      top: scrollTop,
      behavior
    })
  }

  render () {
    const { props } = this

    return (
      <div
        className={props.customClass}
        ref={el => { this.container = el }}
        onScroll={props.shouldScrollToBottom ? this.handleScroll : undefined}
      >
        {props.children}
      </div>
    )
  }
}

export default ScrollToBottomWrapper

ScrollToBottomWrapper.propTypes = {
  customClass: PropTypes.string,
  isLastItemAddedFromCurrentToken: PropTypes.bool,
  shouldScrollToBottom: PropTypes.bool
}

ScrollToBottomWrapper.defaultProps = {
  customClass: '',
  isLastItemAddedFromCurrentToken: false,
  shouldScrollToBottom: false
}
