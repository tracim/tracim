import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { isMobile } from 'react-device-detect'
import {
  Popover as ReactStrapPopover,
  PopoverBody
} from 'reactstrap'

function Popover (props) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleTogglePopover = () => setIsPopoverOpen(!isPopoverOpen)

  return (
    <ReactStrapPopover
      placement={props.placement}
      isOpen={isPopoverOpen}
      target={props.targetId}
      // INFO - GB - 2021-12-29 - ignoring rule react/jsx-handler-names for prop below because it comes from external lib
      toggle={handleTogglePopover} // eslint-disable-line react/jsx-handler-names
      trigger={isMobile ? 'click' : 'hover'}
    >
      <PopoverBody>
        <div onClick={handleTogglePopover}>
          {props.popoverBody}
        </div>
      </PopoverBody>
    </ReactStrapPopover>
  )
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
