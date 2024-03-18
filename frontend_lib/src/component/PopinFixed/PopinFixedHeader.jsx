import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  PAGE,
  ROLE
} from '../../helper.js'
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs.jsx'
import DropdownMenu from '../DropdownMenu/DropdownMenu.jsx'
import IconButton from '../Button/IconButton.jsx'
import Icon from '../Icon/Icon.jsx'
import EmojiReactions from '../../container/EmojiReactions.jsx'
import FavoriteButton from '../Button/FavoriteButton.jsx'
import Popover from '../Popover/Popover.jsx'

export const PopinFixedHeader = (props) => {
  const [editTitle, setEditTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState(props.rawTitle)

  useEffect(() => {
    setEditTitleValue(props.rawTitle)
  }, [props.rawTitle])

  const handleChangeTitle = (event) => {
    const newTitle = event.target.value
    setEditTitleValue(newTitle)
  }

  const handleClickChangeTitleButton = () => {
    if (editTitle) {
      props.onValidateChangeTitle(editTitleValue)
      setEditTitle(!editTitle)
    } else {
      setEditTitle(!editTitle)
      setEditTitleValue(props.rawTitle)
    }
  }

  const handleClickChangeMarkedTemplate = () => {
    props.onClickChangeMarkedTemplate(!props.isTemplate)
  }

  const handleClickUndoChangeTitleButton = () => {
    setEditTitle(false)
    setEditTitleValue(props.rawTitle)
  }

  const handleInputKeyPress = (event) => {
    switch (event.key) {
      case 'Enter':
        handleClickChangeTitleButton()
        break
      case 'Escape':
        handleClickUndoChangeTitleButton()
        break
      default:
        break
    }
  }

  const {
    customClass,
    customColor,
    headerButtons,
    faIcon,
    rawTitle,
    componentTitle,
    userRoleIdInWorkspace,
    onClickCloseBtn,
    disableChangeTitle,
    showChangeTitleButton,
    t,
    actionList,
    apiUrl,
    content,
    favoriteState,
    loggedUser,
    onClickAddToFavoriteList,
    onClickRemoveFromFavoriteList,
    showReactions
  } = props

  const actionListWithEditTitle = [
    {
      icon: 'fas fa-pencil-alt',
      label: props.t('Edit title'),
      onClick: handleClickChangeTitleButton,
      showAction: userRoleIdInWorkspace >= ROLE.contributor.id && showChangeTitleButton && !editTitle,
      disabled: disableChangeTitle,
      dataCy: 'popinListItem__editTitle'
    },
    {
      icon: props.isTemplate ? 'fas fa-paste' : 'fas fa-clipboard',
      label: props.isTemplate ? props.t('Unmark template') : props.t('Mark template'),
      onClick: handleClickChangeMarkedTemplate,
      showAction: (userRoleIdInWorkspace >= ROLE.contributor.id) && props.showMarkedAsTemplate,
      disabled: props.disableChangeIsTemplate
    },
    ...actionList
  ]
  const filteredActionList = actionListWithEditTitle.filter(action => action.showAction)
  const filteredHeaderButtons = headerButtons ? headerButtons.filter(action => action.showAction) : []

  return (
    <div className={editTitle
      ? classnames('wsContentGeneric__header', `${customClass}__header__isEditing`, 'wsContentGeneric__header__isEditing') : classnames('wsContentGeneric__header', `${customClass}__header`)}
    >
      <div className='wsContentGeneric__header__titleWithBreadcrumbs'>
        <div className='wsContentGeneric__header__titleWrapper'>
          <div className={classnames('wsContentGeneric__header__icon', `${customClass}__header__icon`)}>
            <i className={`fa-fw ${faIcon}`} title={rawTitle} style={{ color: customColor }} />
          </div>
          {props.loading ? <Icon icon='fas fa-spin fa-spinner' title={props.t('Loading…')} /> : (
            <>
              <div
                className={classnames('wsContentGeneric__header__title', `${customClass}__header__title`)}
                id={`wsContentGeneric__header__title_${content.content_id}`}
              >
                {editTitle
                  ? (
                    <input
                      className='wsContentGeneric__header__title__editiontitle editiontitle'
                      value={editTitleValue}
                      onChange={handleChangeTitle}
                      onKeyDown={handleInputKeyPress}
                      autoFocus
                    />
                  )
                  : componentTitle}
              </div>
              <Popover
                targetId={`wsContentGeneric__header__title_${content.content_id}`}
                popoverBody={rawTitle}
              />

              {userRoleIdInWorkspace >= ROLE.contributor.id && editTitle && (
                <button
                  className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle transparentButton`)}
                  onClick={handleClickUndoChangeTitleButton}
                  disabled={disableChangeTitle}
                >
                  <i className='fa-fw fas fa-undo' title={t('Undo change in title')} />
                </button>
              )}

              {userRoleIdInWorkspace >= ROLE.contributor.id && showChangeTitleButton && editTitle && (
                <button
                  className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle transparentButton`)}
                  onClick={handleClickChangeTitleButton}
                  disabled={disableChangeTitle}
                >
                  <i className='fa-fw fas fa-check' title={t('Validate the title')} />
                </button>
              )}
            </>
          )}
        </div>

        <Breadcrumbs
          hidden={props.loading || !props.breadcrumbsList.length}
          root={{
            link: PAGE.HOME,
            label: '',
            icon: 'fa-fw fas fa-home',
            type: BREADCRUMBS_TYPE.CORE,
            isALink: true
          }}
          breadcrumbsList={props.breadcrumbsList}
        />
      </div>

      {!props.loading && showReactions && (
        <div className='wsContentGeneric__header__reactions'>
          <EmojiReactions
            apiUrl={apiUrl}
            loggedUser={loggedUser}
            contentId={content.content_id}
            workspaceId={content.workspace_id}
          />
        </div>
      )}

      {!props.loading && favoriteState && (
        <FavoriteButton
          favoriteState={favoriteState}
          onClickAddToFavoriteList={onClickAddToFavoriteList}
          onClickRemoveFromFavoriteList={onClickRemoveFromFavoriteList}
        />
      )}

      {!props.loading && filteredHeaderButtons.map((action) => {
        return action.isLink
          ? (
            <Link
              aria-disabled={action.disabled}
              className={classnames(
                'iconbutton-secondary iconbutton headerBtn headerBtn__link',
                { headerBtn__link__disabled: action.disabled }
              )}
              data-cy={action.dataCy}
              key={action.label}
              title={action.label}
              to={{
                pathname: action.link,
                search: `?${action.mode}`
              }}
            >
              <i className={`fa-fw ${action.icon} iconbutton__icon`} />
              <span className='iconbutton__text_with_icon iconbutton__label'>{action.label}</span>
            </Link>
          ) : (
            <IconButton
              disabled={action.disabled}
              icon={action.icon}
              text={action.label}
              label={action.label}
              key={action.label}
              onClick={action.onClick} // eslint-disable-line react/jsx-handler-names
              customClass='transparentButton headerBtn'
              showAction={action.showAction}
              dataCy={action.dataCy}
            />
          )
      })}

      {!props.loading && props.children}

      {!props.loading && filteredActionList.length > 0 && (
        <DropdownMenu
          buttonCustomClass='wsContentGeneric__header__actions'
          buttonIcon='fa-fw fas fa-ellipsis-v'
          buttonTooltip={t('Actions')}
          buttonDataCy='dropdownContentButton'
        >
          {filteredActionList.map((action) => action.downloadLink
            ? (
              <a
                href={action.downloadLink}
                target='_blank'
                rel='noopener noreferrer'
                download
                title={action.label}
                key={action.label}
                data-cy={action.dataCy}
              >
                <i className={`fa-fw fa-fw ${action.icon}`} />
                {action.label}
              </a>
            ) : (
              <IconButton
                disabled={action.disabled}
                icon={action.icon}
                text={action.label}
                textMobile={action.label}
                label={action.label}
                key={action.label}
                onClick={action.onClick} // eslint-disable-line react/jsx-handler-names
                customClass={classnames('transparentButton', { dropdownMenuSeparatorLine: action.separatorLine })}
                showAction={action.showAction}
                dataCy={action.dataCy}
              />
            ))}
        </DropdownMenu>
      )}

      <div
        className={classnames('wsContentGeneric__header__close', `${customClass}__header__close`)}
        onClick={onClickCloseBtn}
        data-cy='popinFixed__header__button__close'
        title={t('Close')}
      >
        <i className='fa-fw fas fa-times' />
      </div>
    </div>
  )
}

