let LOGIN_URL = '/api/v2/auth/login'

Cypress.Commands.add('create_file', () => {
})

Cypress.Commands.add('create_thread', () => {
  cy.visit('/ui/workspaces/1/dashboard')
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
})

Cypress.Commands.add('delete_file', () => {
})

Cypress.Commands.add('delete_thread', () => {
  cy.visit('/ui/workspaces/1/contents')
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

Cypress.Commands.add('loginAs', (role = 'administrators') => {
  cy.getUserByRole(role)
    .then(user => cy.request({
      method: 'POST',
      url: LOGIN_URL,
      body: {
        'email': user.email,
        'password': user.password
      }
    }))
    .then(response => cy.request({
      method: 'PUT',
      url: '/api/v2/users/'+response.body.user_id,
      body: {
        "lang": "en",
        "public_name": response.body.public_name,
        "timezone": "Europe/Paris"
        }
    })).then(response => response.body)
})

Cypress.Commands.add('logout', () => {
  cy.request('POST', 'api/v2/auth/logout')
})

Cypress.Commands.add('typeInTinyMCE', (content) => {
  cy.window()
    .its('tinyMCE')
    .its('activeEditor')
    .then(activeEditor => {
      activeEditor.setContent(content)
      activeEditor.save()
    })
})

Cypress.Commands.add('assertTinyMCEContent', (content) => {
  cy.window({ timeout: 5000 })
    .its('tinyMCE')
    .its('activeEditor')
    .then(activeEditor => {
      activeEditor.getContent()
    })
})

Cypress.Commands.add('assertTinyMCEIsActive', (isActive = true) => {
  const assertion = (isActive ? assert.isNotNull : assert.isNull)
  const message = (isActive ? 'tinyMCE is active' : 'tinyMCE is not active')
  cy.window().then(window => assertion(window.tinyMCE.activeEditor, message))
})

Cypress.Commands.add('dropFixtureInDropZone', (fixturePath, fixtureMime, dropZoneSelector) => {
  const dropEvent = { dataTransfer: { files: [] } }
  cy.fixture(fixturePath, 'base64').then(fixture => {
    return Cypress.Blob.base64StringToBlob(fixture, fixtureMime).then(blob => {
      dropEvent.dataTransfer.files.push(blob)
    })
  })

  cy.get(dropZoneSelector).trigger('drop', dropEvent)
})
