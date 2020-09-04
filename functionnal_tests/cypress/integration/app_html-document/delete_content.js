describe('delete a html-document content', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createHtmlDocument('firstHtmlDoc', 1)
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should show the content as deleted and remove it from the content list', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-file-text-o').click()
    var titre1 = 'createhtml-document'
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    cy.get('.html-document.visible').should('be.visible')
    cy.get('.html-document.visible .html-document__contentpage__messagelist__version.revision').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
    //        cy.get('iframe#wysiwygNewVersion_ifr').should('be.visible')
    //        const $tinymce = Cypress.$.event(document)
    cy.get('.html-document.visible .wsContentGeneric__header__close.html-document__header__close').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__close.html-document__header__close').click()
    cy.get('.html-document.visible').should('not.be.visible')
    cy.get('.content__name').contains(titre1).should('be.visible')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')

    titre1 = 'createhtml-document'
    cy.get('.content__name').each(($elm) => {
      cy.wrap($elm).invoke('text').then((text) => {
        if (text === titre1) {
          cy.get('.content__name').contains(titre1).click()

          cy.waitForTinyMCELoaded().then(() => {
            cy.get('.html-document.visible').should('be.visible')
            cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
            cy.get('.wsContentGeneric__option__menu__action[data-cy="delete__button"]').click()
            cy.get('.html-document__contentpage__left__wrapper > [data-cy="promptMessage"] .promptMessage__btn').should('be.visible')
            cy.get('.html-document__header__close').click()
            cy.get('.html-document.visible').should('not.be.visible')
            cy.get('.content__name').contains(titre1).should('not.exist')
          })
        }
      })
    })
  })
})
