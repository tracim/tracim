import { PAGES } from '../../support/urls_commands'

describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it('should have translations', () => {
    cy.get('.sidebar__content__navigation__workspace__item').click()
    cy.get('.sidebar__content__navigation__workspace__item__menu').click()
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Text Documents').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('.sidebar__content__navigation__workspace__item').click()
    cy.get('.sidebar__content__navigation__workspace__item__menu').click()
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Documents texte').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('.sidebar__content__navigation__workspace__item').click()
    cy.get('.sidebar__content__navigation__workspace__item__menu').click()
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Documentos de texto').should('be.visible')
  })
})
