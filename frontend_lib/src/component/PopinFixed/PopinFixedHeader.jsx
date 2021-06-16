import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { ROLE } from '../../helper.js'
import DropdownMenu from '../DropdownMenu/DropdownMenu.jsx'
import IconButton from '../Button/IconButton.jsx'

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

  // handleContentDeletedOrRestored = data => {
  //   const { state } = this
  //   const isTlmAboutCurrentContent = data.fields.content.content_id === state.content.content_id
  //   const isTlmAboutCurrentContentChildren = data.fields.content.parent_id === state.content.content_id

  //   if (!isTlmAboutCurrentContent && !isTlmAboutCurrentContentChildren) return

  //   if (isTlmAboutCurrentContent) {
  //     const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
  //     this.setState(prev =>
  //       ({
  //         content: clientToken === data.fields.client_token
  //           ? { ...prev.content, ...data.fields.content }
  //           : { ...prev.content, number: getCurrentContentVersionNumber(prev.mode, prev.content, prev.timeline) },
  //         newContent: {
  //           ...prev.content,
  //           ...data.fields.content
  //         },
  //         editionAuthor: data.fields.author.public_name,
  //         showRefreshWarning: clientToken !== data.fields.client_token,
  //         mode: clientToken === data.fields.client_token ? APP_FEATURE_MODE.VIEW : prev.mode,
  //         timeline: addRevisionFromTLM(data.fields, prev.timeline, prev.loggedUser.lang, clientToken === data.fields.client_token),
  //         isLastTimelineItemCurrentToken: data.fields.client_token === this.sessionClientToken
  //       })
  //     )
  //     return
  //   }

  //   if (isTlmAboutCurrentContentChildren) {
  //     this.handleContentCommentDeleted(data)
  //   }
  // }

  render () {
    const { customClass, customColor, faIcon, rawTitle, componentTitle, userRoleIdInWorkspace, onClickCloseBtn, disableChangeTitle, showChangeTitleButton, t, actionList } = this.props
    const { state } = this

    return (
      <div className={classnames('wsContentGeneric__header', `${customClass}__header`)} style={{ backgroundColor: customColor }}>
        <div className={classnames('wsContentGeneric__header__icon', `${customClass}__header__icon`)}>
          <i className={`${faIcon}`} title={rawTitle} />
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

        {actionList && actionList.length > 0 &&
          <DropdownMenu
            buttonCustomClass='timedEvent__top'
            // buttonClick={props.onEventClicked} // eslint-disable-line
            buttonIcon='fa-fw fas fa-ellipsis-v'
            buttonTooltip={t('Actions')}
          >
            {actionList.map((action) =>
              action.downloadLink
              ? <a
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
              : <IconButton
                icon={action.icon}
                text={action.label}
                label={action.label}
                key={action.label}
                onClick={action.onClick}
                customClass='transparentButton'
                showAction={action.showAction}
              />
            )}

            {/* Ici check si il ya les droits */}
            {/* <IconButton
              icon={action.icon}
              text={action.label}
              label={action.label}
              key={action.label}
              onClick={action.onClick}
              customClass='transparentButton'
              showAction={action.showAction}
            /> */}
            {/* end */}
            {/* <AppContentRightMenu
              apiUrl={state.config.apiUrl}
              content={state.content}
              appMode={state.mode}
              loggedUser={state.loggedUser}
              hexcolor={state.config.hexcolor}
              onClickArchive={this.handleClickArchive}
              onClickDelete={this.handleClickDelete}
            /> */}
          </DropdownMenu>}

        {userRoleIdInWorkspace >= ROLE.contributor.id && state.editTitle &&
          <button
            className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle iconBtn`)}
            onClick={this.handleClickUndoChangeTitleBtn}
            disabled={disableChangeTitle}
          >
            <i className='fas fa-undo' title={t('Undo change in title')} />
          </button>}

        {userRoleIdInWorkspace >= ROLE.contributor.id && showChangeTitleButton &&
          <button
            className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle iconBtn`)}
            onClick={this.handleClickChangeTitleBtn}
            disabled={disableChangeTitle}
          >
            {state.editTitle
              ? <i className='fas fa-check' title={t('Validate the title')} />
              : <i className='fas fa-pencil-alt' title={t('Edit title')} />}
          </button>}

        {this.props.children}

        <div
          className={classnames('wsContentGeneric__header__close', `${customClass}__header__close iconBtn`)}
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
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  rawTitle: PropTypes.string,
  componentTitle: PropTypes.element,
  userRoleIdInWorkspace: PropTypes.number,
  onValidateChangeTitle: PropTypes.func,
  disableChangeTitle: PropTypes.bool,
  showChangeTitleButton: PropTypes.bool,
  actionList: PropTypes.array
}

PopinFixedHeader.defaultProps = {
  customClass: '',
  customColor: '',
  rawTitle: '',
  componentTitle: <div />,
  userRoleIdInWorkspace: ROLE.reader.id,
  onChangeTitle: () => {},
  disableChangeTitle: false,
  showChangeTitleButton: true,
  actionList: []
}
