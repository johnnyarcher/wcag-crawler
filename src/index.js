require('dotenv').config()
const express = require('express')
const { json } = require('body-parser')
const Audit = require('./audit')
const app = express()
const port = process.env.PORT || 8081

app.use(json({ limit: '1000kb' }))

app.use((req, res, next) => {
  console.log(req.path, req.body)
  next()
})

app.get('/', (req, res) => res.status(200).send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    const audit = new Audit()
    await audit.run(req.body)
    const result = audit.results()
    res.json(result)
  } catch (error) {
    console.error(error)
    res.send(error)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
