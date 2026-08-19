import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('App Agenda', () => {
  let workspace1 = {}
  let workspace2 = {}

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => (workspace1 = workspace))
    cy.createRandomWorkspace().then(workspace => (workspace2 = workspace))
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('Switching from app agenda of different workspace', () => {
    it('Should reload the calendar with the proper workspace id', () => {
      cy.intercept('PROPFIND', `**/dav/agenda/workspace/${workspace1.workspace_id}/`).as('agenda1')
      cy.visitPage({ pageName: PAGES.AGENDA, params: { workspaceId: workspace1.workspace_id } })

      cy.get('[data-cy="layoutPageTitle"]')
        .contains(workspace1.label)

      cy.wait('@agenda1')

      cy.intercept('PROPFIND', `**/dav/agenda/workspace/${workspace2.workspace_id}/`).as('agenda2')
      cy.get(`.sidebar__item__name[title="${workspace2.label}"]`)
        .click()

      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: workspace2.workspace_id } })
        .find('.sidebar__item__menu')
        .click()
        .get('[data-cy="sidebar_subdropdown-agenda"]')
        .click()

      cy.get('[data-cy="layoutPageTitle"]')
        .should('contain', workspace2.label)

      cy.wait('@agenda2')
    })
  })
})
