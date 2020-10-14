describe('operation :: workspace > delete > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('all content > delete custom-form', function () {
    // TODO Custom_form tests are skipped for now, tests must be enabled when the app will be activated
    // see: https://github.com/tracim/tracim/issues/2895
    this.skip()
    cy.loginAs('administrators')
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').click()
    var titre1 = 'createcustom-form'
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    cy.get('.custom-form.visible').should('be.visible')
    cy.get('.custom-form.visible .custom-form__contentpage__messagelist__version.revision').should('be.visible')
    cy.get('.custom-form.visible .wsContentGeneric__header__title').contains(titre1)
    //        cy.get('iframe#wysiwygNewVersion_ifr').should('be.visible')
    //        const $tinymce = Cypress.$.event(document)
    cy.get('.custom-form.visible .wsContentGeneric__header__close.custom-form__header__close').should('be.visible')
    cy.get('.custom-form.visible .wsContentGeneric__header__close.custom-form__header__close').click()
    cy.get('.custom-form.visible').should('not.be.visible')
    cy.get('.content__name').contains(titre1).should('be.visible')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    titre1 = 'createcustom-form'
    cy.get('.content__name').each(($elm) => {
      cy.wrap($elm).invoke('text').then((text) => {
        if (text === titre1) {
          cy.get('.content__name').contains(titre1).click()
          cy.get('.custom-form.visible').should('be.visible')
          cy.get('.custom-form.visible .wsContentGeneric__header__title').contains(titre1)
          cy.get('.align-items-center button:nth-child(2)').click()
          cy.get('.custom-form__contentpage__left__wrapper > [data-cy="promptMessage"] .promptMessage__btn').should('be.visible')
          cy.get('.custom-form__header__close').click()
          cy.get('.custom-form.visible').should('not.be.visible')
        }
      })
    })
  })
})
