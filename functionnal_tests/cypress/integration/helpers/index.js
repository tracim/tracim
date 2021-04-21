export function login (cy) {
  cy.visit('/login')
  cy.get('input[type=email]').should('be.visible')
  cy.get('input[type=email]').type('admin@admin.admin')
  cy.get('input[type=password]').should('be.visible')
  cy.get('input[type=password]').type('admin@admin.admin')
  cy.get('.connection__form__btnsubmit').should('be.visible')
  cy.get('.connection__form__btnsubmit').click()
}

export function logout (cy) {
  cy.get('.dropdownMenuButton.profilgroup__name.btn').click()
  cy.get('div.setting__link .fa-sign-out-alt').click()
}

export function create_file (cy) {
}

export function create_thread (cy) {
  cy.visit('/workspaces/1/dashboard')
  cy.get('.dashboard__workspace__detail').should('be.visible')
  cy.get('.dashboard__workspace__rightMenu__contents .fa-comments').should('be.visible')
  cy.get('.dashboard__workspace__rightMenu__contents .fa-comments').click()
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
}

// DEPRECATED - CH - 2019-05-15 - Best way is to use the function in helpers/htmldoc.js
// the function in helpers/htmldoc.js is the same as this one minus the cy.visit
export function create_htmldocument (cy) {
  cy.visit('/workspaces/1/dashboard')
  cy.get('.dashboard__workspace__detail').should('be.visible')
  cy.get('.dashboard__workspace__rightMenu__contents .fa-file-alt').should('be.visible')
  cy.get('.dashboard__workspace__rightMenu__contents .fa-file-alt').click()
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
}

export function delete_file (cy) {
}

export function delete_thread (cy) {
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
}

export function delete_htmldocument (cy) {
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
}

export function loginAsAdmin (cy) {
  var body = {
    email: 'admin@admin.admin',
    password: 'admin@admin.admin'
  }
  cy.request('POST', '/api/sessions/login', body)
}

export function assertPopupCreateContent (cy) {
  cy.get('.cardPopup__container').should('be.visible')
  cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
  cy.get('.cardPopup__container .cardPopup__close').should('be.visible')
  cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
  cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
}
