import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { v4 as uuidv4 } from 'uuid'
import Board, {
  addColumn,
  removeColumn,
  moveColumn,
  changeColumn,
  addCard,
  changeCard,
  moveCard,
  removeCard
} from '@asseinfo/react-kanban'
import '@asseinfo/react-kanban/dist/styles.css'

import {
  APP_FEATURE_MODE,
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange,
  IconButton,
  handleFetchResult,
  putRawFileContent,
  getRawFileContent,
  CardPopup,
  PromptMessage,
  RefreshWarningMessage,
  sendGlobalFlashMessage
} from 'tracim_frontend_lib'

import { KANBAN_MIME_TYPE, KANBAN_FILE_EXTENSION } from '../helper.js'
import KanbanCard from './KanbanCard.jsx'
import KanbanCardEditor from './KanbanCardEditor.jsx'
import KanbanColumnEditor from './KanbanColumnEditor.jsx'
import KanbanColumnHeader from './KanbanColumnHeader.jsx'

const BOARD_STATE = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
}

class Kanban extends React.Component {
  constructor (props) {
    super(props)

    const justCreated = props.content.current_revision_type === 'creation'

    this.state = {
      autoCompleteCursorPosition: 0,
      autoCompleteItemList: [],
      board: { columns: [] },
      boardState: justCreated ? BOARD_STATE.LOADED : BOARD_STATE.LOADING,
      editedCardInfos: null,
      editedColumnInfos: null,
      isAutoCompleteActivated: false,
      saveRequired: false,
      saving: false
    }
  }

  componentDidMount () {
    const { props } = this
    if (props.isNewContentRevision) this.loadBoardContent()

    if (props.content.current_revision_type === 'creation') {
      this.setState({ boardState: BOARD_STATE.LOADED, board: { columns: [] } })
    }
  }

  async componentDidUpdate (prevProps) {
    const { props, state } = this
    if (
      (!state.saving && props.content.current_revision_id !== prevProps.content.current_revision_id) ||
      (props.isNewContentRevision && prevProps.isNewContentRevision !== props.isNewContentRevision)
    ) {
      this.loadBoardContent()
    }
    if (state.saveRequired) {
      this.setState({ saveRequired: false })
      await this.handleSave()
    }
  }

  async loadBoardContent () {
    this.setState({ boardState: BOARD_STATE.LOADING })
    const { props } = this

    const fetchRawFileContent = await handleFetchResult(
      await getRawFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        props.content.current_revision_id,
        props.content.label + KANBAN_FILE_EXTENSION
      ),
      true
    )

