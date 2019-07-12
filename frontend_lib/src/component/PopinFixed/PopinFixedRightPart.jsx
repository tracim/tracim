import React from 'react'
import classnames from 'classnames'

class PopinFixedRightPart extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentChildren: 'timeline'
    }
  }

  handleRightChildren = (newCurrentChildren) => {
    this.setState({currentChildren: newCurrentChildren})
  }

  render () {
    const { props } = this

    return (
          <div className={classnames('wsContentGeneric__content__right', `${props.customClass}__content__right`, 'd-flex')}>
            <div
              className={classnames(`${props.customClass}__header`, 'wsContentGeneric__content__right__header nav')} >
              {props.menuItemList.map(menuItem =>
                <button
                  className={classnames('wsContentGeneric__content__right__header__icon nav-item iconBtn m-0', {'active': menuItem.id === this.state.currentChildren})}
                  title={menuItem.label}
                  onClick={() => this.handleRightChildren(menuItem.id)}
                >
                  <i className={`fa fa-fw ${menuItem.icon}`} />
                </button>
              )}
              <div className='wsContentGeneric__content__right__header__icon__close mb-3 mt-auto'
                onClick={props.toggleRightPart}>
                <i className={classnames('fa fa-fw', {'fa-angle-double-right': props.rightPartOpen, 'fa-angle-double-left': !props.rightPartOpen})} />
              </div>
            </div>
            {props.menuItemList.map(menuItem =>
              menuItem.id === this.state.currentChildren && menuItem.children
            )}
          </div>
      )
  }
}

export default PopinFixedRightPart
