require('dotenv').config()
const express = require('express')
const { json } = require('body-parser')
const Audit = require('./audit')
const app = express()
const port = process.env.PORT || 8081

app.use(json({ limit: '1000kb' }))

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.protocol}://${req.hostname}`)
    console.log(req.body)
    next()
  })
}

app.get('/', (req, res) => res.status(200).send('I\'m Listening.'))

app.post('/direct', async (req, res) => {
  try {
    const audit = new Audit(req.body)
    await audit.run()
    res.json(audit.results)
  } catch (error) {
    res.sendStatus(503).json(error)
  }
})

app.post('/', (req, res) => {
  try {
    const audit = new Audit(req.body)
    res.sendStatus(201)
    audit.run(true)
  } catch (error) {
    res.status(503).json(error)
  }
})

app.post('/sub', async (req, res) => {
  if (!req.body) {
    const msg = 'no Pub/Sub message received'
    console.error(`error: ${msg}`)
    res.status(400).send(`Bad Request: ${msg}`)
    return
  }
  if (!req.body.message) {
    const msg = 'invalid Pub/Sub message format'
    console.error(`error: ${msg}`)
    res.status(400).send(`Bad Request: ${msg}`)
    return
  }

  const pubSubMessage = req.body.message
  const body = pubSubMessage.data
    ? Buffer.from(pubSubMessage.data, 'base64').toJSON()
    : {}
  console.log(body)
  const audit = new Audit(body)
  await audit.run()
  res.json(audit.results)
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
