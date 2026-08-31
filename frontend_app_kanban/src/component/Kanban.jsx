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

import { applyPatch, createPatch } from 'rfc6902'

import {
  APP_FEATURE_MODE,
  IconButton,
  handleFetchResult,
  getRawFileContent,
  getPatchFileContent,
  patchPatchFileContent,
  CardPopup,
  Loading,
  PromptMessage,
  RefreshWarningMessage,
  sendGlobalFlashMessage,
  removeLocalStorageItem
} from 'tracim_frontend_lib'

import {
  KANBAN_MIME_TYPE,
  KANBAN_FILE_EXTENSION,
  KANBAN_DEFAULT_BACKGROUND_COLOR,
  isCardMatchFilter,
  localStorageFieldIdBuilder
} from '../helper.js'
import KanbanCard from './KanbanCard.jsx'
import KanbanCardEditor from './KanbanCardEditor.jsx'
import KanbanColumnEditor from './KanbanColumnEditor.jsx'
import KanbanColumnHeader from './KanbanColumnHeader.jsx'

const KANBAN_GET_URL_FILENAME = 'kanban' + KANBAN_FILE_EXTENSION

export const BOARD_STATE = {
  INIT: 'init',
  LOADING: 'loading',
  LOADED: 'loaded',
  SAVING: 'saving',
  ERROR: 'error'
}

export const PATCH_OPERATION = {
  ADD: 'add',
  COPY: 'copy',
  MOVE: 'move',
  REPLACE: 'replace',
  REMOVE: 'remove'
}

export class Kanban extends React.Component {
  regexMatchId = new RegExp('^/columns/([0-9]+)/cards/([0-9]+)/?')

  constructor (props) {
    super(props)

    const justCreated = props.content.current_revision_type === 'creation'

    this.state = {
      autoCompleteCursorPosition: 0,
      autoCompleteItemList: [],
      initialBoard: { columns: [] },
      board: { columns: [] },
      boardState: justCreated ? BOARD_STATE.LOADED : BOARD_STATE.INIT,
      editedCardInfos: null,
      editedCardWasModified: false,
      editedColumnInfos: null,
      patchingInProgress: false,
      saveInProgress: false,
      saveRequired: false,
      cardIdEdited: null,
      revisionId: null,
      isAutoCompleteActivated: false
    }
  }

  componentDidMount () {
    const { props } = this
    console.debug('%c<Kanban> component did mount', 'color: gold', props)
    if (props.isNewContentRevision) this.loadBoardContent()

    if (props.content.current_revision_type === 'creation') {
      const newBoard = { columns: [] }
      this.setState({
        boardState: BOARD_STATE.LOADED,
        boardInitiallyLoaded: true,
        saveRequired: true,
        board: newBoard
      })
    }
  }

  async componentDidUpdate (prevProps) {
    const { state, props } = this
    console.debug('%c<Kanban> component did update', 'color: gold', state, props, prevProps)

    if (props.mode === APP_FEATURE_MODE.REVISION) {
      if (props.isSelectedRevision && prevProps.selectedRevisionId !== props.selectedRevisionId) {
        this.loadBoardContent()
      }
    } else {
      if (state.saveRequired) {
        if (!state.saveInProgress) {
          this.setState({ saveInProgress: true }, () => {
            console.debug('%c<Kanban> saving in progress', 'color: gold', state.board, state.cardIdEdited)
            this.save(state.board, state.cardIdEdited)
          })
        }
      } else if (state.revisionId && state.revisionId < props.content.current_revision_id) {
        if (!state.patchingInProgress) {
          this.setState({ patchingInProgress: true }, () => {
            console.debug('%c<Kanban> updating board from patch', 'color: gold', props.content, state.revisionId)
            this.loadBoardFromPatch()
          })
        }
      } else if (!state.revisionId && state.boardState === BOARD_STATE.LOADED) {
        console.debug('%c<Kanban> reloading board', 'color: gold', state.revisionId, state.boardState)
        this.loadBoardContent()
      }
    }
  }

