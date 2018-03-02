const jsonServer = require('json-server')
const jsonDb = require('./static_db.json')
const server = jsonServer.create()
const router = jsonServer.router() // for persistance : jsonServer.router('static_db.json')
const middlewares = jsonServer.defaults()
const GLOBAL_PORT = 3001

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

server.post('/user/login', (req, res) => {
  if (req.body.login !== '' && req.body.password !== '') return res.jsonp(jsonDb.user_logged)
  else return res.jsonp('error')
})

server.get('/app/config', (req, res) => res.jsonp(jsonDb.app_config))

server.get('/user/is_logged_in', (req, res) => res.jsonp(jsonDb.user_logged))

server.get('/workspace/:id', (req, res) => res.jsonp(jsonDb.workspace_detail))

server.get('/workspace/:idws/content/:idc', (req, res) => res.jsonp(jsonDb.content_data))

server.use(router)
server.listen(GLOBAL_PORT, () => {
  console.log('JSON Server is running on port : ' + GLOBAL_PORT)
})
