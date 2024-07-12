import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { v4 as uuidv4 } from 'uuid'

import {
  APP_FEATURE_MODE,
  IconButton,
  handleFetchResult,
  putRawFileContent,
  getRawFileContent,
  CardPopup,
  Loading,
  PromptMessage,
  RefreshWarningMessage,
  sendGlobalFlashMessage,
  ConfirmPopup
} from 'tracim_frontend_lib'

import { LOGBOOK_MIME_TYPE, LOGBOOK_FILE_EXTENSION } from '../helper.js'
import LogbookEntry from './LogbookEntry.jsx'
import LogbookEntryEditor from './LogbookEntryEditor.jsx'

export const heightBeforeSeeMoreButton = 251

export const DESCRIPTION_BUTTON = {
  HIDDEN: 'hidden',
  SEE_MORE: 'seeMore',
  SEE_LESS: 'seeLess'
}

export const LOGBOOK_STATE = {
  INIT: 'init',
  LOADING: 'loading',
  LOADED: 'loaded',
  SAVING: 'saving',
  ERROR: 'error'
}

const addEntryToLogbook = (logbook, newEntry) => {
  newEntry.id = uuidv4()
  logbook.entries.push(newEntry)
  return logbook
}

const replaceEntryInLogbook = (logbook, newEntry) => {
  logbook.entries = logbook.entries.map(entry => entry.id === newEntry.id ? newEntry : entry)
  return logbook
}

const removeEntryFromLogbook = (logbook, entryToRemove) => {
  logbook.entries = logbook.entries.filter(entry => entry.id !== entryToRemove.id)
  return logbook
}

export class Logbook extends React.Component {
  constructor (props) {
    super(props)

    const justCreated = props.content.current_revision_type === 'creation'

    this.state = {
      logbook: { entries: [] },
      logbookState: justCreated ? LOGBOOK_STATE.LOADED : LOGBOOK_STATE.INIT,
      entryToEdit: {},
      showConfirmPopup: false,
      saveRequired: false,
      showEditPopIn: false
    }
  }

  componentDidMount () {
    const { props } = this
    if (props.isNewContentRevision) this.loadLogbookContent()

    if (props.content.current_revision_type === 'creation') {
      const newLogbook = { entries: [] }
      this.setState({
        logbookState: LOGBOOK_STATE.LOADED,
        logbookInitiallyLoaded: true,
        saveRequired: true,
        logbook: newLogbook
      })
    }
  }

  async componentDidUpdate (prevProps) {
    const { state, props } = this
    if (
      (props.content.current_revision_id !== prevProps.content.current_revision_id) ||
      (props.isNewContentRevision && prevProps.isNewContentRevision !== props.isNewContentRevision)
    ) {
      this.loadLogbookContent()
    }

    if (state.saveRequired) {
      this.save(state.logbook)
      this.setState({ saveRequired: false })
    }
  }

  mapedEntriesWithOldExpand = (entries) => {
    const newEntries = []
    entries.forEach((e) => {
      const oldEntry = this.state.logbook.entries.filter((entry) => entry.id === e.id)
      if (oldEntry.length === 0) {
        newEntries.push({
          ...e,
          expand: DESCRIPTION_BUTTON.HIDDEN
        })
      } else {
        newEntries.push({
          ...e,
          expand: oldEntry[0].expand
        })
      }
    })
    return newEntries
  }

  async loadLogbookContent () {
    this.setState({ logbookState: LOGBOOK_STATE.LOADING })
    const { props } = this

    try {
      const fetchRawFileContent = await handleFetchResult(
        await getRawFileContent(
          props.config.apiUrl,
          props.content.workspace_id,
          props.content.content_id,
          props.content.current_revision_id,
          props.content.label + LOGBOOK_FILE_EXTENSION
        ),
        true
      )

      if (fetchRawFileContent.apiResponse.ok && fetchRawFileContent.body.entries) {
        const logbook = fetchRawFileContent.body
        const newlogbook = {
          ...logbook,
          entries: this.mapedEntriesWithOldExpand(logbook.entries)
        }
        this.setState({
          logbookState: LOGBOOK_STATE.LOADED,
          logbookInitiallyLoaded: true,
          logbook: newlogbook
        })
      } else {
        console.error(fetchRawFileContent)
        this.setState({ logbookState: LOGBOOK_STATE.ERROR })
      }
    } catch (e) {
      console.error(e)
      this.setState({ logbookState: LOGBOOK_STATE.ERROR })
    }
  }

  handleShowPopIn = (entry) => {
    this.setState({
      entryToEdit: entry,
      showEditPopIn: true
    })
  }

  handleHidePopIn = () => {
    this.setState({
      entryToEdit: {},
      showEditPopIn: false
    })
  }

