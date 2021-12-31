import { PAGES } from '../../support/urls_commands'

/**
 * INFO - 2021-12-31 - SG
 * This helper function creates a kanban board in 'baseWorkspace'
 * and display it.
 * It returns a cypress promise which resolves with the workspace.
 */
export const createKanbanBoard = (title) => {
  return cy.fixture('baseWorkspace').as('workspace').then(workspace => {
    cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId: workspace.workspace_id } })
    cy.get('.dashboard__workspace__rightMenu__contents .fa-columns').should('be.visible').click()
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.disabled')
    cy.get('[data-cy=createcontent__form__input]').type(title)
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.enabled').click()
    cy.contains('.wsContentGeneric__header__title', title).then(() => workspace)
  })
}

/**
 * INFO - 2021-12-31 - SG
 * This helper function creates a kanban column in the current kanban board.
 * It requires that the kanban board is already displayed to work properly.
 */
export const createKanbanColumn = (title) => {
  cy.get('.kanban__columnAdder').should('be.visible').click()
  cy.get('.textinput__text').should('be.visible').type(title)
  cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
  cy.contains('.kanban__contentpage__wrapper__board__column__title', title)
  cy.get('[data-cy=revision_data_3]')
}

/**
 * INFO - 2021-12-31 - SG
 * This helper function creates a kanban card in the first kanban column
 * It requires that the kanban board is already displayed to work properly.
 */
export const createKanbanCard = (title) => {
  cy.get('[data-cy=kanban_addCard]').first().should('be.visible').click()
  cy.waitForTinyMCELoaded()
  cy.contains('.cardPopup__header', 'New Card')
  cy.get('.kanban__KanbanPopup__title .textinput__text').type(title)
  cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
  cy.contains('.kanban__contentpage__wrapper__board__card__title', title)
}
