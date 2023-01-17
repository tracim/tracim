import React from 'react'
import Radium from 'radium'
import PropTypes from 'prop-types'
import {
  AgendaInfo,
  ConfirmPopup,
  IconButton,
  Popover,
  ROLE_LIST,
  SingleChoiceList,
  tinymceRemove
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'
import SpaceDescription from './SpaceDescription.jsx'

export class WorkspaceAdvancedConfiguration extends React.Component {
  componentDidMount () {
    this.updateWysiwyg()
  }

  updateWysiwyg () {
    const { props } = this
    if (!props.isReadOnlyMode) {
      globalThis.wysiwyg(
        `#${props.textareaId}`,
        props.lang,
        props.onChangeDescription,
        props.onTinyMceInput,
        props.onTinyMceKeyDown,
        props.onTinyMceKeyUp,
        props.onTinyMceSelectionChange
      )
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.lang !== prevProps.lang) {
      this.updateWysiwyg()
    }
  }

  componentWillUnmount () {
    const { props } = this
    if (!props.isReadOnlyMode) tinymceRemove(`#${props.textareaId}`)
  }

  render () {
    const { props } = this

    return (
      <div className='workspace_advanced-content'>
        <SpaceDescription
          apiUrl={props.apiUrl}
          autoCompleteCursorPosition={props.autoCompleteCursorPosition}
          autoCompleteItemList={props.autoCompleteItemList}
          customColor={props.customColor}
          description={props.description}
          isAutoCompleteActivated={props.isAutoCompleteActivated}
          isReadOnlyMode={props.isReadOnlyMode}
          lang={props.lang}
          onChangeDescription={props.onChangeDescription}
          onClickAutoCompleteItem={props.onClickAutoCompleteItem}
          onClickValidateNewDescription={props.onClickValidateNewDescription}
          onTinyMceInput={props.onTinyMceInput}
          onTinyMceKeyDown={props.onTinyMceKeyDown}
          onTinyMceKeyUp={props.onTinyMceKeyUp}
          onTinyMceSelectionChange={props.onTinyMceSelectionChange}
          textareaId={props.textareaId}
        />

        {!props.isReadOnlyMode && (
          <div className='workspace_advanced__defaultRole formBlock'>
            <div className='formBlock__title'>
              {props.t('Default role:')}
              <button
                type='button'
                className='btn transparentButton workspace_advanced__defaultRole__info'
                id='popoverDefaultRoleInfo'
              >
                <i className='fas fa-fw fa-question-circle' />
              </button>

              <Popover
                targetId='popoverDefaultRoleInfo'
                popoverBody={props.t('This is the role that members will have by default when they join your space (for open and on request spaces only).')}
              />
            </div>

            <div className='workspace_advanced__defaultRole__list'>
              <SingleChoiceList
                list={ROLE_LIST}
                onChange={props.onChangeNewDefaultRole}
                currentValue={props.defaultRole}
              />
            </div>

            <div className='workspace_advanced__defaultRole__bottom'>
              <IconButton
                customClass='workspace_advanced__defaultRole__bottom__btn'
                icon='fas fa-check'
                onClick={props.onClickValidateNewDefaultRole}
                text={props.t('Confirm')}
              />
            </div>
          </div>
        )}

        {props.isAppAgendaAvailable && props.isCurrentSpaceAgendaEnabled && (
          <AgendaInfo
            customClass='formBlock workspace_advanced__agenda'
            introText={props.t('Use this link to integrate this agenda to your')}
            caldavText={props.t('CalDAV compatible software')}
            agendaUrl={props.agendaUrl}
          />
        )}

        {!props.isReadOnlyMode && (
          <div className='formBlock workspace_advanced__delete'>
            <div className='formBlock__title workspace_advanced__delete__title'>
              {props.t('Delete space')}
            </div>

            <div className='formBlock__field workspace_advanced__delete__content'>
              <IconButton
                icon='far fa-trash-alt'
                onClick={props.onClickDeleteWorkspaceBtn}
                text={props.t('Delete')}
                textMobile={props.t('Delete')}
              />
              <div className='workspace_advanced__delete__content__warning' />
            </div>

            {(props.displayPopupValidateDeleteWorkspace &&
              <ConfirmPopup
                onConfirm={props.onClickValidatePopupDeleteWorkspace}
                onCancel={props.onClickClosePopupDeleteWorkspace}
                confirmLabel={props.t('Delete')}
                confirmIcon='far fa-fw fa-trash-alt'
              />
            )}
          </div>
        )}
      </div>
    )
  }
}

export default translate()(Radium(WorkspaceAdvancedConfiguration))

WorkspaceAdvancedConfiguration.propTypes = {
  agendaUrl: PropTypes.string,
  customColor: PropTypes.string,
  description: PropTypes.string,
  lang: PropTypes.string,
  isReadOnlyMode: PropTypes.bool,
  isAppAgendaAvailable: PropTypes.bool,
  isCurrentSpaceAgendaEnabled: PropTypes.bool
}

WorkspaceAdvancedConfiguration.defaultProps = {
  agendaUrl: '',
  customColor: '',
  description: '',
  lang: '',
  isReadOnlyMode: true,
  isAppAgendaAvailable: false,
  isCurrentSpaceAgendaEnabled: false
}
