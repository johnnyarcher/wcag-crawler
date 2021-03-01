import express from 'express'
const app = express({ limit: '1000kb' })

app.use((req, res, next) => {
  console.log(req.path)
  next()
})
app.get('/', (req, res) => res.sendStatus(200))
app.post('/', async (req, res) => {
  try {
    res.json({})
  } catch (error) {
    console.error(error)
  }
})

app.listen(8081, () => console.log('I\'m Listening.'))