    if (fetchRawFileContent.apiResponse.ok && fetchRawFileContent.body.columns) {
      this.setState({
        boardState: BOARD_STATE.LOADED,
        board: fetchRawFileContent.body || {}
      })
    } else {
      this.setState({ boardState: BOARD_STATE.ERROR })
    }
  }

  handleEditCard = (card) => {
    this.setState({
      editedCardInfos: { card, focusOnDescription: false }
    })
  }

  handleEditCardContent = (card) => {
    this.setState({
      editedCardInfos: { card, focusOnDescription: true }
    })
  }

  handleRemoveCard = (card) => {
    this.setState(prevState => {
      const column = prevState.board.columns
        .find(column => column.cards
          .find(columnCard => columnCard.id === card.id))

      return {
        board: column ? removeCard(prevState.board, column, card) : prevState.board,
        saveRequired: true
      }
    })
  }

  handleAddCard = (column) => {
    this.setState({
      editedCardInfos: {
        card: {},
        column
      }
    })
  }

  handleCardEdited = (card) => {
    this.setState(prevState => ({
      editedCardInfos: null,
      board: card.id
        ? changeCard(prevState.board, card.id, card)
        : addCard(prevState.board, prevState.editedCardInfos.column, { ...card, id: uuidv4() }),
      saveRequired: true
    }))
  }

  handleEditColumn = (column) => {
    this.setState({
      editedColumnInfos: column
    })
  }

  handleColumnEdited = (column) => {
    const newColumn = {
      title: column.title,
      bgColor: column.bgColor,
      id: column.id || uuidv4()
    }
    this.setState(prevState => {
      return {
        editedColumnInfos: null,
        board: column.id
          ? changeColumn(prevState.board, column, newColumn)
          : addColumn(prevState.board, { ...newColumn, cards: [] }),
        saveRequired: true
      }
    })
  }

  handleColumnEditCancel = () => {
    this.setState({ editedColumnInfos: null })
  }

  async handleSave () {
    const { props, state } = this
    this.setState({ saving: true })
    const fetchResultSaveKanban = await handleFetchResult(
      await putRawFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        props.content.label + KANBAN_FILE_EXTENSION,
        JSON.stringify(state.board),
        KANBAN_MIME_TYPE
      )
    )

    if (!fetchResultSaveKanban.ok) {
      switch (fetchResultSaveKanban.body.code) {
        case 2044:
          sendGlobalFlashMessage(props.t('You must change the status or restore this kanban board before any change'))
          break
        default:
          sendGlobalFlashMessage(props.t('Error while saving the new version'))
          break
      }
    }
    this.setState({ saving: false })
  }

  handleRemoveColumn = (column) => {
    this.setState(prevState => {
      return {
        board: removeColumn(prevState.board, column),
        saveRequired: true
      }
    })
  }

  handleCardDragEnd = (card, from, to) => {
    this.setState(prevState => {
      return {
        board: moveCard(prevState.board, from, to),
        saveRequired: true
      }
    })
  }

  handleColumnDragEnd = (column, fromPosition, toPosition) => {
    this.setState(prevState => {
      return {
        board: moveColumn(prevState.board, fromPosition, toPosition),
        saveRequired: true
      }
    })
  }

  updateBoard (newBoard, dontSaveDraftToLocalStorage) {
    this.setState({
      board: newBoard,
      mustSave: !dontSaveDraftToLocalStorage
    })
  }

  handleColumnNew = (board, column) => {
    this.updateBoard(board)
    return column
  }

  handleCardEditCancel = () => {
    this.setState({ editedCardInfos: null })
  }

  handleTinyMceInput = (e, position) => {
    tinymceAutoCompleteHandleInput(
      e,
      this.setState.bind(this),
      this.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  handleTinyMceKeyUp = event => {
    const { state } = this

    tinymceAutoCompleteHandleKeyUp(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      this.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceKeyDown = event => {
    const { state } = this

    tinymceAutoCompleteHandleKeyDown(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      state.autoCompleteCursorPosition,
      state.autoCompleteItemList,
      this.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceSelectionChange = () => {
    tinymceAutoCompleteHandleSelectionChange(
      this.setState.bind(this),
      this.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('kanban__contentpage__wrapper', { fullscreen: props.fullscreen })}>
        {props.content.is_deleted && (
          <PromptMessage
            msg={props.t('This content is deleted')}
            btnType='button'
            icon='far fa-trash-alt'
            btnLabel={props.t('Restore')}
            onClickBtn={props.onClickRestoreDeleted}
          />
        )}
        <div className='kanban__contentpage__wrapper__options'>
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

        <div className='kanban__contentpage__wrapper__toolbar'>
          {props.fullscreen && (<span>{props.t('Board: {{label}}', { label: props.content.label })}</span>)}
          {props.fullscreen && (
            <IconButton
              icon='fas fa-arrows-alt'
              text={props.t('Fullscreen')}
              onClick={props.onClickFullscreen}
            /> // TODO GIULIA update style
          )}
        </div>
        {state.boardState === BOARD_STATE.LOADING && <span>{props.t('Loading, please wait…')}</span>}
        {state.boardState === BOARD_STATE.ERROR && <span> {props.t('Error while loading the board.')} </span>}
        {state.boardState === BOARD_STATE.LOADED && (
          <>
            <div className='kanban__contentpage__wrapper__board'>
              <Board
                allowAddColumn={!props.readOnly}
                allowRemoveColumn={!props.readOnly}
                allowRenameColumn={!props.readOnly}
                allowAddCar={!props.readOnly}
                allowRemoveCard={!props.readOnly}
                onCardDragEnd={this.handleCardDragEnd}
                onColumnDragEnd={this.handleColumnDragEnd}
                onColumnNew={this.handleColumnNew}
                onColumnRemove={this.handleRemoveColumn}
                onCardRemove={this.handleRemoveCard}
                onColumnRename={this.handleEditColumn}
                renderColumnAdder={() => (
                  <div
                    className='kanban__columnAdder'
                    onClick={this.handleEditColumn}
                  >
                    <i className='fa fas fa-fw fa-plus' />
                    <span>{props.t('Create new column')}</span>
                  </div>
                )}
                renderColumnHeader={column => (
                  <KanbanColumnHeader
                    customColor={props.config.hexcolor}
                    readOnly={props.readOnly}
                    column={column}
                    onEditColumn={this.handleEditColumn}
                    onAddCard={this.handleAddCard}
                    onRemoveColumn={this.handleRemoveColumn}
                  />
                )}
                renderCard={card => (
                  <KanbanCard
                    customColor={props.config.hexcolor}
                    readOnly={props.readOnly}
                    card={card}
                    onEditCard={this.handleEditCard}
                    onEditCardContent={this.handleEditCardContent}
                    onRemoveCard={this.handleRemoveCard}
                  />
                )}
              >
                {state.board}
              </Board>
            </div>
            {state.editedCardInfos && (
              <CardPopup
                customClass='kanban__KanbanPopup'
                customColor={props.config.hexcolor}
                faIcon='far fa-id-card'
                label={state.editedCardInfos.card.id ? props.t('Editing Card') : props.t('New Card')}
                onClose={this.handleCardEditCancel}
              >
                <KanbanCardEditor
                  apiUrl={props.config.apiUrl}
                  card={state.editedCardInfos.card}
                  customColor={props.config.hexcolor}
                  focusOnDescription={state.editedCardInfos.focusOnDescription}
                  onValidate={this.handleCardEdited}
                  onCancel={this.handleCardEditCancel}
                  isAutoCompleteActivated={state.isAutoCompleteActivated}
                  autoCompleteItemList={state.autoCompleteItemList}
                  autoCompleteCursorPosition={state.autoCompleteCursorPosition}
                  onClickAutoCompleteItem={(item) => {
                    tinymceAutoCompleteHandleClickItem(item, this.setState.bind(this))
                  }}
                />
              </CardPopup>
            )}
            {state.editedColumnInfos && (
              <CardPopup
                customClass='kanban__KanbanPopup'
                customColor={props.config.hexcolor}
                faIcon='far fa-id-card'
                label={state.editedColumnInfos.id ? props.t('Edit Column') : props.t('New Column')}
                onClose={this.handleColumnEditCancel}
              >
                <KanbanColumnEditor
                  column={state.editedColumnInfos}
                  customColor={props.config.hexcolor}
                  onValidate={this.handleColumnEdited}
                  onCancel={this.handleColumnEditCancel}
                />
              </CardPopup>
            )}
          </>
        )}
      </div>
    )
  }
}

Kanban.propTypes = {
  config: PropTypes.object.isRequired,
  content: PropTypes.object.isRequired,
  readOnly: PropTypes.bool
}

Kanban.defaultProps = {
  readOnly: false
}

export default translate()(Kanban)
