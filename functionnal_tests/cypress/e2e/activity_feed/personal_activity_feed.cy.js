import { PAGES } from '../../support/urls_commands'

describe('The Personal recent activities page', () => {

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createWorkspace()
    cy.createWorkspace()
    cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, waitForTlm: true })
  })

  it('should display activites from all spaces', () => {
    cy.get('[data-cy=activityList__item]').should('have.length', 4)
  })

  after(function () {
    cy.cancelXHR()
  })

})