export default translate()(PopinFixedHeader)

PopinFixedHeader.propTypes = {
  actionList: PropTypes.array,
  apiUrl: PropTypes.string,
  breadcrumbsList: PropTypes.array,
  componentTitle: PropTypes.element,
  content: PropTypes.object,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  disableChangeIsTemplate: PropTypes.bool,
  disableChangeTitle: PropTypes.bool,
  faIcon: PropTypes.string.isRequired,
  favoriteState: PropTypes.string,
  headerButtons: PropTypes.array,
  isTemplate: PropTypes.bool,
  loading: PropTypes.bool,
  loggedUser: PropTypes.object,
  onClickAddToFavoriteList: PropTypes.func,
  onClickChangeMarkedTemplate: PropTypes.func,
  onClickCloseBtn: PropTypes.func.isRequired,
  onClickRemoveFromFavoriteList: PropTypes.func,
  onValidateChangeTitle: PropTypes.func,
  rawTitle: PropTypes.string,
  showChangeTitleButton: PropTypes.bool,
  showMarkedAsTemplate: PropTypes.bool,
  showReactions: PropTypes.bool,
  userRoleIdInWorkspace: PropTypes.number
}

PopinFixedHeader.defaultProps = {
  actionList: [],
  apiUrl: '',
  breadcrumbsList: [],
  componentTitle: <div />,
  content: {
    content_id: 0,
    workspace_id: 0
  },
  customClass: '',
  customColor: '',
  disableChangeIsTemplate: false,
  disableChangeTitle: false,
  favoriteState: '',
  headerButtons: [],
  isTemplate: false,
  loading: false,
  loggedUser: {},
  onChangeTitle: () => { },
  onClickAddToFavoriteList: () => { },
  onClickChangeMarkedTemplate: () => { },
  onClickRemoveFromFavoriteList: () => { },
  rawTitle: '',
  showChangeTitleButton: true,
  showMarkedAsTemplate: false,
  showReactions: false,
  userRoleIdInWorkspace: ROLE.reader.id
}
