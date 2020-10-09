const userFixtures = {
  administrators: 'defaultAdmin',
  'trusted-users': '',
  users: 'baseUser'
}

function makeRandomString (length = 5) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

Cypress.Commands.add('addUserToWorkspace', (userId, workspaceId, role = 'contributor') => {
  const body = {
    role: role,
    user_id: userId
  }
  cy.request('POST', `/api/workspaces/${workspaceId}/members`, body)
})

Cypress.Commands.add('execAsAdmin', (user, callback) => {
  cy.logout()
  cy.loginAs('administrators').then(() => {
    return callback().then(res => cy.log(res.email))
  }).then((result) => {
    cy.logout()
    cy.login(user)
  })
})

Cypress.Commands.add('enableAgenda', (workspace, enabled = true) => {
  const data = {
    agenda_enabled: enabled
  }
  cy.request('PUT', `/api/workspaces/${workspace.workspace_id}`, data).then(response => response.body)
})

Cypress.Commands.add('disableUser', (userId) =>
  cy.request('PUT', `/api/users/${userId}/disabled`).then(response => response.body)
)

Cypress.Commands.add('enableUser', (userId) =>
  cy.request('PUT', `/api/users/${userId}/enabled`).then(response => response.body)
)

Cypress.Commands.add('createRandomUser', (profile = 'users') => {
  const fullName = makeRandomString()
  const username = makeRandomString()

  const data = {
    email: `${fullName}@tracim.fr`,
    email_notification: false,
    lang: 'en',
    password: '8QLa$<w',
    profile: profile,
    public_name: fullName,
    username: username,
    timezone: 'Europe/Paris'
  }
  return cy
    .request('POST', '/api/users', data)
    .then(response => {
      response.body.password = '8QLa$<w'
      return response.body
    })
})

Cypress.Commands.add('createUser', (fixturePath = 'baseUser') => {
  return cy
    .fixture(fixturePath)
    .then(userJSON => cy.request('POST', '/api/users', userJSON))
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createRandomWorkspace', () => {
  const workspaceName = makeRandomString()
  let url = '/api/workspaces'
  const data = {
    description: `A super description of ${workspaceName}.`,
    label: workspaceName,
    access_type: 'confidential',
    default_user_role: 'reader'
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createWorkspace', (fixturePath = 'baseWorkspace') => {
  let url = '/api/workspaces'
  return cy
    .fixture(fixturePath)
    .then(workspaceJSON => cy.request('POST', url, workspaceJSON))
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('setupBaseDB', () => {
  const accum = (...cmds) => {
    const results = []

    cmds.forEach((cmd) => {
      cmd().then(results.push.bind(results))
    })

    return cy.wrap(results)
  }
  cy.loginAs('administrators')
  accum(
    cy.createUser,
    cy.createWorkspace
  )
    .then(([user, workspace]) => {
      cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
    })
    .then(() => cy.logout())
})

Cypress.Commands.add('resetDB', () => {
  cy.exec('rm -rf ./sessions_data')
  cy.exec('rm -rf ./sessions_lock')
  cy.exec('cp /tmp/tracim_cypress.sqlite.tmp /tmp/tracim_cypress.sqlite')
  cy.cleanSessionCookies()
})

Cypress.Commands.add('getUserByRole', (role) => {
  return cy
    .fixture(userFixtures[role])
})

Cypress.Commands.add('createHtmlDocument', (title, workspaceId, parentId = null) => {
  let url = `/api/workspaces/${workspaceId}/contents`
  let data = {
    content_type: 'html-document',
    label: title,
    parent_id: parentId
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('updateHtmlDocument', (contentId, workspaceId, text, title) => {
  let url = `/api/workspaces/${workspaceId}/html-documents/${contentId}`
  let data = {
    raw_content: text,
    label: title
  }
  cy
    .request('PUT', url, data)
    .then(response => response.body)
})

Cypress.Commands.add('changeHtmlDocumentStatus', (contentId, workspaceId, status) => {
  let url = `/api/workspaces/${workspaceId}/html-documents/${contentId}/status`
  let data = { status: status }
  cy
    .request('PUT', url, data)
    .then(response => response.body)
})

Cypress.Commands.add('createThread', (title, workspaceId, parentId = null) => {
  let url = `/api/workspaces/${workspaceId}/contents`
  let data = {
    content_type: 'thread',
    label: title,
    parent_id: parentId
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createFolder', (title, workspaceId, parentId = null) => {
  let url = `/api/workspaces/${workspaceId}/contents`
  let data = {
    content_type: 'folder',
    label: title,
    parent_id: parentId
  }
  cy
    .request('POST', url, data)
    .then(response => {
      if (response === undefined) {
        // FIXME -  CH - 2019/05/03 - when we send simultaneous request to create contents we
        // end up with an undefined response we need to dig up to find if it's the server or cypress
        // Issue 1836
        cy.log(`undefined response for request to url ${url} and body ${JSON.stringify(data)}`)
        cy.wrap(undefined).should('be.undefined')
      } else {
        return response.body
      }
    })
})

Cypress.Commands.add('createFile', (fixturePath, fixtureMime, fileTitle, workspaceId, parentId = null) => {
  let url = `/api/workspaces/${workspaceId}/files`

  return cy.fixture(fixturePath, 'base64')
    .then(fixture => Cypress.Blob.base64StringToBlob(fixture, fixtureMime))
    .then(blob => {
      const form = new FormData()

      form.set('files', blob, fileTitle)
      if (parentId) form.set('parent_id', parentId)

      return cy.form_request('POST', url, form)
    })
})

Cypress.Commands.add('updateFile', (fixturePath, fixtureMime, workspaceId, contentId, fileTitle) => {
  let url = `/api/workspaces/${workspaceId}/files/${contentId}/raw/${fileTitle}`

  return cy.fixture(fixturePath, 'base64')
    .then(fixture => Cypress.Blob.base64StringToBlob(fixture, fixtureMime))
    .then(blob => {
      const form = new FormData()

      form.set('files', blob, fileTitle)

      return cy.form_request('PUT', url, form)
    })
})

Cypress.Commands.add('logInFile', (message, logPath = '/tmp/cypress.log') => {
  cy.exec(`echo "${message}" >> ${logPath}`)
  cy.exec(`echo "\n" >> ${logPath}`)
  cy.exec(`echo ---------- >> ${logPath}`)
  cy.exec(`echo "\n" >> ${logPath}`)
})

Cypress.Commands.add('createGuestUploadLink', (workspaceId, emailList, password = '') => {
  const url = `/api/workspaces/${workspaceId}/upload_permissions`
  const data = {
    emails: emailList,
    password
  }
  return cy.request('POST', url, data)
})
