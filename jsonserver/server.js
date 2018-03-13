const jsonServer = require('json-server')
const jsonDb = require('./static_db.json')
const timezoneDb = require('./timezone.json')
const server = jsonServer.create()
const router = jsonServer.router() // for persistence : jsonServer.router('static_db.json')
const middlewares = jsonServer.defaults()
const GLOBAL_PORT = 3001

function shuffle(array) {
  let currentIndex = array.length
  let randomIndex

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    ;[array[randomIndex], array[currentIndex]] = [array[currentIndex], array[randomIndex]]
  }

  return array;
}

server.use(middlewares)
server.use(jsonServer.bodyParser)

// res.jsonp(req.query)
server.get('/echo', (req, res) => res.jsonp('gg'))
server.get('/login', (req, res) => res.jsonp(jsonDb.login))
server.get('/user_logged', (req, res) => res.jsonp(jsonDb.user_logged))
server.delete('/deletenodata', (req,res) => res.status(204).jsonp(''))
server.patch('/user', (req, res) => res.jsonp({lang: 'fr'}))
// server.put('/api/data/raw_materials_vendors/:vendorid', (req, res) => {
//  res.jsonp(jsonVendorColorData.vendorVariableData)
//   console.log(req.body)
//   res.jsonp('gg')
// })

server.get('/lang', (req, res) => res.jsonp(jsonDb.lang))

server.post('/user/login', (req, res) => {
  if (req.body.login !== '' && req.body.password !== '') return res.jsonp(jsonDb.user_logged)
  else return res.jsonp('error')
})

server.get('/app/config', (req, res) => res.jsonp(jsonDb.app_config))

server.get('/user/is_logged_in', (req, res) => res.jsonp(jsonDb.user_logged))

server.get('/user/:id/workspace', (req, res) => res.jsonp(jsonDb.workspace_list))

server.get('/workspace/:id', (req, res) => res.jsonp(
  // {...jsonDb.workspace_detail, content: shuffle(jsonDb.workspace_detail.content)})
  Object.assign({}, jsonDb.workspace_detail, {content: shuffle(jsonDb.workspace_detail.content)})
))

server.get('/user/:id/roles', (req, res) => res.jsonp(jsonDb.user_role))

server.get('/timezone', (req, res) => res.jsonp(timezoneDb.timezone))

server.get('/workspace/:idws/content/:idc', (req, res) => {
  switch (req.params.idc) {
    case '1': // pageHtml
      return res.jsonp(jsonDb.content_data_pageHtml)
    case '2':
      return res.jsonp(jsonDb.content_data_thread)
  }
})

server.get('/workspace/:idws/content/:idc/timeline', (req, res) => {
  switch (req.params.idc) {
    case '1': // pageHtml
      return res.jsonp(jsonDb.timeline)
    case '2':
      return res.jsonp([])
  }
})

server.use(router)
server.listen(GLOBAL_PORT, () => {
  console.log('JSON Server is running on port : ' + GLOBAL_PORT)
})
