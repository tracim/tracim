import { PAGES } from '../../support/urls_commands'
let workspaceId

// FIXME - GB - 2021-12-08 - See https://github.com/tracim/tracim/issues/5129
describe.skip('navigate :: workspace > create_new > kanban', function () {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  it('dashboard > button', function () {
    cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
    cy.get('.dashboard__workspace__rightMenu__contents .fa-columns').should('be.visible').click()
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.disabled')
    cy.get('[data-cy=createcontent__form__input]').type('Hello Kanban (from dashboard)')
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.enabled').click()
  })

  it('workspace contents > button', function () {
    cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.contains('Kanban').click()
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.disabled')
    cy.get('[data-cy=createcontent__form__input]').type('Hello Kanban (from contents)')
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.enabled').click()
  })
})
