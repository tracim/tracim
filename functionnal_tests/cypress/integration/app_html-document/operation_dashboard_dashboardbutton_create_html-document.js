describe('operation :: workspace > create_new > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })
  it('dashborad > button', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-file-text-o').click()
    var titre1 = 'dashboard button html'
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__button.btn-primary').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    cy.get('.html-document.visible').should('be.visible')
    cy.get('.html-document.visible .html-document__contentpage__messagelist__version.revision').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
    cy.wait(2000)
    cy.get('#wysiwygNewVersion_ifr').click()
    cy.get('#wysiwygNewVersion_ifr').then(($iframe) => {
      const iframe = $iframe.contents()

      const myInput = iframe.find('#tinymce')
      cy.wrap(myInput).type('example', { force: true })

      // you don't need to trigger events like keyup or change
    })

    cy.get('button.html-document__editionmode__submit.editionmode__button__submit').click({ force: true })
    cy.wait(2000)
    cy.get('.html-document.visible .wsContentGeneric__header__close.html-document__header__close').should('be.visible')
    cy.get('.html-document.visible .wsContentGeneric__header__close.html-document__header__close').click()
    cy.get('.html-document.visible').should('not.be.visible')
    cy.wait(2000)
    cy.get('.content__name').contains(titre1).should('be.visible')

    //        Problem to write text in iframe
    //        cy.get('#wysiwygNewVersion_ifr').click()
    //        cy.get('body').type('Ceci est le début du document')
    //        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
    //        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
  })
})
