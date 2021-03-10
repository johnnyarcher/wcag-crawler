require('dotenv').config()
const express = require('express')
const { json } = require('body-parser')
const Audit = require('./audit')
const app = express()
const port = process.env.PORT || 8081

app.use(json({ limit: '1000kb' }))

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.protocol}://${req.hostname}`, req.body)
    next()
  })
}

app.get('/', (req, res) => res.status(200).send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    const client = process.env.NODE_ENV !== 'production'
      ? `${req.protocol}://${req.hostname}:7564`
      : process.env.TARGET
        ? `${TARGET}`
        : `${req.protocol}://${req.hostname}`
    const audit = new Audit(req.body)
    res.sendStatus(201)
    await audit.run()
    await audit.send(client, audit.results)
  } catch (error) {
    res.send(error)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
