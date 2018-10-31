describe('logging in tracim', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.login('users')
    cy.visit('/')
  })

  it('', function () {
    cy.get('.profilgroup__name__imgprofil').should('have.attr', 'src')
    cy.get('.homepagecard.card').should('be.visible')
    // for the moment we don't have name by default (26/07/2018)
    cy.get('.profilgroup__name__imgprofil').invoke('text').should('be.equal', '')
  })
})
