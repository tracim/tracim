import { PAGES } from '../../support/urls_commands'


describe('An admin seeing a user profile', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace')
    cy.createRandomUser()
    cy.visitPage({pageName: PAGES.HOME})
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should show the users agenda', () => {
    cy.get('.adminlink').click()
    cy.get('[data-cy=adminlink__user__link]').click()
    cy.get('.adminUser__table__tr__td-link').first().click()
    cy.get('[data-cy=menusubcomponent__list__agenda]').click()
    cy.get('.agendaInfo__content__link').should('be.visible')
  })
})
