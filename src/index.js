import express from 'express'
import { Audit } from './audit'

const app = express({ limit: '1000kb' })
const port = process.env.PORT || 8081

app.use((req, res, next) => {
  console.log(req.path, req.body)
  next()
})
app.get('/', (req, res) => res.sendStatus(200))

app.post('/', async (req, res) => {
  try {
    new Audit(req.body)
    res.json({})
  } catch (error) {
    console.error(error)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
