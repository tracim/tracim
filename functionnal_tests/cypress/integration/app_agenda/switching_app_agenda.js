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

  // TODO - CH - 2019-06-05 - We need to add tests that check that the agenda loaded is the proper one
  // Right now, Cypress cannot access or click inside an iframe
  // One solution would be to add custom events fired by caldavzap that would include the data it is about to display
  // and assert that it is the right data (eg. the right workspace)
  // see https://github.com/tracim/tracim/issues/1849

  describe('Switching from app agenda of different workspace', () => {
    it('Should reload the iframe with the proper workspace id', () => {
      cy.visitPage({ pageName: PAGES.AGENDA, params: { workspaceId: workspace1.workspace_id } })

      cy.get('[data-cy="layoutPageTitle"]')
        .contains(workspace1.label)

      cy.get('#agendaIframe')
        .invoke('attr', 'data-config')
        .should('contain', `agenda/workspace/${workspace1.workspace_id}/`)

      cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspace2.label}"]`)
        .click()

      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: workspace2.workspace_id } })
        .find('.sidebar__content__navigation__workspace__item__menu')
        .click()
        .get('[data-cy="sidebar_subdropdown-agenda"]')
        .click()

      cy.get('[data-cy="layoutPageTitle"]')
        .should('contain', workspace2.label)

      cy.get('#agendaIframe')
        .invoke('attr', 'data-config')
        .should('contain', `agenda/workspace/${workspace2.workspace_id}/`)
    })
  })
})
