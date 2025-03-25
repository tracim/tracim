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

    cy.changeLanguageFromApiForAdminUser('fr')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
    cy.get('.adminWorkspace__description').contains('Liste de tous les espaces')

    cy.changeLanguageFromApiForAdminUser('pt')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
    cy.get('.adminWorkspace__description').contains('Lista de todos os espaços')

    cy.changeLanguageFromApiForAdminUser('de')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
    cy.get('.adminWorkspace__description').contains('Liste aller Bereiche')

    cy.changeLanguageFromApiForAdminUser('ar')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
    cy.get('.adminWorkspace__description').contains('قائمة كل الفضاءات')

    cy.changeLanguageFromApiForAdminUser('es')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
    cy.get('.adminWorkspace__description').contains('Lista de todos los espacios')
  })
})

describe('content :: admin > user', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.ADMIN_USER })
  })

  it('should have translations', () => {
    cy.get('.adminUser__description').contains('On this page you can manage the users of your Tracim instance.')

    cy.changeLanguageFromApiForAdminUser('fr')
    cy.visitPage({ pageName: PAGES.ADMIN_USER })
    cy.get('.adminUser__description').contains('Sur cette page, vous pouvez administrer les utilisateurs de votre instance de Tracim')

    cy.changeLanguageFromApiForAdminUser('pt')
    cy.visitPage({ pageName: PAGES.ADMIN_USER })
    cy.get('.adminUser__description').contains('Nesta página você pode gerir os utilizadores da instância do Tracim.')

    cy.changeLanguageFromApiForAdminUser('de')
    cy.visitPage({ pageName: PAGES.ADMIN_USER })
    cy.get('.adminUser__description').contains('Auf dieser Seite können Sie die Benutzer Ihrer Tracim-Instanz verwalten.')

    cy.changeLanguageFromApiForAdminUser('ar')
    cy.visitPage({ pageName: PAGES.ADMIN_USER })
    cy.get('.adminUser__description').contains('يمكنك على هذه الصفحة إدارة مستخدمي مثيل خادم Tracim الخاص بك.')

    cy.changeLanguageFromApiForAdminUser('es')
    cy.visitPage({ pageName: PAGES.ADMIN_USER })
    cy.get('.adminUser__description').contains('En esta página puede gestionar los usuarios de su instancia de Tracim.')
  })
})
