import { PAGES } from '../../support/urls_commands'

describe('App Kanban', () => {
  const kanbanTitle = 'Kanban'
  const columnTitle = 'Title'

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
      cy.contains('.kanban__contentpage__header__title', kanbanTitle)
    })
  })

  it('should be possible to create a column', () => {
    cy.get('.react-kanban-column-adder-button').should('be.visible').click()
    cy.get('.react-kanban-column input[type=text]').should('be.visible').type(columnTitle)
    cy.get('.react-kanban-column button[type=submit]').should('be.visible').click()
    cy.contains('.kanban__contentpage__statewrapper__kanban__column__header__title', columnTitle)
  })
})