  handleAddOrEditEntry = (entry) => {
    this.setState(prevState => {
      const newLogbook = entry.id
        ? replaceEntryInLogbook(prevState.logbook, entry)
        : addEntryToLogbook(prevState.logbook, entry)
      return {
        showEditPopIn: false,
        logbookState: LOGBOOK_STATE.SAVING,
        saveRequired: true,
        logbook: newLogbook
      }
    })
  }

  handleConfirmRemoveEntry = (entry) => {
    this.setState(prevState => {
      const newLogbook = removeEntryFromLogbook(prevState.logbook, entry)
      return {
        entryToRemove: null,
        showConfirmPopup: false,
        logbookState: LOGBOOK_STATE.SAVING,
        saveRequired: true,
        logbook: newLogbook
      }
    })
  }

  handleCloseConfirmPopup = () => {
    this.setState({
      entryToRemove: null,
      showConfirmPopup: false
    })
  }

  handleRemoveEntry = (entry) => {
    this.setState({
      entryToRemove: entry,
      showConfirmPopup: true
    })
  }

  handleExpand = (entry) => {
    if (entry !== undefined) {
      this.setState(prevState => {
        const newLogbook = {
          ...prevState.logbook,
          entries: prevState.logbook.entries.map(e => e.id === entry.id ? { ...e, expand: DESCRIPTION_BUTTON.SEE_LESS } : e)
        }
        return {
          logbook: newLogbook
        }
      })
    }
  }

  handleCollapse = (entry) => {
    if (entry !== undefined) {
      this.setState(prevState => {
        const newLogbook = {
          ...prevState.logbook,
          entries: prevState.logbook.entries.map(e => e.id === entry.id ? { ...e, expand: DESCRIPTION_BUTTON.SEE_MORE } : e)
        }
        return {
          logbook: newLogbook
        }
      })
    }
  }

  handleHidden = (entry) => {
    if (entry !== undefined) {
      this.setState(prevState => {
        const newLogbook = {
          ...prevState.logbook,
          entries: prevState.logbook.entries.map(e => e.id === entry.id ? { ...e, expand: DESCRIPTION_BUTTON.HIDDEN } : e)
        }
        return {
          logbook: newLogbook
        }
      })
    }
  }

  handleExpandAll = () => {
    const newExpand = DESCRIPTION_BUTTON.SEE_LESS
    this.setState(prevState => {
      const newLogbook = {
        ...prevState.logbook,
        entries: prevState.logbook.entries.map(e => e.expand !== DESCRIPTION_BUTTON.HIDDEN ? { ...e, expand: newExpand } : e)
      }
      return {
        logbook: newLogbook
      }
    })
  }

  handleCollapseAll = () => {
    const newExpand = DESCRIPTION_BUTTON.SEE_MORE
    this.setState(prevState => {
      const newLogbook = {
        ...prevState.logbook,
        entries: prevState.logbook.entries.map(e => e.expand !== DESCRIPTION_BUTTON.HIDDEN ? { ...e, expand: newExpand } : e)
      }
      return {
        logbook: newLogbook
      }
    })
  }

  async save (newLogbook) {
    const { props } = this
    const sortedLogbook = { entries: newLogbook.entries.toSorted((a, b) => new Date(b.datetime) - new Date(a.datetime)) }

    const fetchResultSaveLogbook = await handleFetchResult(
      await putRawFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        props.content.label + LOGBOOK_FILE_EXTENSION,
        JSON.stringify(sortedLogbook),
        LOGBOOK_MIME_TYPE
      )
    )

