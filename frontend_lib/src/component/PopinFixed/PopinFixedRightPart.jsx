import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

class PopinFixedRightPart extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentChildren: props.menuItemList[0].id
    }
  }

  handleChangeRightChildren = (newCurrentChildren) => {
    const { props } = this
    if (props.rightPartOpen) props.handleToggleRightPart()

    this.setState({ currentChildren: newCurrentChildren })
  }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('wsContentGeneric__content__right', `${props.customClass}__content__right`)}>
        <div
          className={classnames(`${props.customClass}__header`, 'wsContentGeneric__content__right__header nav')}
          onClick={props.handleToggleRightPart}
        >
          {props.menuItemList.map(menuItem => {
            const isMenuActive = menuItem.id === state.currentChildren

            return (
              <button
                key={menuItem.id}
                className={classnames('wsContentGeneric__content__right__header__icon nav-item', { active: isMenuActive })}
                title={menuItem.label}
                onClick={() => this.handleChangeRightChildren(menuItem.id)}
                style={{ borderColor: isMenuActive ? props.customColor : 'transparent' }}
                data-cy={`popin_right_part_${menuItem.id}`}
              >
                <i className={`fas fa-fw ${menuItem.icon}`} />
              </button>
            )
          })}

          <div
            className='wsContentGeneric__content__right__header__icon__close'
            title={props.rightPartOpen ? props.t('Hide') : props.t('Show')}
          >
            <i className={classnames('fas fa-fw', { 'fa-chevron-right': props.rightPartOpen, 'fa-chevron-left': !props.rightPartOpen })} />
          </div>
        </div>

        {(props.menuItemList.find(menuItem => menuItem.id === state.currentChildren) || { children: null }).children}
      </div>
    )
  }
}

export default translate()(PopinFixedRightPart)

PopinFixedRightPart.propTypes = {
  menuItemList: PropTypes.arrayOf((menuItem, key, componentName) => {
    if (menuItem.length < 1) {
      return new Error(`PropType Error: ${componentName} must have at least 1 children.`)
    }
  }).isRequired,
  handleToggleRightPart: PropTypes.func.isRequired,
  rightPartOpen: PropTypes.bool.isRequired,
  customClass: PropTypes.string
}

PopinFixedRightPart.defaultProps = {
  customClass: ''
}
