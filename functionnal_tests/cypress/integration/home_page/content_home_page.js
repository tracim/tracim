describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('', function () {
    cy.loginAs('administrators')
    cy.createRandomUser().then(user => cy.login(user))
    cy.visit('/')
    cy.get('section.homepage').should('be.visible')
    cy.get('.homepagecard__title').should('be.visible')
    cy.get('.homepagecard__delimiter').should('be.visible')
    cy.get('.homepagecard__text').should('be.visible')
    cy.get('.homepagecard__endtext').should('be.visible')
  })
})