    if (!fetchResultSaveLogbook.ok) {
      switch (fetchResultSaveLogbook.body.code) {
        case 2044:
          sendGlobalFlashMessage(props.t('You must change the status or restore this logbook before any change'))
          break
        default:
          sendGlobalFlashMessage(props.t('Error while saving the new version'))
          break
      }
    }
  }

  render () {
    const { props, state } = this
    const changesAllowed = !props.readOnly && state.logbookState === LOGBOOK_STATE.LOADED

    return (
      <div className={classnames('logbook__contentpage__wrapper', { fullscreen: props.fullscreen })}>
        {props.content.is_deleted && (
          <PromptMessage
            msg={props.t('This content is deleted')}
            btnType='button'
            btnIcon='fas fa-trash-restore'
            icon='far fa-trash-alt'
            btnLabel={props.t('Restore')}
            onClickBtn={props.onClickRestoreDeleted}
          />
        )}
        <div className='logbook__contentpage__wrapper__options'>
          {props.mode === APP_FEATURE_MODE.REVISION && (
            <IconButton
              customClass='wsContentGeneric__option__menu__lastversion'
              color={props.config.hexcolor}
              intent='primary'
              mode='light'
              onClick={props.onClickLastVersion}
              icon='fas fa-history'
              text={props.t('Last version')}
            />
          )}
          {props.isRefreshNeeded && (
            <RefreshWarningMessage
              tooltip={props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
              onClickRefresh={props.onClickRefresh}
            />
          )}
        </div>

        <div className='logbook__contentpage__wrapper__toolbar'>
          {props.fullscreen && (
            <IconButton
              icon='fas fa-compress-arrows-alt'
              title={props.t('Exit fullscreen mode')}
              onClick={props.onClickFullscreen}
            />
          )}
        </div>
        {state.logbookState === LOGBOOK_STATE.INIT && <Loading />}
        {state.logbookState === LOGBOOK_STATE.ERROR && <span> {props.t('Error while loading the logbook.')} </span>}
        <>
          <div
            className={classnames('logbook__contentpage__wrapper__logbook', 'logbook__wrapper', {
              hidden: state.logbookState === LOGBOOK_STATE.INIT
            })}
          >
            <div>
              {(state.logbook.entries.filter(e => e.expand !== DESCRIPTION_BUTTON.HIDDEN).length >= 1) && (
                <>
                  <IconButton
                    customClass={classnames('btn-link', 'logbook__expand_button')}
                    text={props.t('Expand all')}
                    textMobile={props.t('Expand all')}
                    title={props.t('Expand all event descriptions')}
                    onClick={() => this.handleExpandAll()}
                  />
                  <IconButton
                    customClass={classnames('btn-link', 'logbook__expand_button')}
                    text={props.t('Collapse all')}
                    textMobile={props.t('Collapse all')}
                    title={props.t('Collapse all event descriptions')}
                    onClick={() => this.handleCollapseAll()}
                  />
                </>
              )}
              {changesAllowed && (
                <IconButton
                  customClass='logbook__new_button'
                  text={props.t('Create an event')}
                  textMobile={props.t('Create an event')}
                  icon='fas fa-plus'
                  onClick={() => this.handleShowPopIn({})}
                />
              )}
            </div>
            <div className='logbook__timeline'>
              {state.logbook.entries.length >= 1
                ? (
                  <>
                    <div className='logbook__timeline__bar' />
                    <div className='logbook__timeline__entries'>
                      {state.logbook.entries.toSorted((a, b) => new Date(b.datetime) - new Date(a.datetime)).map((entry, id) =>
                        <LogbookEntry
                          customColor={props.config.hexcolor}
                          readOnly={!changesAllowed}
                          hideButtonsWhenReadOnly={props.readOnly}
                          entry={entry}
                          onEditEntry={this.handleShowPopIn}
                          onRemoveEntry={this.handleRemoveEntry}
                          key={id}
                          language={props.language}
                          onExpand={this.handleExpand}
                          onCollapse={this.handleCollapse}
                          onHidden={this.handleHidden}
                        />
                      )}
                    </div>
                  </>
                )
                : (<h2>{props.t('No event yet')}</h2>)}
            </div>
          </div>
          {state.showEditPopIn && (
            <CardPopup
              customClass={classnames('logbook__LogbookPopup', { hidden: state.logbookState !== LOGBOOK_STATE.LOADED })}
              customColor={props.config.hexcolor}
              faIcon='far fa-id-card'
              label={state.entryToEdit.id ? props.t('Editing event') : props.t('New event')}
              onClose={this.handleHidePopIn}
            >
              <LogbookEntryEditor
                apiUrl={props.config.apiUrl}
                entry={state.entryToEdit}
                onValidate={this.handleAddOrEditEntry}
                onCancel={this.handleHidePopIn}
                // End of required props ///////////////////////////////////////
                codeLanguageList={props.config.system.config.ui__notes__code_sample_languages}
                customColor={props.config.hexcolor}
                language={props.language}
              />
            </CardPopup>
          )}
        </>
        {state.showConfirmPopup && (
          <ConfirmPopup
            onCancel={this.handleCloseConfirmPopup}
            onConfirm={() => this.handleConfirmRemoveEntry(state.entryToRemove)}
            confirmLabel={props.t('Delete')}
            customClass='logbook__LogbookPopup'
            customColor={props.config.hexcolor}
            confirmIcon='far fa-fw fa-trash-alt'
          />
        )}
      </div>
    )
  }
}

Logbook.propTypes = {
  config: PropTypes.object.isRequired,
  content: PropTypes.object.isRequired,
  // End of required props /////////////////////////////////////////////////////
  language: PropTypes.string,
  readOnly: PropTypes.bool
}

Logbook.defaultProps = {
  language: 'en',
  readOnly: false
}

export default translate()(Logbook)
