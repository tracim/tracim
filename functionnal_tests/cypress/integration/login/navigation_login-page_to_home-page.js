let GREETING_MSG = 'Welcome to Tracim'

describe('logging in tracim', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui')
  })

  it('Checks information in home page', function () {
    cy.get('.homepagecard__title')
    cy.get('[data-cy=avatar]')
    cy.contains(GREETING_MSG)
    cy.get('.homepagecard.card').should('be.visible')
  })
})
