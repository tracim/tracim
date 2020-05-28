import { PAGES } from '../../support/urls_commands.js'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visit('/ui/account')
  })

  it('should have translations', () => {
    cy.get('.account__title').contains('My account')

    cy.changeLanguage('fr')
    cy.get('.account__title').contains('Mon compte')

    cy.changeLanguage('pt')
    cy.get('.account__title').contains('Minha conta')
  })
})
