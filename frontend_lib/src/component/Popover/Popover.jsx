import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { isMobile } from 'react-device-detect'
import {
  Popover as ReactStrapPopover,
  PopoverBody
} from 'reactstrap'
import { onClickOutside } from '../../helper.js'

function Popover (props) {
  const popoverRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  useEffect(onClickOutside(
    listening,
    setListening,
    popoverRef,
    setIsPopoverOpen
  ))

  const handleTogglePopover = () => setIsPopoverOpen(!isPopoverOpen)

  let trigger = props.trigger
    ? props.trigger
    : isMobile ? 'click' : 'hover'

  if (props.trigger && (props.trigger !== 'click' && props.trigger !== 'hover')) {
    console.error(`Error, Popover called with unknown trigger "${props.trigger}". Fallback to hover`)
    trigger = 'hover'
  }

  return (
    <ReactStrapPopover
      placement={props.placement}
      isOpen={isPopoverOpen}
      target={props.targetId}
      // INFO - GB - 2021-12-29 - ignoring rule react/jsx-handler-names for prop below because it comes from external lib
      toggle={handleTogglePopover} // eslint-disable-line react/jsx-handler-names
      trigger={trigger}
    >
      <PopoverBody>
        <div onClick={handleTogglePopover} ref={popoverRef}>
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
  placement: PropTypes.string,
  trigger: PropTypes.string
}

Popover.defaultProps = {
  placement: 'bottom',
  trigger: undefined
}