  async loadBoardFromPatch () {
    const { props, state } = this

    const fetchPatchFileContent = await handleFetchResult(
      await getPatchFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        KANBAN_GET_URL_FILENAME,
        state.revisionId,
        props.content.current_revision_id
      ),
      true
    )
    if (fetchPatchFileContent.apiResponse.ok && fetchPatchFileContent.body.patch_content) {
      const patchContent = fetchPatchFileContent.body.patch_content
      let editedCardWasModified = false

      console.debug('%c<Kanban> apply patch', 'color: gold', patchContent)
      const newBoard = JSON.parse(JSON.stringify(state.initialBoard))
      applyPatch(newBoard, patchContent)

      console.debug('%c<Kanban> check received patch', 'color: gold', patchContent)
      if (state.editedCardInfos?.card?.id) {
        patchContent.forEach((item) => {
          let matched

          switch (item.op) {
            case PATCH_OPERATION.COPY:
            case PATCH_OPERATION.MOVE:
              matched = item.from.match(this.regexMatchId)
              break
            default:
              matched = item.path.match(this.regexMatchId)
          }

          if (matched) {
            const x = parseInt(matched[1])
            const y = parseInt(matched[2])
            if (newBoard.columns[x].cards[y] && newBoard.columns[x].cards[y].id === state.editedCardInfos.card.id) {
              console.debug(
                '%c<Kanban> the modal is open and the edited card was modified',
                'color: gold',
                state.editedCardInfos.card.id
              )
              editedCardWasModified = true
            }
          }
        })
      }

      // Check if the content of the card was really modified
      if (editedCardWasModified) {
        const cardId = state.editedCardInfos.card.id
        const card = newBoard.columns.find(
          (column) => column.cards.find((card) => card.id === cardId)
        ).cards.find((card) => card.id === cardId)

        if (card === state.editedCardInfos.card || JSON.stringify(card) === JSON.stringify(state.editedCardInfos.card)) {
          editedCardWasModified = false
        }
      }

      this.setState({
        boardState: BOARD_STATE.LOADED,
        board: newBoard,
        editedCardWasModified: editedCardWasModified,
        initialBoard: newBoard,
        patchingInProgress: false,
        revisionId: props.content.current_revision_id,
        saveInProgress: false,
        saveRequired: false
      })
    } else {
      this.setState({ boardState: BOARD_STATE.ERROR })
    }
  }

  async loadBoardContent () {
    this.setState({ boardState: BOARD_STATE.LOADING })
    const { props } = this
    console.debug('%c<Kanban> load the full board', 'color: gold')

    try {
      const fetchRawFileContent = await handleFetchResult(
        await getRawFileContent(
          props.config.apiUrl,
          props.content.workspace_id,
          props.content.content_id,
          props.content.current_revision_id,
          KANBAN_GET_URL_FILENAME
        ),
        true
      )
      if (fetchRawFileContent.apiResponse.ok && fetchRawFileContent.body.columns) {
        const board = fetchRawFileContent.body || {}
        console.debug('%c<Kanban> fill the kanban with the board', 'color: gold', board)
        this.setState({
          boardState: BOARD_STATE.LOADED,
          board: board,
          initialBoard: board,
          patchingInProgress: false,
          revisionId: props.content.current_revision_id,
          saveInProgress: false,
          saveRequired: false
        })
      } else {
        this.setState({ boardState: BOARD_STATE.ERROR })
      }
    } catch (error) {
      console.log(`Got an error while fetching the board's contents: ${error}`)
      this.setState({ boardState: BOARD_STATE.ERROR })
    }
  }

  handleEditCard = (card) => {
    this.setState(prevState => {
      const column = prevState.board.columns
        .find(column => column.cards
          .find(columnCard => columnCard.id === card.id))

      return {
        editedCardInfos: { card, column },
        editedCardWasModified: false
      }
    })
  }

  handleRemoveCard = (card) => {
    this.setState(prevState => {
      const column = prevState.board.columns
        .find(column => column.cards
          .find(columnCard => columnCard.id === card.id))

      const newBoard = column ? removeCard(prevState.board, column, card) : prevState.board
      return {
        board: newBoard,
        saveRequired: true
      }
    })
  }

  handleAddCard = (column) => {
    // RJ - 2022-01-14 - NOTE
    // we don't call save() here because handleCardEdited will be called after
    // adding a card
    this.setState({
      editedCardInfos: {
        card: {},
        column
      }
    })
  }

  handleCardEdited = (card) => {
    this.setState(prevState => {
      const newBoard = (
        card.id
          ? changeCard(prevState.board, card.id, card)
          : addCard(prevState.board, prevState.editedCardInfos.column, { ...card, id: uuidv4() })
      )

      return {
        editedCardInfos: null,
        editedCardWasModified: false,
        board: newBoard,
        saveRequired: true,
        cardIdEdited: card.id
      }
    })
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
      const newBoard = column.id
        ? changeColumn(prevState.board, column, newColumn)
        : addColumn(prevState.board, { ...newColumn, cards: [] })

      return {
        editedColumnInfos: null,
        board: newBoard,
        saveRequired: true
      }
    })
  }

  handleColumnEditCancel = () => {
    this.setState({ editedColumnInfos: null })
  }

  async save (newBoard, cardIdEdited) {
    this.setState({ boardState: BOARD_STATE.SAVING })
    const { props, state } = this

    console.debug('%c<Kanban> generate the patch', 'color: gold')
    const patchedBoard = createPatch(state.initialBoard, newBoard)

    console.debug('%c<Kanban> send the patch', 'color: gold', patchedBoard)
    const fetchResultSaveKanban = await handleFetchResult(
      await patchPatchFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        props.content.label + KANBAN_FILE_EXTENSION,
        state.revisionId,
        JSON.stringify(patchedBoard),
        KANBAN_MIME_TYPE
      )
    )

    if (!fetchResultSaveKanban.ok) {
      switch (fetchResultSaveKanban.body.code) {
        case 2044:
          sendGlobalFlashMessage(props.t('You must change the status or restore this kanban board before any change'))
          break
        case 3015:
          sendGlobalFlashMessage(props.t('The board has been modified and your modification cannot be applied'), 'danger')
          break
        default:
          sendGlobalFlashMessage(props.t('Error while saving the new version'))
          break
      }
      this.setState({ boardState: BOARD_STATE.ERROR })
      return
    }

    console.debug('%c<Kanban> store the new board', 'color: gold')
    this.setState({
      boardState: BOARD_STATE.LOADED,
      initialBoard: newBoard,
      revisionId: fetchResultSaveKanban.body.new_revision,
      saveInProgress: false,
      saveRequired: false
    })

    removeLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(cardIdEdited)
    )
  }

  handleRemoveColumn = (column) => {
    this.setState(prevState => {
      const newBoard = removeColumn(prevState.board, column)
      return {
        board: newBoard,
        saveRequired: true
      }
    })
  }

  handleCardDragEnd = (card, from, to) => {
    this.setState(prevState => {
      const newBoard = moveCard(prevState.board, from, to)
      return {
        board: newBoard,
        saveRequired: true
      }
    })
  }

  handleColumnDragEnd = (column, fromPosition, toPosition) => {
    this.setState(prevState => {
      const newBoard = moveColumn(prevState.board, fromPosition, toPosition)
      return {
        board: newBoard,
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

  handleCardEditCancel = (cardId) => {
    const { props } = this

    this.setState({
      editedCardInfos: null,
      editedCardWasModified: false
    })

    removeLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(cardId)
    )
  }

  handleCardEditIgnore = () => {
    console.debug('%c<Kanban> ignore the change on the card', 'color: gold')
    this.setState({ editedCardWasModified: false })
  }

  handleCardEditReload = (cardId) => {
    const { props, state } = this

    const column = state.board.columns.find(
      (column) => column.cards.find((card) => card.id === cardId)
    )
    const card = column.cards.find((card) => card.id === cardId)

    console.debug('%c<Kanban> reload the card information in the editor', 'color: gold', cardId, column, card)
    removeLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(cardId)
    )

    this.setState({
      editedCardInfos: { card, column },
      editedCardWasModified: false
    })
  }

  handleRefreshBoard = () => {
    console.debug('%c<Kanban> refresh button clicked, reload the board.', 'color: gold')
    this.loadBoardContent()
  }

  render () {
    const { props, state } = this
    const changesAllowed = (
      !props.readOnly && state.boardState === BOARD_STATE.LOADED && props.mode !== APP_FEATURE_MODE.REVISION
    )

    const cardsByColumns = Object.fromEntries(
      state.board.columns.map(({ id, cards }) => ([id, cards]))
    )
    const cardsById = Object.fromEntries(
      state.board.columns.flatMap(({ cards }) => (cards.map((card) => [card.id, card])))
    )

    return (
      <div className={classnames('kanban__contentpage__wrapper', { fullscreen: props.fullscreen })}>
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
          {state.boardState === BOARD_STATE.ERROR && (
            <>
              <div className='kanban__contentpage__wrapper__options__error'>
                {props.t('The board was not able to load. Use the refresh button to reload it.')}
              </div>
              <RefreshWarningMessage
                tooltip={props.t('Click to reload the board.')}
                onClickRefresh={this.handleRefreshBoard}
              />
            </>
          )}
        </div>

        <div className='kanban__contentpage__wrapper__toolbar'>
          {props.fullscreen && (
            <IconButton
              icon='fas fa-compress-arrows-alt'
              title={props.t('Exit fullscreen mode')}
              onClick={props.onClickFullscreen}
            />
          )}
        </div>
        {state.boardState === BOARD_STATE.INIT && <Loading />}
        <>
          <div
            className={classnames('kanban__contentpage__wrapper__board', {
              hidden: state.boardState === BOARD_STATE.INIT
            })}
          >
            {state.boardState === BOARD_STATE.LOADING && <Loading />}
            <Board
              allowAddColumn={!props.readOnly}
              allowRemoveColumn={changesAllowed}
              allowRenameColumn={changesAllowed}
              allowAddCard={changesAllowed}
              allowRemoveCard={changesAllowed}
              disableCardDrag={!changesAllowed}
              disableColumnDrag={!changesAllowed}
              onCardDragEnd={this.handleCardDragEnd}
              onColumnDragEnd={this.handleColumnDragEnd}
              onColumnNew={this.handleColumnNew}
              onColumnRemove={this.handleRemoveColumn}
              onCardRemove={this.handleRemoveCard}
              onColumnRename={this.handleEditColumn}
              renderColumnAdder={() => (
                <div
                  className={classnames({ disabled: !changesAllowed }, 'kanban__columnAdder')}
                  key='kanban__columnAdder'
                  onClick={changesAllowed ? this.handleEditColumn : undefined}
                >
                  <i className='fa fas fa-fw fa-plus' />
                  <p>{props.t('Add new column')}</p>
                </div>
              )}
              renderColumnHeader={column => (
                <KanbanColumnHeader
                  customColor={props.config.hexcolor}
                  readOnly={!changesAllowed}
                  hideButtonsWhenReadOnly={props.readOnly}
                  column={column}
                  onEditColumn={this.handleEditColumn}
                  onAddCard={this.handleAddCard}
                  onRemoveColumn={this.handleRemoveColumn}
                />
              )}
              renderCard={card => {
                const shouldDisplayCard = isCardMatchFilter(
                  card, props.filterInput, props.config.workspace.memberList
                )
                if (shouldDisplayCard === false) {
                  return <div className='kanban__card--hidden' />
                }

                return (
                  <KanbanCard
                    config={props.config}
                    customColor={props.config.hexcolor}
                    readOnly={!changesAllowed}
                    hideButtonsWhenReadOnly={props.readOnly}
                    card={card}
                    cardList={cardsById}
                    language={props.language}
                    onEditCard={this.handleEditCard}
                    onRemoveCard={this.handleRemoveCard}
                  />
                )
              }}
            >
              {state.board}
            </Board>
          </div>
          {state.editedCardInfos && (
            <CardPopup
              customClass={classnames('kanban__KanbanPopup', { hidden: state.boardState !== BOARD_STATE.LOADED })}
              customColor={props.config.hexcolor}
              faIcon='far fa-id-card'
              label={state.editedCardInfos.card.id ? props.t('Editing Card') : props.t('New Card')}
              onClose={() => this.handleCardEditCancel(state.editedCardInfos.card.id)}
            >
              <KanbanCardEditor
                apiUrl={props.config.apiUrl}
                content={props.content}
                card={state.editedCardInfos.card}
                onValidate={this.handleCardEdited}
                onCancel={() => this.handleCardEditCancel(state.editedCardInfos.card.id)}
                onClickIgnoreModification={this.handleCardEditIgnore}
                onClickReloadModification={this.handleCardEditReload}
                // End of required props ///////////////////////////////////////
                codeLanguageList={props.config.system.config.ui__notes__code_sample_languages}
                customColor={props.config.hexcolor}
                defaultBackgroundColor={KANBAN_DEFAULT_BACKGROUND_COLOR}
                language={props.language}
                memberList={props.config.workspace.memberList}
                cardsById={cardsById}
                cardsByColumns={cardsByColumns}
                column={state.editedCardInfos.column}
                wasModified={state.editedCardWasModified}
              />
            </CardPopup>
          )}
          {state.editedColumnInfos && (
            <CardPopup
              customClass={classnames('kanban__KanbanPopup', { hidden: state.boardState !== BOARD_STATE.LOADED })}
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
      </div>
    )
  }
}

Kanban.propTypes = {
  config: PropTypes.object.isRequired,
  content: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired,
  // End of required props /////////////////////////////////////////////////////
  isSelectedRevision: PropTypes.bool,
  language: PropTypes.string,
  readOnly: PropTypes.bool,
  selectedRevisionId: PropTypes.number,
  filterInput: PropTypes.string
}

Kanban.defaultProps = {
  isSelectedRevision: false,
  language: 'en',
  readOnly: false,
  selectedRevisionId: null,
  filterInput: ''
}

export default translate()(Kanban)
