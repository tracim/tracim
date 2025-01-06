let workspaceId
const passwordForUploadLink = 'strongPassword'
let guestUploadUrl

describe('Guest upload page', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createGuestUploadLink(workspaceId, ['dummyemail@nothingtodo.here'], passwordForUploadLink)
        .then(response => {
          if (response.status !== 200) throw Error('failed to create guest upload link')
          guestUploadUrl = response.body[0].url
        })
    })
    cy.logout()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should open with a valid token', () => {
    cy.visit(guestUploadUrl)
    cy.get('.guestupload__card__header')
  })

  it('Send button should be disabled', () => {
    cy.visit(guestUploadUrl)
    cy.get('.guestupload__card__form__right__btn').should('be.disabled')
  })

  it('Send button should be functional when all fields are filled', () => {
    cy.visit(guestUploadUrl)

    cy.get('.guestupload__card__form__right__btn').should('be.disabled')
    cy.get('.guestupload__card__form__fullname__input').type('full name')
    cy.get('.guestupload__card__form__right__btn').should('be.disabled')
    cy.get('.guestupload__card__form__groupepw__input').type('password')
    cy.get('.guestupload__card__form__right__btn').should('be.disabled')
    cy.dropFixtureInDropZone('Linux-Free-PNG.png', 'image/png', '.filecontent__form', 'file_exemple.png')
    cy.get('.guestupload__card__form__right__btn').should('not.be.disabled')
    cy.get('.guestupload__card__form__groupepw__input').clear().type(passwordForUploadLink)
    cy.get('.guestupload__card__form__right__btn').click()
    cy.get('.importConfirmation').should('be.visible')
  })
})
