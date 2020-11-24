describe('navigate :: workspace > create_new > file', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
    cy.get('.sidebar__content__navigation__item__name').click()
  })

  it('dashboard > button', function () {
    cy.get('.sidebar__content__navigation__item__name').should('be.visible')
    cy.get('.sidebar__content__navigation__item__menu').click()
    cy.get('[data-cy=sidebar_subdropdown-dashboard]').should('be.visible').click()
    cy.get('.dashboard__calltoaction .fa-paperclip').should('be.visible').click()
    cy.get('.cardPopup__container').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
    cy.get('.cardPopup__container .createcontent__contentname__title').should('be.visible')
    cy.get('.cardPopup__container .filecontent__form').should('be.visible')
    cy.get('.cardPopup__container .createcontent__form__button').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__close').should('be.visible').click()
    cy.get('.cardPopup__container .createcontent__contentname').should('not.be.visible')
    cy.get('[data-cy=dropdownCreateBtn]')
      .should('be.visible')
      .click()
    cy.get('.show .fa-paperclip')
      .should('be.visible')
      .click()
    cy.get('.cardPopup__container').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
    cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
    cy.get('.cardPopup__container .createcontent__contentname__title').should('be.visible')
    cy.get('.cardPopup__container .filecontent__form').should('be.visible')
    cy.get('.cardPopup__container .createcontent__form__button').should('be.visible')
    cy
      .get('.cardPopup__container .cardPopup__close')
      .should('be.visible')
      .click()
    cy.get('.cardPopup__container .createcontent__contentname').should('not.be.visible')
    // @philippe 05/12/2018 this button is just visible if content list have more than 10 content
    // cy
    //   .get('.workspace__content__button.dropdownCreateBtn .__label')
    //   .should('be.visible')
    //   .click()
    // cy
    //   .get('.show .subdropdown__link__file__icon')
    //   .should('be.visible').click()
    // cy.get('.cardPopup__container').should('be.visible')
    // cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
    // cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
    // cy.get('.cardPopup__container .createcontent__contentname__title').should('be.visible')
    // cy.get('.cardPopup__container .filecontent__form').should('be.visible')
    // cy.get('.cardPopup__container .createcontent__form__button').should('be.visible')
    // cy
    //   .get('.cardPopup__container .cardPopup__close')
    //   .should('be.visible')
    //   .click()
    // cy.get('.cardPopup__container .createcontent__contentname').should('not.be.visible')
  })
})
