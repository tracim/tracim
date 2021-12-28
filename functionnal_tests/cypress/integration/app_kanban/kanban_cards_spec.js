import { PAGES } from '../../support/urls_commands'

describe('App Kanban', () => {
  const kanbanTitle = 'Kanban'
  const columnTitle = 'Column Title'
  const cardTitle = 'Card Title'

  let workspaceId

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.get('.dashboard__workspace__rightMenu__contents .fa-columns').should('be.visible').click()
      cy.get('[data-cy=popup__createcontent__form__button]').should('be.disabled')
      cy.get('[data-cy=createcontent__form__input]').type(kanbanTitle)
      cy.get('[data-cy=popup__createcontent__form__button]').should('be.enabled').click()
      cy.contains('.wsContentGeneric__header__title', kanbanTitle)
      cy.get('.kanban__columnAdder').should('be.visible').click()
      cy.get('.textinput__text').should('be.visible').type(columnTitle)
      cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
      cy.contains('.kanban__contentpage__wrapper__board__column__title', columnTitle)
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should be possible to create a card', () => {
    cy.get('[data-cy=kanban_addCard]').should('be.visible').click()
    cy.contains('.cardPopup__header', 'New Card')
    cy.waitForTinyMCELoaded()
    cy.get('.kanban__KanbanPopup__title .textinput__text').type(cardTitle)
    cy.get('.kanban__KanbanPopup__form_buttons .iconbutton').last().should('be.visible').click()
    cy.contains('.kanban__contentpage__wrapper__board__card__title', cardTitle)
  })
})
