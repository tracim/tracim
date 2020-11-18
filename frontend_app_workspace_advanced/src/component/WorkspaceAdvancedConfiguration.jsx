import React from 'react'
import Radium from 'radium'
import {
  BtnSwitch,
  ConfirmPopup,
  ROLE_LIST,
  SingleChoiceList
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import { isMobile } from 'react-device-detect'

export class WorkspaceAdvancedConfiguration extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverDefaultRoleInfoOpen: false
    }
  }

  handleTogglePopoverDefaultRoleInfo = () => {
    this.setState(prev => ({ popoverDefaultRoleInfoOpen: !prev.popoverDefaultRoleInfoOpen }))
  }

  render () {
    const { props, state } = this

    return (
      <div className='workspace_advanced-content'>
        <div className='workspace_advanced__description formBlock'>
          <div className='formBlock__title workspace_advanced__description__title '>
            {props.t('Description')}
          </div>

          <div className='formBlock__field workspace_advanced__description__text '>
            <textarea
              className='workspace_advanced__description__text__textarea'
              placeholder={props.t("Space's description")}
              value={props.description}
              onChange={props.onChangeDescription}
              rows='3'
            />
          </div>

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

        <div className='workspace_advanced__defaultRole formBlock'>
          <div className='formBlock__title'>
            {props.t('Default role:')}
            <button
              type='button'
              className='btn transparentButton workspace_advanced__defaultRole__info'
              id='popoverDefaultRoleInfo'
            >
              <i className='fa fa-fw fa-question-circle' />
            </button>

            <Popover
              placement='bottom'
              isOpen={state.popoverDefaultRoleInfoOpen}
              target='popoverDefaultRoleInfo'
              // INFO - GB - 2020-11-16 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
              toggle={this.handleTogglePopoverDefaultRoleInfo} // eslint-disable-line react/jsx-handler-names
              trigger={isMobile ? 'focus' : 'hover'}
            >
              <PopoverBody>
                {props.t('This is the role that members will have by default when they join your space.')}
              </PopoverBody>
            </Popover>
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
    )
  }
}

export default translate()(Radium(WorkspaceAdvancedConfiguration))
