const GREETING_MSG = 'Welcome to Tracim'

describe('logging in tracim', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('redirects to the home page when the user is not a member of any workspace', function () {
    cy.loginAs('administrators')
    cy.createRandomUser().then(user => cy.login(user))
    cy.visit('/ui')
    cy.get('.homepagecard__title')
    cy.get('[data-cy=avatar]')
    cy.contains(GREETING_MSG)
    cy.get('.homepagecard.card').should('be.visible')
    cy.url().should('not.include', '/ui/recent-activities')
  })

  it('redirects to the recent activities when the user is a member of a workspace', function () {
    cy.loginAs('users')
    cy.visit('/ui')
    cy.url().should('include', '/ui/recent-activities')
    cy.contains('Recent activities')
  })
})
