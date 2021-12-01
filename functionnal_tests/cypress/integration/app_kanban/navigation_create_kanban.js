describe('navigate :: workspace > create_new > kanban', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
    cy.get('[data-cy=sidebar__content__navigation__workspace__item_1]').click()
  })

  it('dashboard > button', function () {
    cy.get('.sidebar__content__navigation__item__name').should('be.visible')
    cy.get('.sidebar__content__navigation__item__menu').click()
    cy.get('[data-cy=sidebar_subdropdown-dashboard]').should('be.visible').click()
    cy.get('.dashboard__workspace__rightMenu__contents .fa-columns').should('be.visible').click()
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.disabled')
    cy.get('[data-cy=createcontent__form__input]').type('Hello Kanban (from dashboard)')
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.enabled').click()
  })

  it('workspace contents > button', function () {
    cy.get('.sidebar__content__navigation__item__name').should('be.visible')
    cy.get('.sidebar__content__navigation__item__menu').click()
    cy.get('[data-cy="sidebar_subdropdown-contents/all"]').should('be.visible').click()
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.contains('Kanban').click()
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.disabled')
    cy.get('[data-cy=createcontent__form__input]').type('Hello Kanban (from contents)')
    cy.get('[data-cy=popup__createcontent__form__button]').should('be.enabled').click()
  })
})
