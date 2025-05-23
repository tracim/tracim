import { createKanbanBoard, createKanbanColumn } from './helper.cy.js'

describe('App Kanban (columns)', () => {
  const kanbanTitle = 'Kanban'
  const columnTitle = 'Title'

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    createKanbanBoard(kanbanTitle)
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should be possible to create a column', () => {
    createKanbanColumn(columnTitle)
  })

  it('should be possible to edit a column', () => {
    createKanbanColumn(columnTitle)
    cy.get('[data-cy=columnActions]').click()
    cy.get('[data-cy=editColumn]').click()
    cy.get('.kanban__KanbanPopup__title .textInputComponent__text').should('be.visible').type('Edited' + columnTitle)
    cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
    cy.contains('.kanban__contentpage__wrapper__board__column__title', 'Edited' + columnTitle)
    cy.get('[data-cy=revision_data_4]')
  })

  it('should be possible to delete a column', () => {
    createKanbanColumn(columnTitle)
    cy.get('[data-cy=columnActions]').click()
    cy.get('[data-cy=deleteColumn]').click()
    cy.get('[data-cy=confirm_popup__button_confirm]').click()
  })
})
