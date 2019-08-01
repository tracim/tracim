import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

class PopinFixedRightPart extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentChildren: props.menuItemList[0].id
    }
  }

  handleChangeRightChildren = (newCurrentChildren) => {
    const { props } = this
    if (!props.rightPartOpen) props.toggleRightPart()

    this.setState({ currentChildren: newCurrentChildren })
  }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('wsContentGeneric__content__right', `${props.customClass}__content__right`, 'd-flex')}>
        <div
          className={classnames(`${props.customClass}__header`, 'wsContentGeneric__content__right__header nav')} 
        >
          {props.menuItemList.map(menuItem =>
            <button
              className={classnames('iconBtn wsContentGeneric__content__right__header__icon nav-item', { 'active': menuItem.id === state.currentChildren })}
              title={menuItem.label}
              onClick={() => this.handleChangeRightChildren(menuItem.id)}
              style={{ borderColor: props.customColor }}
            >
              <i className={`fa fa-fw ${menuItem.icon}`} />
            </button>
          )}

          <div 
            className='wsContentGeneric__content__right__header__icon__close'
            onClick={props.toggleRightPart}
          >
            <i className={classnames('fa fa-fw', { 'fa-angle-double-right': props.rightPartOpen, 'fa-angle-double-left': !props.rightPartOpen })} />
          </div>
        </div>

        {(props.menuItemList.find(menuItem => menuItem.id === state.currentChildren) || { children: null }).children}
      </div>
    )
  }
}

export default PopinFixedRightPart

PopinFixedRightPart.propTypes = {
  menuItemList: PropTypes.arrayOf((menuItem, key, componentName) => {
    if (menuItem.length < 1) {
      return new Error(`PropType Error: ${componentName} must have at least 1 children.`)
    }
  }).isRequired,
  toggleRightPart: PropTypes.func.isRequired,
  rightPartOpen: PropTypes.bool.isRequired,
  customClass: PropTypes.string
}

PopinFixedRightPart.defaultProps = {
  customClass: ''
}
