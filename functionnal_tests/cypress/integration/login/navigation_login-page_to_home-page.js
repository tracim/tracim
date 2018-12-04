describe('logging in tracim', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.login('users')
    cy.visit('/ui')
  })

  it('', function () {
    cy.get('.profilgroup__name .avatar-wrapper').should('be.visible')
    cy.get('.homepagecard.card').should('be.visible')
    cy.get('.homepagecard__user__avatar .avatar').should('be.visible')
  })
})
