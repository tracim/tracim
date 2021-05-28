/* global alert, confirm, prompt */

import React from 'react'
import { translate } from 'react-i18next'
import { escape as escapeHtml } from 'lodash'
import classnames from 'classnames'
import { v4 as uuidv4 } from 'uuid'
import Board from '@lourenci/react-kanban'
import '@lourenci/react-kanban/dist/styles.css'
import KanbanCardEditor from './KanbanCardEditor.jsx'
import {
  IconButton,
  PromptMessage,
  handleFetchResult,
  putRawFileContent,
  getRawFileContent,
  LOCAL_STORAGE_FIELD,
  CardPopup,
  removeLocalStorageItem,
  getLocalStorageItem,
  setLocalStorageItem
} from 'tracim_frontend_lib'

require('./Kanban.styl')

const KANBAN_MIME_TYPE = 'application/json'
const KANBAN_FILE_EXTENSION = '.kanban'

function moveElem (array, fromPosition, toPosition, elem) {
  const a = array.slice()
  a.splice(fromPosition, 1)
  a.splice(toPosition, 0, elem)
  return a
}

class Kanban extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: props.content.current_revision_type !== 'creation',
      error: false,
      fullscreen: false,
      mustSave: false,
      colorPickerEnabledForColumnId: null,
      board: { columns: [] },
      isDrafAvailable: !!getLocalStorageItem(
        'kanban',
        props.content,
        LOCAL_STORAGE_FIELD.RAW_CONTENT
      )
    }
  }

  componentDidMount () {
    this.loadBoardContent()
  }

  async loadBoardContent () {
    const { props } = this
    const { content } = props

    if (content.current_revision_type === 'creation') {
      this.setState({ loading: false, board: { columns: [] } })
      return
    }

    const fetchRawFileContent = await handleFetchResult(
      await getRawFileContent(
        props.config.apiUrl,
        content.workspace_id,
        content.content_id,
        content.current_revision_id,
        content.label + KANBAN_FILE_EXTENSION
      ),
      true
    )

    if (fetchRawFileContent.apiResponse.ok) {
      this.setState({
        loading: false,
        board: {
          columns: [],
          ...JSON.parse(fetchRawFileContent.body || '{}')
        }
      })
    } else {
      this.setState({ loading: false, error: true })
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.content.current_revision_id !== prevProps.content.current_revision_id) {
      this.setState({ loading: true })
      this.loadBoardContent()
    }
  }

  handleRestoreDraft = () => {
    this.updateBoard(
      JSON.parse(getLocalStorageItem('kanban', this.props.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)),
      true
    )
    this.setState({ isDrafAvailable: false, mustSave: true })
  }

  handleDiscardChanges = () => {
    if (confirm(this.props.t('Are you sure you want to discard your changes?'))) {
      this.updateBoard(JSON.parse(this.props.content.raw_content || '{}'), true)
      removeLocalStorageItem('kanban', this.props.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)
      this.setState({ mustSave: false, isDraftAvailable: false })
    }
  }

  handleClickFullscreen = () => {
    this.setState({ fullscreen: !this.state.fullscreen })
  }

  handleEditCardTitle = (card) => {
    const title = prompt(this.props.t('Please enter the new title of this card'), card.title || '')
    if (title) {
      this.updateCard({ ...card, title })
    }
  }

  handleEditCardContent = (card) => {
    this.setState({
      editCard: { card, focusOnDescription: true }
    })
  }

  updateColumn (column) {
    this.updateColumns(
      this.state.board.columns.map(
        col => col.id === column.id
          ? column
          : col
      )
    )
  }

  updateCard (updatedCard) {
    this.updateColumns(
      this.state.board.columns.map(
        col => ({
          ...col,
          cards: col.cards.map(
            card => (
              updatedCard.id === card.id
                ? updatedCard
                : card
            )
          )
        })
      )
    )
  }

  removeCard = (card) => {
    this.updateColumns(
      this.state.board.columns.map(
        col => ({
          ...col,
          cards: col.cards.filter(c => c !== card)
        })
      )
    )
  }

  renderCard = (card) => {
    return (
      <div
        style={{ backgroundColor: card.bgColor || '' }}
        className='file__contentpage__statewrapper__kanban__card'
      >
        <div className='file__contentpage__statewrapper__kanban__card__title'>
          <strong onClick={() => this.handleEditCardTitle(card)}>{card.title}</strong>
          <IconButton
            text=''
            icon='fas fa-pencil-alt'
            tooltip={this.props.t('Change the color of this card')}
            onClick={() => this.handleCardEditClick(card)}
          />
          <IconButton
            text=''
            icon='far fa-trash-alt'
            tooltip={this.props.t('Remove this card')}
            onClick={() => this.removeCard(card)}
          />
        </div>
        <div
          className='file__contentpage__statewrapper__kanban__card__description'
          onClick={() => this.handleEditCardContent(card)}
        >
          <div dangerouslySetInnerHTML={{ __html: card.htmlEnabledForDescription ? card.description : escapeHtml(card.description).replace(/\n/g, '<br />') }} />
        </div>
      </div>
    )
  }

  handleCardAdd (column) {
    this.setState({
      editCard: {
        card: {},
        column
      }
    })
  }

  handleCardEditClick (card) {
    this.setState({
      editCard: { card }
    })
  }

  handleCardEdited = (card) => {
    if (card.id) {
      this.updateCard(card)
    } else {
      this.addCardToColumn(this.state.editCard.column, { ...card, id: uuidv4() })
    }
    this.setState({
      editCard: null
    })
  }

  addCardToColumn (column, card) {
    this.updateColumns(
      this.state.board.columns.map(
        col => (
          col.id === column.id
            ? { ...col, cards: [...col.cards, card] }
            : col
        )
      )
    )
  }

  handleSave = async () => {
    const { props } = this
    this.setState({ saving: true })
    const fetchResultSaveKanban = await handleFetchResult(
      await putRawFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        props.content.label + KANBAN_FILE_EXTENSION,
        JSON.stringify(this.state.board),
        KANBAN_MIME_TYPE
      )
    )

    if (fetchResultSaveKanban.ok) {
      removeLocalStorageItem('kanban', this.props.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)
      this.setState({ mustSave: false, saving: false, isDrafAvailable: false })
    } else {
      switch (fetchResultSaveKanban.body.code) {
        case 2044:
          alert(props.t('You must change the status or restore this kanban board before any change'))
          break
        default:
          alert(props.t('Error while saving the new version'))
          break
      }

      this.setState({ saving: false })
    }
  }

  handleAddColumn = () => {
    const title = prompt('Please enter the name of the new column')
    if (!title) {
      return
    }

    this.handleNewColumnConfirm({
      title: title,
      cards: []
    })
  }

  handleCardRemove = (card) => {
    this.removeCard(card)
  }

  handleColumnRemove = (column) => {
    this.updateColumns(this.state.board.columns.filter(col => col !== column))
  }

  handleCardDragEnd = (card, { fromColumnId, fromPosition }, { toColumnId, toPosition }) => {
    this.updateColumns(
      this.state.board.columns.map(
        col => (
          (col.id === fromColumnId && col.id === toColumnId)
            ? { ...col, cards: moveElem(col.cards, fromPosition, toPosition, card) }
            : (
              col.id === fromColumnId
                ? { ...col, cards: col.cards.filter(c => c !== card) }
                : (
                  col.id === toColumnId
                    ? {
                      ...col,
                      cards: [
                        ...col.cards.slice(0, toPosition),
                        card,
                        ...col.cards.slice(toPosition)
                      ]
                    }
                    : col
                )
            )
        )
      )
    )
  }

  handleNewColumnConfirm = (column) => {
    const newColumn = { ...column, id: uuidv4() }

    this.updateColumns([
      ...this.state.board.columns,
      newColumn
    ])
  }

  handleColumnDragEnd = (column, { fromPosition }, { toPosition }) => {
    this.updateColumns(
      moveElem(
        this.state.board.columns,
        fromPosition,
        toPosition,
        column
      )
    )
  }

  updateColumns (newColumns) {
    this.updateBoard({ ...this.state.board, columns: newColumns })
  }

  updateBoard (newBoard, dontSaveDraftToLocalStorage) {
    this.setState({
      board: newBoard,
      mustSave: !dontSaveDraftToLocalStorage
    })

    if (!dontSaveDraftToLocalStorage) {
      setLocalStorageItem('kanban', this.props.content, LOCAL_STORAGE_FIELD.RAW_CONTENT, JSON.stringify(newBoard))
    }
  }

  handleColumnRenameClick = (column) => {
    const newName = prompt(this.props.t('Please enter the new name of the column'), column.title)
    if (newName) {
      this.handleColumnRename(column, newName)
    }
  }

  handleColumnRename = (column, title) => {
    // console.log("handleColumnRename", column, title)
    const newColumns = this.state.board.columns
    newColumns[newColumns.indexOf(column)] = { ...column, title }
    this.updateColumns(newColumns)
    return column
  }

  handleColumnNew = (board, column) => {
    // console.log("handleColumnNew", board, column)
    this.updateBoard(board)
    return column
  }

  handleColumnColorChange = (column, bgColor) => {
    this.updateColumn({ ...column, bgColor })
  }

  handleCardColorChange = (card, e) => {
    this.updateCard({ ...card, bgColor: e.target.value })
  }

  handleColumnColorClick = (column) => {
    this.setState({
      colorPickerEnabledForColumnId: this.state.colorPickerEnabledForColumnId === column.id
        ? null
        : column.id
    })
  }

  renderColumnHeader = (column) => {
    return (
      <>
        <div
          className='file__contentpage__statewrapper__kanban__columnHeader'
          style={{ backgroundColor: column.bgColor || '' }}
        >
          <strong onClick={() => this.handleColumnRenameClick(column)}>{column.title}</strong>
          <IconButton
            text=''
            icon='fas fa-paint-brush'
            tooltip={this.props.t('Change the color of this column')}
            onClick={() => this.handleColumnColorClick(column)}
          />
          <IconButton
            text=''
            icon='fas fa-plus'
            tooltip={this.props.t('Add a card')}
            onClick={() => this.handleCardAdd(column)}
          />
          <IconButton
            text=''
            icon='far fa-trash-alt'
            tooltip={this.props.t('Remove this column')}
            onClick={() => this.handleColumnRemove(column)}
          />
        </div>
        {(this.state.colorPickerEnabledForColumnId === column.id && (
          <>
            <input type='color' onChange={(e) => this.handleColumnColorChange(column, e.target.value)} />
            <input type='button' style={{ fontSize: 'small' }} value={this.props.t('Hide')} onClick={() => this.setState({ colorPickerEnabledForColumnId: null })} />
          </>
        ))}
      </>
    )
  }

  handleCardEditCancel = () => {
    this.setState({ editCard: null })
  }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('file__contentpage__statewrapper__kanban', { fullscreen: state.fullscreen })}>
        {state.isDrafAvailable && (
          <PromptMessage
            msg={props.t('You have a pending draft')}
            btnType='link'
            icon='far fa-hand-point-right'
            btnLabel={props.t('Resume writing')}
            onClickBtn={this.handleRestoreDraft}
          />
        )}

        <div className='file__contentpage__statewrapper__kanban__toolbar'>
          <IconButton
            text={props.t('column')}
            icon='fas fa-plus'
            onClick={this.handleAddColumn}
          />
          <IconButton
            disabled={!state.mustSave}
            icon='fas fa-save'
            text={state.saving ? props.t('Saving…') : props.t('Save')}
            onClick={this.handleSave}
          />
          <IconButton
            disabled={!state.mustSave}
            icon='far fa-trash-alt'
            text={props.t('Discard changes')}
            onClick={this.handleDiscardChanges}
          />
          <IconButton
            icon='fas fa-arrows-alt'
            text={props.t('Fullscreen')}
            onClick={this.handleClickFullscreen}
          />
          {state.fullscreen && (<span className='file__contentpage__statewrapper__kanban__toolbar__title'>{props.t('Board: {{label}}', { label: props.content.label })}</span>)}
        </div>
        {(state.loading
          ? <span>{props.t('Loading, please wait…')}</span>
          : (state.error
            ? <span style={{ color: '#FF3333' }}> {props.t('Error while loading the board.')} </span> // FIXME inline style
            : (
              <>
                <div className='file__contentpage__statewrapper__kanban__wrapper'>
                  <Board
                    allowAddColumn
                    allowRemoveColumn
                    allowRenameColumn
                    allowAddCard
                    allowRemoveCard
                    onCardDragEnd={this.handleCardDragEnd}
                    onColumnDragEnd={this.handleColumnDragEnd}
                    onNewColumnConfirm={this.handleNewColumnConfirm}
                    onColumnNew={this.handleColumnNew}
                    onColumnRemove={this.handleColumnRemove}
                    onCardRemove={this.handleCardRemove}
                    onColumnRename={this.handleColumnRename}
                    renderColumnHeader={this.renderColumnHeader}
                    renderCard={this.renderCard}
                  >
                    {state.board}
                  </Board>
                </div>
                {state.editCard && (
                  <CardPopup
                    customClass='file__kanbanCardEditor'
                    customHeaderClass='primaryColorBg'
                    onClose={this.handleCardEditCancel}
                  >
                    <KanbanCardEditor
                      card={state.editCard.card}
                      focusOnDescription={state.editCard.focusOnDescription}
                      onValidate={this.handleCardEdited}
                      onCancel={this.handleCardEditCancel}
                    />
                  </CardPopup>
                )}
              </>
            )
          )
        )}
      </div>
    )
  }
}

export default translate()(Kanban)
