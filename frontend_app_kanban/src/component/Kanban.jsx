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
  IconButton,
  handleFetchResult,
  putRawFileContent,
  getRawFileContent,
  CardPopup,
  sendGlobalFlashMessage
} from 'tracim_frontend_lib'

import { KANBAN_MIME_TYPE, KANBAN_FILE_EXTENSION } from '../helper.js'
import KanbanCard from './KanbanCard.jsx'
import KanbanCardEditor from './KanbanCardEditor.jsx'
import KanbanColumnHeader from './KanbanColumnHeader.jsx'

require('./Kanban.styl')

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
      boardState: justCreated ? BOARD_STATE.LOADED : BOARD_STATE.LOADING,
      fullscreen: false,
      saveRequired: false,
      saving: false,
      colorPickerEnabledForColumnId: null,
      board: { columns: [] },
      editedCardInfos: null
    }
  }

  componentDidMount () {
    this.loadBoardContent()
  }

  async componentDidUpdate (prevProps) {
    const { props, state } = this
    if (!state.saving && props.content.current_revision_id !== prevProps.content.current_revision_id) {
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

    if (props.content.current_revision_type === 'creation') {
      this.setState({ boardState: BOARD_STATE.LOADED, board: { columns: [] } })
      return
    }

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

  handleClickFullscreen = () => {
    this.setState(prevState => ({ fullscreen: !prevState.fullscreen }))
  }

  handleEditCardTitle = (card) => {
    const title = prompt(this.props.t('Please enter the new title of this card'), card.title || '')
    if (!title) return
    this.setState(prevState => {
      return {
        board: changeCard(prevState.board, card.id, { title }),
        saveRequired: true
      }
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

  handleEditCard = (card) => {
    this.setState({
      editedCardInfos: { card }
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

  handleAddColumn = async () => {
    const title = prompt('Please enter the name of the new column')
    if (!title) {
      return
    }
    this.handleNewColumnConfirm({ title, cards: [] })
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

  handleNewColumnConfirm = (column) => {
    const newColumn = { ...column, id: uuidv4() }
    this.setState(prevState => {
      return { board: addColumn(prevState.board, newColumn), saveRequired: true }
    })
  }

  handleColumnDragEnd = (column, { fromPosition }, { toPosition }) => {
    this.setState(prevState => {
      return {
        board: moveColumn(prevState.board, fromPosition, toPosition),
        saveRequired: true
      }
    })
  }

  updateColumns (newColumns) {
    this.updateBoard({ ...this.state.board, columns: newColumns })
  }

  updateBoard (newBoard, dontSaveDraftToLocalStorage) {
    this.setState({
      board: newBoard,
      mustSave: !dontSaveDraftToLocalStorage
    })
  }

  handleColumnRenameClick = (column) => {
    const newName = prompt(this.props.t('Please enter the new name of the column'), column.title)
    if (newName) {
      this.handleColumnRename(column, newName)
    }
  }

  handleColumnRename = (column, title) => {
    this.setState(prevState => {
      return {
        board: changeColumn(prevState.board, column, { title }),
        saveRequired: true
      }
    })
  }

  handleColumnNew = (board, column) => {
    this.updateBoard(board)
    return column
  }

  handleColumnColorChange = (column, bgColor) => {
    this.setState(prevState => {
      return {
        board: changeColumn(prevState.board, column, { bgColor }),
        saveRequired: true
      }
    })
  }

  handleCardColorChange = (card, e) => {
    this.setState(prevState => {
      return {
        board: changeCard(prevState.board, card.id, { bgColor: e.target.value }),
        saveRequired: true
      }
    })
  }

  handleColumnColorClick = (column) => {
    this.setState(prevState => {
      return {
        colorPickerEnabledForColumnId: prevState.colorPickerEnabledForColumnId === column.id
          ? null
          : column.id
      }
    })
  }

  handleCardEditCancel = () => {
    this.setState({ editedCardInfos: null })
  }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('kanban__contentpage__statewrapper__kanban', { fullscreen: state.fullscreen })}>
        <div className='kanban__contentpage__statewrapper__kanban__toolbar'>
          <IconButton
            text={props.t('column')}
            icon='fas fa-plus'
            onClick={this.handleAddColumn}
            disabled={props.readOnly}
          />
          <IconButton
            icon='fas fa-arrows-alt'
            text={props.t('Fullscreen')}
            onClick={this.handleClickFullscreen}
          />
          {state.fullscreen && (<span className='kanban__contentpage__statewrapper__kanban__toolbar__title'>{props.t('Board: {{label}}', { label: props.content.label })}</span>)}
        </div>
        {state.boardState === BOARD_STATE.LOADING && <span>{props.t('Loading, please wait…')}</span>}
        {state.boardState === BOARD_STATE.ERROR && <span className='.kanban__contentpage__statewrapper__kanban__error'> {props.t('Error while loading the board.')} </span>}
        {state.boardState === BOARD_STATE.LOADED && (
          <>
            <div className='kanban__contentpage__statewrapper__kanban__wrapper'>
              <Board
                allowAddColumn={props.readOnly}
                allowRemoveColumn={props.readOnly}
                allowRenameColumn={props.readOnly}
                allowAddCar={props.readOnly}
                allowRemoveCard={props.readOnly}
                onCardDragEnd={this.handleCardDragEnd}
                onColumnDragEnd={this.handleColumnDragEnd}
                onNewColumnConfirm={this.handleNewColumnConfirm}
                onColumnNew={this.handleColumnNew}
                onColumnRemove={this.handleRemoveColumn}
                onCardRemove={this.handleRemoveCard}
                onColumnRename={this.handleColumnRename}
                renderColumnHeader={column => (
                  <KanbanColumnHeader
                    readOnly={props.readOnly}
                    column={column}
                    onRenameColumn={this.handleColumnRenameClick}
                    onChangeColumnColor={this.handleColumnColorClick}
                    onApplyColumnColorChange={this.handleColumnColorChange}
                    onCancelColumnColorChange={() => this.setState({ colorPickerEnabledForColumnId: null })}
                    onAddCard={this.handleAddCard}
                    onRemoveColumn={this.handleRemoveColumn}
                    showColorPicker={state.colorPickerEnabledForColumnId === column.id}
                  />
                )}
                renderCard={card => (
                  <KanbanCard
                    readOnly={props.readOnly}
                    card={card}
                    onEditCardTitle={this.handleEditCardTitle}
                    onEditCardColor={this.handleEditCard}
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
                customClass='kanban__kanbanCardEditor'
                customHeaderClass='primaryColorBg'
                onClose={this.handleCardEditCancel}
              >
                <KanbanCardEditor
                  card={state.editedCardInfos.card}
                  focusOnDescription={state.editedCardInfos.focusOnDescription}
                  onValidate={this.handleCardEdited}
                  onCancel={this.handleCardEditCancel}
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
