import { PAGES as p } from '../../support/urls_commands.js'

describe('operation :: workspace > create_new > html-document', function () {
  const titre1 = 'dashboard button html'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })
  it.skip('dashboard > button', function () {
    // FIXME - RJ - 2022-02-16 - disabled test (see #5436)
    cy.visitPage({
      pageName: p.DASHBOARD,
      params: { workspaceId: 1 }
    })
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents .fa-file-alt').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents .fa-file-alt').click()
    cy.get('.cardPopup__container .cardPopup__header__title').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.get('.cardPopup__container .cardPopup__header__title').should('not.be.visible')
    cy.get('.html-document.visible').should('be.visible')
    cy.get('.html-document.visible .html-document__contentpage__timeline__messagelist__version.revision').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)

    cy.waitForTinyMCELoaded()
      .then(() => cy.typeInTinyMCE('example'))

    cy.get('button.html-document__editionmode__submit.editionmode__button__submit').click()
    cy.get('.html-document__contentpage__header__close').should('be.visible').click()
    cy.get('.html-document.visible').should('not.be.visible')
    cy.get('.content__name').contains(titre1).should('be.visible')
  })
})
