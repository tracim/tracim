import React from 'react'
import PropTypes from 'prop-types'
import {
  ROLE_LIST,
  AgendaInfo,
  ConfirmPopup,
  IconButton,
  Popover,
  SingleChoiceList
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'
import SpaceDescription from './SpaceDescription.jsx'

export const SpaceAdvancedConfiguration = (props) => {
  return (
    <div className='workspace_advanced-content'>
      <SpaceDescription
        apiUrl={props.apiUrl}
        onClickSubmit={props.onClickSubmit}
        // End of required props ///////////////////////////////////////////////////////////////////
        customColor={props.customColor}
        description={props.description}
        isReadOnlyMode={props.isReadOnlyMode}
        lang={props.lang}
        memberList={props.memberList}
        roleList={props.roleList}
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

export default translate()(SpaceAdvancedConfiguration)

SpaceAdvancedConfiguration.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onClickSubmit: PropTypes.func.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  agendaUrl: PropTypes.string,
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  description: PropTypes.string,
  isAppAgendaAvailable: PropTypes.bool,
  isCurrentSpaceAgendaEnabled: PropTypes.bool,
  isReadOnlyMode: PropTypes.bool,
  lang: PropTypes.string,
  memberList: PropTypes.array,
  roleList: PropTypes.array
}

SpaceAdvancedConfiguration.defaultProps = {
  agendaUrl: '',
  codeLanguageList: [],
  customColor: '',
  description: '',
  isAppAgendaAvailable: false,
  isCurrentSpaceAgendaEnabled: false,
  isReadOnlyMode: true,
  lang: 'en',
  memberList: [],
  roleList: []
}
