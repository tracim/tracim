import { PAGES } from '../../support/urls_commands'

describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it('should have translations', () => {
    cy.get('.homepagecard__title').contains('Welcome to Tracim')

    cy.changeLanguage('fr')
    cy.get('.homepagecard__title').contains('Bienvenue sur Tracim')

    cy.changeLanguage('pt')
    cy.get('.homepagecard__title').contains('Bem-vindo ao Tracim')
  })
})
