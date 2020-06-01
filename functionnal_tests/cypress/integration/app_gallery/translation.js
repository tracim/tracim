describe('App Gallery', function () {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/gallery')
  })

  it('should have translations', () => {
    cy.get('.gallery__action__button').contains('Play')
    cy.changeLanguage('fr')
    cy.get('.gallery__action__button').contains('Lecture')
    cy.changeLanguage('pt')
    cy.get('.gallery__action__button').contains('Reproduzir')
  })
})
