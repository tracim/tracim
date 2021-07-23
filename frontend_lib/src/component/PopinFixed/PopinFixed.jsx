import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import PopinFixedHeader from './PopinFixedHeader.jsx'
import PopinFixedContent from './PopinFixedContent.jsx'
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
    const isSidebarVisible = !document.querySelector('.sidebarclose')
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
  // from http://www.mattzabriskie.com/blog/react-validating-children
  children: PropTypes.oneOfType([
    PropTypes.arrayOf((children, key, componentName /* , location, propFullName */) => {
      if (
        children.length > 2 ||
        children[0].type !== PopinFixedHeader ||
        children[1].type !== PopinFixedContent
      ) {
        return new Error(`PropType Error: childrens of ${componentName} must be: 1 PopinFixedHeader and 1 PopinFixedContent.`)
      }
    }),
    PropTypes.element
  ]).isRequired,
  customClass: PropTypes.string,
  visible: PropTypes.bool
}

PopinFixed.defaultProps = {
  customClass: '',
  visible: true
}
