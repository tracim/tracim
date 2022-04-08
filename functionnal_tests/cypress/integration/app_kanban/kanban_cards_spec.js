import { createKanbanBoard, createKanbanColumn, createKanbanCard } from './helper'

describe('App Kanban (cards)', () => {
  const kanbanTitle = 'Kanban'
  const columnTitle = 'Column Title'
  const cardTitle = 'Card Title'

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    createKanbanBoard(kanbanTitle)
    createKanbanColumn(columnTitle)
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should be possible to create a card', () => {
    createKanbanCard(cardTitle)
  })

  it('should be possible to edit a card', () => {
    createKanbanCard(cardTitle)
    cy.get('[data-cy=cardActions]').click()
    cy.get('[data-cy=editCard]').click()
    cy.contains('.cardPopup__header', 'Editing Card')
    cy.get('.kanban__KanbanPopup__title .textinput__text').type(' Edited')
    cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
    cy.contains('.kanban__contentpage__wrapper__board__card__title', cardTitle + ' Edited')
  })

  it('should be possible to see the deadline', () => {
    createKanbanCard(cardTitle)
    cy.get('[data-cy=cardActions]').click()
    cy.get('[data-cy=editCard]').click()
    cy.contains('.cardPopup__header', 'Editing Card')
    cy.get('.kanban__KanbanPopup__deadline').type('1111-11-11')
    cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
    cy.contains('.kanban__contentpage__wrapper__board__card__options__deadline', '1111-11-11')
  })

  it('should be possible to see the free input', () => {
    createKanbanCard(cardTitle)
    cy.get('[data-cy=cardActions]').click()
    cy.get('[data-cy=editCard]').click()
    cy.contains('.cardPopup__header', 'Editing Card')
    cy.get('.kanban__KanbanPopup__freeInput').type('toto')
    cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
    cy.contains('.kanban__contentpage__wrapper__board__card__options__freeInput', 'toto')
  })

  it('should be possible to delete a card', () => {
    createKanbanCard(cardTitle)
    cy.get('[data-cy=cardActions]').click()
    cy.get('[data-cy=deleteCard]').click()
    cy.get('[data-cy=confirmDeleteCard]').click()
  })
})
