import { PAGES } from '../../support/urls_commands'

describe('content :: home_page', function () {
  it('should have translations when no workspace is present', () => {
    cy.resetDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.HOME })

    cy.get('#content').contains('Create a shared space')

    cy.changeLanguage('fr')
    cy.get('#content').contains('Créer un espace partagé')

    cy.changeLanguage('pt')
    cy.get('#content').contains('Criar um espaço partilhado')
  })

  it('should have translations', () => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })

    cy.get('#content').contains('Welcome to Tracim')

    cy.changeLanguage('fr')
    cy.get('#content').contains('Bienvenue sur Tracim')

    cy.changeLanguage('pt')
    cy.get('#content').contains('Bem-vindo ao Tracim')
  })
})
