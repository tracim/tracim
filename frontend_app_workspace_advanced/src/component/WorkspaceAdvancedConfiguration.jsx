import React from 'react'
import Radium from 'radium'
import PropTypes from 'prop-types'
import {
  AgendaInfo,
  tinymceRemove,
  AutoComplete,
  BtnSwitch,
  ConfirmPopup,
  Popover,
  ROLE_LIST,
  SingleChoiceList
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

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
        <div className='workspace_advanced__description formBlock'>
          <div className='formBlock__title workspace_advanced__description__title '>
            {props.t('Description')}
          </div>
          {props.isReadOnlyMode
            ? <div dangerouslySetInnerHTML={{ __html: props.description }} />
            : (
              <div>
                <div className='formBlock__field workspace_advanced__description__text '>
                  <textarea
                    id={props.textareaId}
                    className='workspace_advanced__description__text__textarea'
                    placeholder={props.t("Space's description")}
                    value={props.description}
                    onChange={props.onChangeDescription}
                    rows='3'
                  />
                </div>
                {props.isAutoCompleteActivated && props.autoCompleteItemList.length > 0 && (
                  <AutoComplete
                    apiUrl={props.apiUrl}
                    autoCompleteItemList={props.autoCompleteItemList}
                    autoCompleteCursorPosition={props.autoCompleteCursorPosition}
                    onClickAutoCompleteItem={props.onClickAutoCompleteItem}
                    delimiterIndex={props.autoCompleteItemList.filter(item => item.isCommon).length - 1}
                  />
                )}

                <div className='workspace_advanced__description__bottom'>
                  <button
                    type='button'
                    className='workspace_advanced__description__bottom__btn btn highlightBtn'
                    onClick={props.onClickValidateNewDescription}
                    style={{ backgroundColor: props.customColor }}
                  >
                    {props.t('Confirm')}
                  </button>
                </div>
              </div>
            )}
        </div>

        {!props.isReadOnlyMode && (
          <div>
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
                <button
                  type='button'
                  className='workspace_advanced__defaultRole__bottom__btn btn outlineTextBtn primaryColorFont primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                  onClick={props.onClickValidateNewDefaultRole}
                >
                  {props.t('Confirm')}
                </button>
              </div>
            </div>

            {props.isAppAgendaAvailable && props.isCurrentSpaceAgendaEnabled && (
              <AgendaInfo
                customClass='formBlock workspace_advanced__agenda'
                introText={props.t('Use this link to integrate this agenda to your')}
                caldavText={props.t('CalDAV compatible software')}
                agendaUrl={props.agendaUrl}
              />
            )}

            <div className='formBlock workspace_advanced__delete'>
              <div className='formBlock__title workspace_advanced__delete__title'>
                {props.t('Delete space')}
              </div>

              <div className='formBlock__field workspace_advanced__delete__content'>
                <button
                  className='btn outlineTextBtn primaryColorBorder primaryColorFontDarkenHover primaryColorFont nohover'
                  onClick={props.onClickDeleteWorkspaceBtn}
                >
                  {props.t('Delete')}
                </button>

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

            <div
              className='workspace_advanced__functionality'
              style={{ display: 'none' }}
            // Côme - 2018/09/10 - hide this div until webdav and/or visioconf is activated
            >
              <div className='workspace_advanced__functionality__title'>
                Liste des fonctionnalités
              </div>

              <div className='workspace_advanced__functionality__text'>
                Liste des fonctionnalités présentes sur Tracim que vous pouvez désactiver :
              </div>

              <ul className='workspace_advanced__functionality__list'>
                <li className='workspace_advanced__functionality__list__item'>
                  <div className='item__text'>
                    Calendrier de l'espace de travail :
                  </div>
                  <div className='item__btnswitch'>
                    <BtnSwitch />
                  </div>
                </li>

                <li className='workspace_advanced__functionality__list__item'>
                  <div className='item__text'>
                    Visioconférence :
                  </div>
                  <div className='item__btnswitch'>
                    <BtnSwitch />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default translate()(Radium(WorkspaceAdvancedConfiguration))

WorkspaceAdvancedConfiguration.propTypes = {
  agendaUrl: PropTypes.string,
  description: PropTypes.string,
  lang: PropTypes.string,
  isReadOnlyMode: PropTypes.bool,
  isAppAgendaAvailable: PropTypes.bool,
  isCurrentSpaceAgendaEnabled: PropTypes.bool
}

WorkspaceAdvancedConfiguration.defaultProps = {
  agendaUrl: '',
  description: '',
  lang: '',
  isReadOnlyMode: true,
  isAppAgendaAvailable: false,
  isCurrentSpaceAgendaEnabled: false
}
