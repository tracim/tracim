describe('navigate :: workspace > create_new > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents?type=thread')
  })

  it('should have translations', () => {
    cy.get('.workspace__header__title').contains('List of threads')

    cy.changeLanguage('fr')
    cy.get('.workspace__header__title').contains('Liste des discussions')

    cy.changeLanguage('pt')
    cy.get('.workspace__header__title').contains('Lista de discussões')
  })
})
