const express = require('express');
const jobRouter = require('./job.router');
const { PORT } = require('./config');

const app = express();
app.use(express.json());
app.use(express.static('public'))
app.use('/job', jobRouter)

app.listen(PORT, () => {
  console.log(`Queue app listening at http://localhost:${PORT}`);
});
