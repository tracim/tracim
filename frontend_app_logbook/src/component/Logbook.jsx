import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'

import {
  APP_FEATURE_MODE,
  IconButton,
  handleFetchResult,
  // CardPopup,
  Loading,
  PromptMessage,
  RefreshWarningMessage,
  postNewEmptyContent,
  putEditContent,
  getLogbookChildEntries,
  getFileContent,
  Icon
} from 'tracim_frontend_lib'

import LogbookEntryEditor from "./LogbookEntryEditor.jsx";

export const LOGBOOK_STATE = {
  INIT: 'init',
  LOADING: 'loading',
  LOADED: 'loaded',
  SAVING: 'saving',
  ERROR: 'error'
}

const LogbookEntry = (props) => {
  const [entry, setEntry] = useState(props.entry)

  useEffect(() => {
    const effect = async () => {
      const fetchFileContent = await handleFetchResult(
        await getFileContent(
          props.config.apiUrl,
          props.entry.workspace_id,
          props.entry.content_id
        )
      )

      if (!fetchFileContent.apiResponse.ok) return
      setEntry(fetchFileContent.body)
    }
    effect()
  }, [props.entry])

  // TODO add title to icon
  return (
    <div className='logbook__wrapper__timeline__entries__entry'>
      <div className='logbook__wrapper__timeline__entries__entry__dot' />
      <div className='logbook__wrapper__timeline__entries__entry__arrow' />
      <div className='logbook__wrapper__timeline__entries__entry__data'>
        <h4>{entry.label}</h4>
        <span className='logbook__wrapper__timeline__entries__entry__data__date'>
          <Icon
            icon='fas fa-clock'
          />
          {entry.created}
        </span>
        <p>{entry.raw_content}</p>
      </div>
    </div>
  )
}

export class Logbook extends React.Component {
  constructor (props) {
    super(props)

    const justCreated = props.content.current_revision_type === 'creation'

    this.state = {
      logbook: { entries: [] },
      logbookInitiallyLoaded: false,
      logbookState: justCreated ? LOGBOOK_STATE.LOADED : LOGBOOK_STATE.INIT
     // logbookAddEntry: false
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
        logbook: newLogbook
      })
    }
  }

  async componentDidUpdate (prevProps) {
    const { props } = this
    if (
      (props.content.current_revision_id !== prevProps.content.current_revision_id) ||
      (props.isNewContentRevision && prevProps.isNewContentRevision !== props.isNewContentRevision)
    ) {
      this.loadLogbookContent()
    }
  }

  async loadLogbookContent () {
    this.setState({ logbookState: LOGBOOK_STATE.LOADING })
    const { props } = this

    const fetchFileChildContent = await handleFetchResult(
      await getLogbookChildEntries(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id
      )
    )

    if (fetchFileChildContent.apiResponse.ok) {
      this.setState({
        logbookState: LOGBOOK_STATE.LOADED,
        logbookInitiallyLoaded: true,
        logbook: { entries: fetchFileChildContent.body.items.sort((a, b) => new Date(b.created) - new Date(a.created)) }
      })
    } else {
      this.setState({ logbookState: LOGBOOK_STATE.ERROR })
    }
  }

  // handleShowPopIn () {
  //  this.setState({ logbookAddEntry: true })
  // }

  // handleHidePopIn () {
  //  this.setState({ logbookAddEntry: false })
  // }

  async handleNewEntry (entry) {
    const { props } = this

    this.handleHidePopIn()
    const newEmptyContent = await handleFetchResult(
      await postNewEmptyContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        'logbook-entry',
        entry.title
      )
    )
    if (!newEmptyContent.apiResponse.ok) {
      this.setState({ logbookState: LOGBOOK_STATE.ERROR })
      return
    }

    const newEntry = newEmptyContent.body
    const updatedContent = await handleFetchResult(
      await putEditContent(
        props.config.apiUrl,
        props.content.workspace_id,
        newEntry.content_id,
        'file',
        entry.title,
        entry.description
      )
    )

    if (!updatedContent.apiResponse.ok) {
      this.setState({ logbookState: LOGBOOK_STATE.ERROR })
      return
    }

    console.log(updatedContent)
    this.loadLogbookContent()
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
        <div className={"logbook__wrapper"}>
          {changesAllowed && (
            <LogbookEntryEditor
              apiUrl={props.config.apiUrl}
              onValidate={(entry) => this.handleNewEntry(entry)}
              // onCancel={() => this.handleHidePopIn()}
              // End of required props ///////////////////////////////////////
              codeLanguageList={props.config.system.config.ui__notes__code_sample_languages}
              customColor={props.config.hexcolor}
              language={props.language}
            />
          )}
          <div
            className={classnames('logbook__wrapper__timeline', {
              hidden: state.logbookState === LOGBOOK_STATE.INIT
            })}
          >
            {state.logbook.entries.length >= 1
              ? (
                <>
                  <div className='logbook__wrapper__timeline__bar' />
                  <div className='logbook__wrapper__timeline__entries'>
                    {state.logbook.entries.map((entry, i) =>
                      <LogbookEntry key={i} entry={entry} config={props.config} />
                    )}
                  </div>
                </>
              )
              : (<h2>{props.t('No entry yet')}</h2>)}
          </div>
        </div>
      </div>
    )
  }
}

//           {state.logbookAddEntry && changesAllowed && (
//             <CardPopup
//               customClass={classnames('logbook__LogbookPopup', { hidden: state.logbookState !== LOGBOOK_STATE.LOADED })}
//               customColor={props.config.hexcolor}
//               faIcon='far fa-id-card'
//               label={props.t('New entry')}
//               onClose={() => this.handleHidePopIn()}
//             >
//               <LogbookEntryEditor
//                 apiUrl={props.config.apiUrl}
//                 onValidate={(entry) => this.handleNewEntry(entry)}
//                 onCancel={() => this.handleHidePopIn()}
//                 // End of required props ///////////////////////////////////////
//                 codeLanguageList={props.config.system.config.ui__notes__code_sample_languages}
//                 customColor={props.config.hexcolor}
//                 language={props.language}
//               />
//             </CardPopup>
//           )}

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
