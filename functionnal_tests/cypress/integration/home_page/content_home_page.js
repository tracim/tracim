describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
  })
  it('', function () {
    cy.get('section.homepage').should('be.visible')
    cy.get('.homepagecard__title').should('be.visible')
    cy.get('.homepagecard__user').should('be.visible')
    cy.get('.homepagecard__delimiter').should('be.visible')
    cy.get('.homepagecard__text').should('be.visible')
    cy.get('.homepagecard__endtext').should('be.visible')
  })
})
