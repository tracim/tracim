import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { Popover, PopoverBody } from 'reactstrap'
import { isMobile } from 'react-device-detect'

import { BREADCRUMBS_TYPE, PAGE } from '../../helper.js'
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs.jsx'

require('./PageTitle.styl')

export class PageTitle extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverSpaceTitleOpen: false
    }
  }

  handleTogglePopoverSpaceTitle = () => {
    this.setState(prevState => ({
      popoverSpaceTitleOpen: !prevState.popoverSpaceTitleOpen
    }))
  }

  render () {
    const { props } = this

    const title = props.t('Home')

    const breadcrumbsRoot = {
      link: PAGE.HOME,
      label: title,
      icon: 'home',
      type: BREADCRUMBS_TYPE.CORE,
      isALink: true
    }

    return (
      <div className={classnames(props.parentClass, props.customClass, 'pageTitleGeneric')}>
        <div
          className={classnames(`${props.parentClass}__title`, 'pageTitleGeneric__title')}
          data-cy='layoutPageTitle'
        >
          <div className='pageTitleGeneric__title__icon' title={props.iconTooltip}>
            <i className={`fas fa-fw fa-${props.icon}`} />
          </div>

          <div className='pageTitleGeneric__title__label' id='popoverSpaceTitle'>
            {props.title}
          </div>
          <Popover
            placement='bottom'
            isOpen={this.state.popoverSpaceTitleOpen}
            target='popoverSpaceTitle'
            // INFO - GB - 2020-11-06 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
            toggle={this.handleTogglePopoverSpaceTitle} // eslint-disable-line react/jsx-handler-names
            trigger={isMobile ? 'focus' : 'hover'}
          >
            <PopoverBody>
              {props.title}
            </PopoverBody>
          </Popover>
        </div>

        {(props.breadcrumbsList.length > 0
          ? <Breadcrumbs root={breadcrumbsRoot} breadcrumbsList={props.breadcrumbsList} />
          : <div />
        )}

        {props.subtitle.length > 0 && (
          <div
            className={classnames(`${props.parentClass}__subtitle`, 'pageTitleGeneric__subtitle')}
            data-cy='layoutPageSubTitle'
          >
            {props.subtitle}
          </div>
        )}

        {props.children}
      </div>
    )
  }
}
export default translate()(PageTitle)

PageTitle.propTypes = {
  breadcrumbsList: PropTypes.array.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  subtitle: PropTypes.string,
  parentClass: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string,
  iconTooltip: PropTypes.string
}

PageTitle.defaultProps = {
  parentClass: '',
  customClass: '',
  icon: '',
  subtitle: '',
  iconTooltip: ''
}
