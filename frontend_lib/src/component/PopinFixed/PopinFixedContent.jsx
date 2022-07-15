import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import SelectStatus from '../Input/SelectStatus/SelectStatus.jsx'
import {
  APP_FEATURE_MODE,
  ROLE
} from '../../helper.js'
import TranslateButton from '../Button/TranslateButton.jsx'
import PopinFixedHeader from './PopinFixedHeader.jsx'
import { TRANSLATION_STATE } from '../../translation.js'
import Loading from '../Loading/Loading.jsx'

class PopinFixedContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      rightPartOpen: true
    }
  }

  handleToggleRightPart = () => {
    if (window.innerWidth < 1200) return

    this.setState(prev => ({ rightPartOpen: !prev.rightPartOpen }))
  }

  render () {
    const { props } = this

    return props.children.length === 2
      ? (
        <div className={classnames(
          'wsContentGeneric__content',
          `${props.customClass}__content`,
          { rightPartOpen: this.state.rightPartOpen, rightPartClose: !this.state.rightPartOpen }
        )}
        >
          <div className={classnames('wsContentGeneric__content__left', `${props.customClass}__content__left`)}>
            <PopinFixedHeader
              actionList={props.actionList}
              apiUrl={props.config.apiUrl}
              breadcrumbsList={props.breadcrumbsList}
              componentTitle={props.componentTitle}
              content={props.content}
              customClass={props.customClass}
              customColor={props.config.hexcolor}
              disableChangeIsTemplate={props.disableChangeIsTemplate}
              disableChangeTitle={props.disableChangeTitle}
              faIcon={props.config.faIcon}
              favoriteState={props.favoriteState}
              headerButtons={props.headerButtons}
              isTemplate={props.isTemplate}
              onClickAddToFavoriteList={props.onClickAddToFavoriteList}
              onClickChangeMarkedTemplate={props.onClickChangeMarkedTemplate}
              onClickCloseBtn={props.onClickCloseBtn}
              onClickRemoveFromFavoriteList={props.onClickRemoveFromFavoriteList}
              onValidateChangeTitle={props.onValidateChangeTitle}
              loading={props.loading}
              loggedUser={props.loggedUser}
              rawTitle={props.content.label}
              showChangeTitleButton={props.showChangeTitleButton}
              showMarkedAsTemplate={props.showMarkedAsTemplate}
              showReactions={props.showReactions}
              userRoleIdInWorkspace={props.loggedUser.userRoleIdInWorkspace}
            />
            <div className={classnames('wsContentGeneric__content__left__top', `${props.customClass}__content__left__top`)}>
              {!props.loading && (
                <>
                  {props.showTranslateButton && (
                    <div className='html-document__contentpage__textnote__top'>
                      <TranslateButton
                        translationState={props.translationState}
                        targetLanguageList={props.translationTargetLanguageList}
                        targetLanguageCode={props.translationTargetLanguageCode}
                        onChangeTargetLanguageCode={languageCode => {
                          props.onChangeTranslationTargetLanguageCode(languageCode)
                          props.onClickTranslateDocument(languageCode)
                        }}
                        onClickTranslate={props.onClickTranslateDocument}
                        onClickRestore={props.onClickRestoreDocument}
                        dataCy='htmlDocumentTranslateButton'
                      />
                    </div>
                  )}

                  {props.lastVersion &&
                   (props.appMode === APP_FEATURE_MODE.VIEW || props.appMode === APP_FEATURE_MODE.REVISION) &&
                   (
                     <div
                       className={classnames(
                         'wsContentGeneric__content__left__top__version',
                         `${props.customClass}__content__left__top__version`
                       )}
                     >
                       {props.t(
                         'Version #{{versionNumber}}', {
                           versionNumber: props.appMode === APP_FEATURE_MODE.VIEW && !props.isRefreshNeeded
                             ? props.lastVersion
                             : props.contentVersionNumber
                         }
                       )}
                       {(props.appMode === APP_FEATURE_MODE.REVISION || props.isRefreshNeeded) && (
                         <div
                           className={classnames(
                             'wsContentGeneric__content__left__top__lastversion',
                             `${props.customClass}__content__left__top__lastversion`
                           )}
                         >
                           ({props.t('latest version: {{versionNumber}}', { versionNumber: props.lastVersion })})
                         </div>
                       )}
                       &nbsp;-&nbsp;
                     </div>
                   )}

                  {props.availableStatuses.length > 0 && props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                    <SelectStatus
                      selectedStatus={props.availableStatuses.find(s => s.slug === props.content.status)}
                      availableStatus={props.availableStatuses}
                      onChangeStatus={props.onChangeStatus}
                      disabled={props.appMode === APP_FEATURE_MODE.REVISION || props.content.is_archived || props.content.is_deleted}
                    />
                  )}
                </>
              )}
            </div>
            {props.loading ? <Loading /> : props.children[0]}
          </div>

          {React.cloneElement(props.children[1], {
            handleToggleRightPart: this.handleToggleRightPart,
            rightPartOpen: this.state.rightPartOpen
          })}
        </div>
      )
      : (
        props.loading
          ? <Loading />
          : (
            <div className={classnames('wsContentGeneric__content', `${props.customClass}__content`)}>
              {props.children}
            </div>
          )
      )
  }
}

