let LOGIN_URL = '/api/v2/auth/login'

Cypress.Commands.add('create_file', () => {
})

Cypress.Commands.add('create_thread', () => {
  cy.visit('/workspaces/1/dashboard')
  cy.get('.dashboard__workspace__detail').should('be.visible')
  cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
  cy.get('.dashboard__calltoaction .fa-comments-o').click()
  var titre1 = 'createthread'
  cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
  cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
  cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
  cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
  cy.get('.cardPopup__container .createcontent button.createcontent__form__button').click()
  cy.get('.cardPopup__container .createcontent  .createcontent__contentname').should('not.be.visible')
  cy.get('.thread.visible').should('be.visible')
  cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
  cy.get('.thread.visible .thread__contentpage__header__close').click()
  cy.get('.thread.visible').should('not.be.visible')
})

Cypress.Commands.add('create_htmldocument', () => {
  cy.visit('/workspaces/1/dashboard')
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
})

Cypress.Commands.add('delete_file', () => {
})

Cypress.Commands.add('delete_thread', () => {
  cy.visit('/workspaces/1/contents')
  cy.get('.pageTitleGeneric__title__icon').should('be.visible')
  var titre1 = 'createthread'
  cy.get('.content__name').each(($elm) => {
    cy.wrap($elm).invoke('text').then((text) => {
      if (text === titre1) {
        cy.get('.content__name').contains(titre1).click()
        cy.get('.thread.visible').should('be.visible')
        cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
        cy.get('.thread.visible .align-items-center button:nth-child(2)').click()
        cy.get('.thread.visible .timeline__info__btnrestore').should('be.visible')
        cy.get('.thread.visible .thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
      }
    })
  })
})

Cypress.Commands.add('delete_htmldocument', () => {
  cy.visit('/workspaces/1/contents')
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

Cypress.Commands.add('login', (role = 'administrators') => {
  const userFixtures = {
    'administrators': 'defaultAdmin',
    'trusted-users': '',
    'users': 'baseUser'
  }

  return cy
    .fixture(userFixtures[role])
    .then(userJSON => cy.request({
      method: 'POST',
      url: LOGIN_URL,
      body: {
        'email': userJSON.email,
        'password': userJSON.password
      }
    }))
})

Cypress.Commands.add('logout', () => {
  cy.request('POST', 'api/v2/auth/logout')
})
