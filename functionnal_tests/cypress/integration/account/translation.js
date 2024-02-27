import { PAGES } from '../../support/urls_commands.js'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.contains('.userinfo__name', 'Global manager')
  })

  it('should have English translations', () => {
    cy.changeLanguage('en')
    cy.contains('.account__userpreference__setting', 'Change my account settings')
    cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
      .should('be.visible')
      .click()
    cy.contains('.iconbutton__text_with_icon', 'Manage user spaces')
      .click()
    cy.contains('.cardPopup__header__title', 'Space management of the user Global manager')
  })

  it('should have French translations', () => {
    cy.changeLanguage('fr')
    cy.contains('.account__userpreference__setting', 'Changer les paramètres de mon compte')
    cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
      .should('be.visible')
      .click()
    cy.contains('.iconbutton__text_with_icon', "Gérer les espaces de l'utilisateur")
      .click()
    cy.contains('.cardPopup__header__title', "Gestion des espaces de l'utilisateur Global manager")
  })

  it('should have Portuguese translations', () => {
    cy.changeLanguage('pt')
    cy.contains('.account__userpreference__setting', 'Mudar minhas definições de conta')
    cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
      .should('be.visible')
      .click()
    cy.contains('.iconbutton__text_with_icon', 'Gerir os espaços do utilizador')
      .click()
    cy.contains('.cardPopup__header__title', 'Gestão dos espaços do utilizador Global manager')
  })

  it('should have German translations', () => {
    cy.changeLanguage('de')
    cy.contains('.account__userpreference__setting', 'Meine Kontoeinstellungen ändern')
    cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
      .should('be.visible')
      .click()
    cy.contains('.iconbutton__text_with_icon', 'Verwalten von Benutzerbereichen')
      .click()
    cy.contains('.cardPopup__header__title', 'Bereichsmanagement für den Benutzer Global manager')
  })

  it('should have Arabic translations', () => {
    cy.changeLanguage('ar')
    cy.contains('.account__userpreference__setting', 'تغيير إعدادات حسابي')
    cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
      .should('be.visible')
      .click()
    cy.contains('.iconbutton__text_with_icon', 'الإشراف على فضاءات المستخدمين')
      .click()
    cy.contains('.cardPopup__header__title', 'إدارة فضاء المستخدم Global manager')
  })

  it('should have Spanish translations', () => {
    cy.changeLanguage('es')
    cy.contains('.account__userpreference__setting', 'Cambiar la configuración de mi cuenta')
    cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
      .should('be.visible')
      .click()
    cy.contains('.iconbutton__text_with_icon', 'Administrar espacios de usuario')
      .click()
    cy.contains('.cardPopup__header__title', 'Gestión del espacio del usuario Global manager')
  })
})
