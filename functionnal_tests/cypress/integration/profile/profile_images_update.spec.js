import { PAGES } from '../../support/urls_commands'
import baseUser from '../../fixtures/baseUser.json'

describe('Profile Images (avatar & cover) update', () => {
  const allowedUsernames = [
    'administrators',
    'johndoe'
  ]
  for (username of allowedUsernames) {
    describe(`As ${username}`, () => {
      before(function () {
        cy.resetDB()
        cy.setupBaseDB()
        cy.loginAs(username)
        cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
      })

      it("should have an avatar button which allows to change the avatar", () => {
        cy.get('[data-cy=profile_avatar_changeBtn]')
          .should('be.visible')
          .click()
        cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', 'file_exemple1.png')
        cy.get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.get('[data-cy=profile_avatar] > img')
      })
    })
  }

  describe('As a known user', () => {
    before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      let user = null
      cy.createRandomUser().then(u => { user = u })
      cy.loginAs(user.username)
      cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
    })

    it("should NOT have a change avatar button", () => {
      cy.get('[data-cy=profile_avatar_changeBtn]')
        .should('not.exist')
    })
  })

})
