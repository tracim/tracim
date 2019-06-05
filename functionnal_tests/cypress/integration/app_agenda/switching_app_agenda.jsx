import { PAGES } from '../../support/urls_commands.js'

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
    it('Should reload the iframe with the proper workspace id', () => {
      cy.visitPage({pageName: PAGES.AGENDA, params: {workspaceId: workspace1.workspace_id}})

      cy.get('[data-cy="layoutPageTitle"]')
        .contains(workspace1.label)

      cy.get('#agendaIframe')
        .invoke('attr', 'data-config')
        .should('contain', `agenda/workspace/${workspace1.workspace_id}/`)

      cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspace2.label}"]`)
        .click()

      cy.get(`[data-cy="sidebar__content__navigation__workspace__item_${workspace2.workspace_id}"]`)
        .find('[data-cy="sidebarSubdropdown-agenda"]')
        .click()

      cy.get('[data-cy="layoutPageTitle"]')
        .should('contain', workspace2.label)

      cy.get('#agendaIframe')
        .invoke('attr', 'data-config')
        .should('contain', `agenda/workspace/${workspace2.workspace_id}/`)
    })
  })
})
