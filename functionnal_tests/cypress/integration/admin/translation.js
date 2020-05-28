import { PAGES } from '../../support/urls_commands.js'

describe('content :: admin > workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visit('/ui/admin/workspace')
  })

  it("should have translations", () => {
    cy.get('.adminWorkspace__description').contains('List of every shared spaces')

    cy.changeLanguage('fr')
    cy.get('.adminWorkspace__description').contains('Liste de tous les espaces partagés')

    cy.changeLanguage('pt')
    cy.get('.adminWorkspace__description').contains('Lista de todos os espaços partilhados')
  })
})

describe('content :: admin > user', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visit('/ui/admin/user')
  })

  it("should have translations", () => {
    cy.get('.adminUser__description').contains('On this page you can manage the users of your Tracim instance.')

    cy.changeLanguage('fr')
    cy.get('.adminUser__description').contains('Sur cette page, vous pouvez administrer les utilisateurs de votre instance de Tracim')

    cy.changeLanguage('pt')
    cy.get('.adminUser__description').contains('Nesta página você pode gerir os utilizadores da instância do Tracim.')
  })
})
