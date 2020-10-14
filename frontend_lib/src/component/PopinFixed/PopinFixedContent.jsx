import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

class PopinFixedContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      rightPartOpen: true
    }
  }

  handleToggleRightPart = () => {
    if (window.innerWidth < 1200) return

    this.setState(prev => ({ rightPartOpen: !prev.rightPartOpen }))
  }

  render () {
    return this.props.children.length === 2
      ? (
        <div className={classnames(
          'wsContentGeneric__content',
          `${this.props.customClass}__content`,
          { rightPartOpen: this.state.rightPartOpen, rightPartClose: !this.state.rightPartOpen }
        )}
        >
          <div className={classnames('wsContentGeneric__content__left', `${this.props.customClass}__content__left`)}>
            {this.props.children[0]}
          </div>

          {React.cloneElement(this.props.children[1], {
            handleToggleRightPart: this.handleToggleRightPart,
            rightPartOpen: this.state.rightPartOpen
          })}
        </div>
      )
      : (
        <div className={classnames('wsContentGeneric__content', `${this.props.customClass}__content`)}>
          {this.props.children}
        </div>
      )
  }
}

export default PopinFixedContent

PopinFixedContent.propTypes = {
  customClass: PropTypes.string,
  children: (props, propName, componentName) => {
    if (Array.isArray(props) && props.length !== 2) {
      return new Error(`PropType Error: ${componentName} must have 1 or 2 children.`)
    } else if (typeof props !== 'object') {
      return new Error(`PropType Error: childrens of ${componentName} must have 1 or 2 children.`)
    }
  }
}
