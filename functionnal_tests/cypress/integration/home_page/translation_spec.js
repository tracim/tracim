import { PAGES } from '../../support/urls_commands'

describe('content :: home_page', function () {
  it('should have translations when no workspace is present', () => {
    cy.resetDB()
    cy.loginAs('administrators')
    cy.createRandomUser('administrators').then(user => cy.login(user))
    cy.visitPage({ pageName: PAGES.HOME })

    cy.contains('#content', 'Create a space')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.contains('#content', 'Créer un espace')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.contains('#content', 'Criar um espaço')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.contains('#content', 'Einen Bereich schaffen')
  })

  it('should have translations', () => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createRandomUser().then(user => cy.login(user))
    cy.visitPage({ pageName: PAGES.HOME })

    cy.contains('#content', 'Welcome to Tracim')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.contains('#content', 'Bienvenue sur Tracim')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.contains('#content', 'Bem-vindo ao Tracim')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.contains('#content', 'Willkommen bei Tracim')
  })
})
