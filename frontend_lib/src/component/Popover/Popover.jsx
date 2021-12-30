import React from 'react'
import PropTypes from 'prop-types'
import { isMobile } from 'react-device-detect'
import {
  Popover as ReactStrapPopover,
  PopoverBody
} from 'reactstrap'

class Popover extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isPopoverOpen: false
    }
  }

  handleTogglePopover = () => this.setState(prev => ({ isPopoverOpen: !prev.isPopoverOpen }))

  render () {
    const { props, state } = this
    return (
      <ReactStrapPopover
        placement={props.placement}
        isOpen={state.isPopoverOpen}
        target={props.targetId}
        // INFO - GB - 2021-12-29 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
        toggle={this.handleTogglePopover} // eslint-disable-line react/jsx-handler-names
        trigger={isMobile ? 'click' : 'hover'}
      >
        <PopoverBody>
          {props.popoverBody}
        </PopoverBody>
      </ReactStrapPopover>
    )
  }
}
export default Popover

Popover.propTypes = {
  popoverBody: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  targetId: PropTypes.string.isRequired,
  placement: PropTypes.string
}

Popover.defaultProps = {
  placement: 'bottom'
}
