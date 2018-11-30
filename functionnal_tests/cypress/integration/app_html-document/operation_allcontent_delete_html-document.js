describe('operation :: workspace > delete > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })
  it('all content > delete html-doc', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-file-text-o').click()
    var titre1 = 'createhtml-document'
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__button.btn-primary').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    cy.get('.html-document.visible').should('be.visible')
    cy.get('.html-document.visible .html-document__contentpage__messagelist__version.revision').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
    //        cy.get('iframe#wysiwygNewVersion_ifr').should('be.visible')
    //        const $tinymce = Cypress.$.event(document)
    cy.wait(2000)
    cy.get('.html-document.visible .wsContentGeneric__header__close.html-document__header__close').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__close.html-document__header__close').click()
    cy.get('.html-document.visible').should('not.be.visible')
    cy.wait(2000)
    cy.get('.content__name').contains(titre1).should('be.visible')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    var titre1 = 'createhtml-document'
    cy.get('.content__name').each(($elm) => {
      cy.wrap($elm).invoke('text').then((text) => {
        if (text === titre1) {
          cy.get('.content__name').contains(titre1).click()
          cy.get('.html-document.visible').should('be.visible')
          cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
          cy.wait(2000)
          cy.get('.align-items-center button:nth-child(2)').click()
          cy.get('.html-document__contentpage__textnote__state__btnrestore').should('be.visible')
          cy.get('.html-document__header__close').click()
          cy.get('.html-document.visible').should('not.be.visible')
          cy.wait(2000)
        }
      })
    })
  })
})
