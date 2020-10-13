import { PAGES } from '../../support/urls_commands'

describe('The sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it('should have translations', () => {
    cy.get('.sidebar__content__navigation__workspace__item').should('be.visible').click()
    cy.get('.sidebar__content__navigation__workspace__item__menu').should('be.visible').click()
    cy.get('li').contains('All Contents').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('.sidebar__content__navigation__workspace__item').should('be.visible').click()
    cy.get('.sidebar__content__navigation__workspace__item__menu').should('be.visible').click()
    cy.get('li').contains('Tous les contenus').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('.sidebar__content__navigation__workspace__item').should('be.visible').click()
    cy.get('.sidebar__content__navigation__workspace__item__menu').should('be.visible').click()
    cy.get('li').contains('Todos os conteúdos').should('be.visible')
  })
})
