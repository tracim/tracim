import { isPatternIncludedInString } from 'tracim_frontend_lib'
import { removeCard } from '@asseinfo/react-kanban'

export const KANBAN_MIME_TYPE = 'application/json'
export const KANBAN_FILE_EXTENSION = '.kanban'
export const KANBAN_DEFAULT_BACKGROUND_COLOR = '#fdfdfd'
export const KANBAN_COLUMN_DEFAULT_COLOR = '#e8e8e8'

export const isCardMatchFilter = (card, filter, memberList) => {
  if (filter === '') return true
  if (isPatternIncludedInString(card.title, filter)) return true
  if (isPatternIncludedInString(card.freeInput, filter)) return true
  if (isPatternIncludedInString(card.kickoff, filter)) return true
  if (isPatternIncludedInString(card.deadline, filter)) return true

  const assignmentList = (card?.assignmentList || [])
    .map(assignmentId => memberList.find(m => m.id === assignmentId) || null)
    .filter(a => a !== null)

  if (assignmentList.some(a => {
    if (isPatternIncludedInString(a.username, filter)) return true
    if (isPatternIncludedInString(a.publicName, filter)) return true
  })) return true

  const descriptionHaystack = new window.DOMParser().parseFromString(card.description, 'text/html')
  if (isPatternIncludedInString(descriptionHaystack.body.textContent, filter)) return true

  return false
}

export const filterKanbanBoard = (newFilterInput, currentBoard, memberList) => {
  if (newFilterInput === '') return currentBoard
  if (currentBoard?.columns.length === 0) return currentBoard

  let boardFiltered = currentBoard || { column: [] }

  for (const col of currentBoard.columns) {
    for (const card of col.cards) {
      const shouldDisplayCard = isCardMatchFilter(card, newFilterInput, memberList)

      if (shouldDisplayCard === false) {
        boardFiltered = removeCard(boardFiltered, col, card)
      }
    }
  }

  return boardFiltered
}