export default translate()(PopinFixedContent)

PopinFixedContent.propTypes = {
  loading: PropTypes.bool,
  actionList: PropTypes.array,
  appMode: PropTypes.string,
  availableStatuses: PropTypes.array,
  breadcrumbsList: PropTypes.array,
  componentTitle: PropTypes.node,
  config: PropTypes.object,
  content: PropTypes.object,
  customClass: PropTypes.string,
  children: (props, propName, componentName) => {
    if (Array.isArray(props) && props.length !== 2) {
      return new Error(`PropType Error: ${componentName} must have 1 or 2 children.`)
    } else if (typeof props !== 'object') {
      return new Error(`PropType Error: childrens of ${componentName} must have 1 or 2 children.`)
    }
  },
  disableChangeTitle: PropTypes.bool,
  headerButtons: PropTypes.array,
  favoriteState: PropTypes.string,
  isRefreshNeeded: PropTypes.bool,
  isTemplate: PropTypes.bool,
  lastVersion: PropTypes.number,
  loggedUser: PropTypes.object,
  onChangeStatus: PropTypes.func,
  onChangeTranslationTargetLanguageCode: PropTypes.func,
  onClickAddToFavoriteList: PropTypes.func,
  onClickChangeMarkedTemplate: PropTypes.func,
  onClickCloseBtn: PropTypes.func,
  onClickRemoveFromFavoriteList: PropTypes.func,
  onClickRestoreDocument: PropTypes.func,
  onClickTranslateDocument: PropTypes.func,
  onValidateChangeTitle: PropTypes.func,
  showChangeTitleButton: PropTypes.bool,
  showMarkedAsTemplate: PropTypes.bool,
  showReactions: PropTypes.bool,
  showTranslateButton: PropTypes.bool,
  contentVersionNumber: PropTypes.number,
  translationTargetLanguageList: PropTypes.arrayOf(PropTypes.object),
  translationTargetLanguageCode: PropTypes.string,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE))
}

PopinFixedContent.defaultProps = {
  actionList: [],
  appMode: APP_FEATURE_MODE.VIEW,
  availableStatuses: [],
  breadcrumbsList: [],
  componentTitle: <div />,
  config: {
    hexcolor: '',
    faIcon: '',
    apiUrl: ''
  },
  content: {
    is_archived: false,
    is_deleted: false,
    status: ''
  },
  contentVersionNumber: 0,
  customClass: '',
  disableChangeTitle: false,
  favoriteState: '',
  headerButtons: [],
  isRefreshNeeded: false,
  isTemplate: false,
  loading: false,
  loggedUser: {
    userRoleIdInWorkspace: 0
  },
  lastVersion: 0,
  onChangeStatus: () => {},
  onClickAddToFavoriteList: () => {},
  onClickChangeMarkedTemplate: () => {},
  onClickCloseBtn: () => {},
  onClickRemoveFromFavoriteList: () => {},
  onValidateChangeTitle: () => {},
  showChangeTitleButton: true,
  showMarkedAsTemplate: false,
  showReactions: false,
  showTranslateButton: false
}
