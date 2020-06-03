import { PAGES } from '../../support/urls_commands.js'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.ACCOUNT })
  })

  it('should have translations', () => {
    cy.get('.account__userpreference__setting').contains('Change my profile')

    cy.changeLanguage('fr')
    cy.get('.account__userpreference__setting').contains('Changer mon profil')

    cy.changeLanguage('pt')
    cy.get('.account__userpreference__setting').contains('Mudar meu perfil')
  })
})
