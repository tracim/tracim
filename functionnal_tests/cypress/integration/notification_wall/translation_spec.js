import { PAGES } from '../../support/urls_commands'

describe('Notification Wall', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    this.skip() // FIXME - GB - 2020-08-10 - To be activate when the notification wall (https://github.com/tracim/tracim/issues/2840) and button's header (https://github.com/tracim/tracim/issues/3323) were merge
  })

  it('should have translations', () => {
    cy.get('.notification__header__title').contains('Notifications')

    cy.changeLanguage('fr')
    cy.get('.notification__header__title').contains('Notifications')

    cy.changeLanguage('pt')
    cy.get('.notification__header__title').contains('Notificações')
  })
})
