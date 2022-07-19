import { PAGES } from '../../support/urls_commands'

describe('The sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it('should have translations', () => {
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('li').contains('Contents').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('li').contains('Contenus').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('li').contains('Conteúdos').should('be.visible')

    cy.changeLanguage('de')
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('li').contains('Inhalt').should('be.visible')

    cy.changeLanguage('ar')
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('li').contains('المحتوى').should('be.visible')

    cy.changeLanguage('es')
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').should('be.visible').click()
    cy.get('.sidebar__content__navigation__item__menu').should('be.visible').click()
    cy.get('li').contains('Contenidos').should('be.visible')
  })
})
