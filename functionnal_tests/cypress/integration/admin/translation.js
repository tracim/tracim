import { PAGES } from '../../support/urls_commands.js'

describe('content :: admin > workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
  })

  it('should have translations', () => {
    cy.get('.adminWorkspace__description').contains('List of every spaces')

    cy.changeLanguage('fr')
    cy.get('.adminWorkspace__description').contains('Liste de tous les espaces')

    cy.changeLanguage('pt')
    cy.get('.adminWorkspace__description').contains('Lista de todos os espaços')

    cy.changeLanguage('de')
    cy.get('.adminWorkspace__description').contains('Liste aller Bereiche')
  })
})

describe('content :: admin > user', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visit('/ui/admin/user')
  })

  it('should have translations', () => {
    cy.get('.adminUser__description').contains('On this page you can manage the users of your Tracim instance.')

    cy.changeLanguage('fr')
    cy.get('.adminUser__description').contains('Sur cette page, vous pouvez administrer les utilisateurs de votre instance de Tracim')

    cy.changeLanguage('pt')
    cy.get('.adminUser__description').contains('Nesta página você pode gerir os utilizadores da instância do Tracim.')

    cy.changeLanguage('de')
    cy.get('.adminUser__description').contains('Auf dieser Seite können Sie die Benutzer Ihrer Tracim-Instanz verwalten.')
  })
})
