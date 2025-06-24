import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { CUSTOM_EVENT } from '../../customEvent.js'
import { TracimComponent } from '../../tracimComponent.js'

// require('./PopinFixed.styl') // see https://github.com/tracim/tracim/issues/1156

class PopinFixed extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isSidebarVisible: true
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.HIDE_SIDEBAR, handler: this.handleHideSidebar },
      { name: CUSTOM_EVENT.SHOW_SIDEBAR, handler: this.handleShowSidebar }
    ])
  }

  componentDidMount () {
    const isSidebarVisible = !document.querySelector('.sidebarClose')
    if (this.state.isSidebarVisible !== isSidebarVisible) {
      this.setState({ isSidebarVisible })
    }
  }

  handleShowSidebar = () => this.setState({ isSidebarVisible: true })

  handleHideSidebar = () => this.setState({ isSidebarVisible: false })

  render () {
    const { props, state } = this
    return (
      <div
        className={classnames(
          'wsContentGeneric',
          props.customClass,
          { sidebarVisible: state.isSidebarVisible },
          { visible: props.visible }
        )}
        style={props.style}
        data-cy='popinFixed'
      >
        {props.children}
      </div>
    )
  }
}
export default TracimComponent(PopinFixed)

PopinFixed.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.array,
    PropTypes.object
  ]).isRequired,
  customClass: PropTypes.string,
  visible: PropTypes.bool
}

PopinFixed.defaultProps = {
  customClass: '',
  visible: true
}
