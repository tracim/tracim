import React from 'react'
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
import EmojiReactions from '../../container/EmojiReactions.jsx'
import FavoriteButton from '../Button/FavoriteButton.jsx'

class PopinFixedHeader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      editTitle: false,
      editTitleValue: props.rawTitle
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.rawTitle !== this.props.rawTitle) this.setState({ editTitleValue: this.props.rawTitle })
  }

  handleChangeTitle = e => {
    const newTitle = e.target.value
    this.setState({ editTitleValue: newTitle })
  }

  handleClickChangeTitleBtn = () => {
    const { props, state } = this
    if (state.editTitle) {
      props.onValidateChangeTitle(state.editTitleValue)
      this.setState(prevState => ({ editTitle: !prevState.editTitle }))
      return
    }

    this.setState(prevState => ({
      editTitle: !prevState.editTitle,
      editTitleValue: props.rawTitle
    }))
  }

  handleClickUndoChangeTitleBtn = () => {
    this.setState({
      editTitle: false,
      editTitleValue: this.props.rawTitle
    })
  }

  handleInputKeyPress = e => {
    switch (e.key) {
      case 'Enter': this.handleClickChangeTitleBtn(); break
      case 'Escape': this.handleClickUndoChangeTitleBtn(); break
    }
  }

  render () {
    const { state, props } = this
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
        onClick: this.handleClickChangeTitleBtn,
        showAction: userRoleIdInWorkspace >= ROLE.contributor.id && showChangeTitleButton && !state.editTitle,
        disabled: disableChangeTitle,
        dataCy: 'popinListItem__editTitle'
      },
      ...actionList
    ]
    const filteredActionList = actionListWithEditTitle.filter(action => action.showAction)
    const filteredHeaderButtons = headerButtons ? headerButtons.filter(action => action.showAction) : []

    return (
      <div className={classnames('wsContentGeneric__header', `${customClass}__header`)}>
        <div className='wsContentGeneric__header__titleWithBreadcrumbs'>
          <div className='wsContentGeneric__header__titleWrapper'>
            <div className={classnames('wsContentGeneric__header__icon', `${customClass}__header__icon`)}>
              <i className={`${faIcon}`} title={rawTitle} style={{ color: customColor }} />
            </div>

            <div
              className={classnames('wsContentGeneric__header__title', `${customClass}__header__title`)}
              title={rawTitle}
            >
              {state.editTitle
                ? (
                  <input
                    className='wsContentGeneric__header__title__editiontitle editiontitle'
                    value={state.editTitleValue}
                    onChange={this.handleChangeTitle}
                    onKeyDown={this.handleInputKeyPress}
                    autoFocus
                  />
                )
                : componentTitle}
            </div>
            {userRoleIdInWorkspace >= ROLE.contributor.id && state.editTitle && (
              <button
                className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle transparentButton`)}
                onClick={this.handleClickUndoChangeTitleBtn}
                disabled={disableChangeTitle}
              >
                <i className='fas fa-undo' title={t('Undo change in title')} />
              </button>
            )}

            {userRoleIdInWorkspace >= ROLE.contributor.id && showChangeTitleButton && state.editTitle && (
              <button
                className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle transparentButton`)}
                onClick={this.handleClickChangeTitleBtn}
                disabled={disableChangeTitle}
              >
                <i className='fas fa-check' title={t('Validate the title')} />
              </button>
            )}
          </div>

          {props.breadcrumbsList.length > 0 && (
            <Breadcrumbs
              root={{
                link: PAGE.HOME,
                label: '',
                icon: 'fas fa-home',
                type: BREADCRUMBS_TYPE.CORE,
                isALink: true
              }}
              breadcrumbsList={props.breadcrumbsList}
            />
          )}
        </div>

        {showReactions && (
          <div className='wsContentGeneric__header__reactions'>
            <EmojiReactions
              apiUrl={apiUrl}
              loggedUser={loggedUser}
              contentId={content.content_id}
              workspaceId={content.workspace_id}
            />
          </div>
        )}

        {favoriteState && (
          <FavoriteButton
            favoriteState={favoriteState}
            onClickAddToFavoriteList={onClickAddToFavoriteList}
            onClickRemoveFromFavoriteList={onClickRemoveFromFavoriteList}
          />
        )}

        {filteredHeaderButtons.map((action) =>
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
        )}

        {props.children}

        {filteredActionList.length > 0 && (
          <DropdownMenu
            buttonCustomClass='wsContentGeneric__header__actions'
            buttonIcon='fas fa-ellipsis-v'
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
                >
                  <i className={`fa-fw ${action.icon}`} />
                  {action.label}
                </a>
              ) : (
                <IconButton
                  disabled={action.disabled}
                  icon={action.icon}
                  text={action.label}
                  label={action.label}
                  key={action.label}
                  onClick={action.onClick} // eslint-disable-line react/jsx-handler-names
                  customClass='transparentButton'
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
          <i className='fas fa-times' />
        </div>
      </div>
    )
  }
}

export default translate()(PopinFixedHeader)

PopinFixedHeader.propTypes = {
  faIcon: PropTypes.string.isRequired,
  onClickCloseBtn: PropTypes.func.isRequired,
  breadcrumbsList: PropTypes.array,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  headerButtons: PropTypes.array,
  rawTitle: PropTypes.string,
  componentTitle: PropTypes.element,
  userRoleIdInWorkspace: PropTypes.number,
  onValidateChangeTitle: PropTypes.func,
  disableChangeTitle: PropTypes.bool,
  showChangeTitleButton: PropTypes.bool,
  actionList: PropTypes.array,
  apiUrl: PropTypes.string,
  content: PropTypes.object,
  favoriteState: PropTypes.string,
  loggedUser: PropTypes.object,
  onClickAddToFavoriteList: PropTypes.func,
  onClickRemoveFromFavoriteList: PropTypes.func,
  showReactions: PropTypes.bool
}

PopinFixedHeader.defaultProps = {
  breadcrumbsList: [],
  customClass: '',
  customColor: '',
  headerButtons: [],
  rawTitle: '',
  componentTitle: <div />,
  userRoleIdInWorkspace: ROLE.reader.id,
  onChangeTitle: () => { },
  disableChangeTitle: false,
  showChangeTitleButton: true,
  actionList: [],
  apiUrl: '',
  content: {
    content_id: 0,
    workspace_id: 0
  },
  favoriteState: '',
  loggedUser: {},
  onClickAddToFavoriteList: () => { },
  onClickRemoveFromFavoriteList: () => { },
  showReactions: false
}
