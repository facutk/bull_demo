/**
 * Nevermind this file, it's just all the project in a single file
*/
const { v4: uuidv4 } = require('uuid');
let express = require('express');
let Queue = require('bull');

const { setQueues, BullAdapter } = require('bull-board')
const { router } = require('bull-board')

const port = process.env.PORT || 5000

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let app = express();

let workQueue = new Queue('work', REDIS_URL);
let infoQueue = new Queue('info', REDIS_URL);

setQueues([
  new BullAdapter(workQueue),
  new BullAdapter(infoQueue)
]);

app.use('/queues', router)
app.post('/job', async (req, res) => {
  let job = await workQueue.add({
    url: '',
    delay: 0,
    onOpen: ''
  }, {
    jobId: uuidv4(),
    removeOnComplete: false,
    attempts: 3,
    removeOnFail: true
  });
  await infoQueue.add({
    workJobId: job.id
  }, {
    jobId: job.id,
    delay: 1000 * 60 * 10, // delete job after 10 minutes
    removeOnComplete: true
  });
  res.send(job.id);
});

// Allows the client to query the state of a background job
app.get('/job/:id', async (req, res) => {
  const id = req.params.id;
  const poll = !!req.query.poll;

  const job = await workQueue.getJob(id);

  if (job === null) {
    return res.status(404).end();
  }
  
  if (poll) {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    return res.json({ id, state, progress, reason });
  }

  const { returnvalue } = job;
  const { value } = returnvalue;

  return res.send(value);
});

app.get('/info/:id', async (req, res) => {
  const id = req.params.id;

  const info = await infoQueue.getJob(id);

  if (info === null) {
    return res.status(404).end();
  }
  
  let state = await info.getState();
  let progress = info._progress;
  let reason = info.failedReason;
  const delayedTimestamp = info.delayedTimestamp;
  return res.json({ id, delayedTimestamp, state, progress, reason });
});


const MAX_JOBS_PER_WORKER = 1;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

workQueue.process(MAX_JOBS_PER_WORKER, async (job) => {
  let progress = 0;

  if (Math.random() < 0.05) {
    throw new Error("This job failed!")
  }

  while (progress < 100) {
    await sleep(50);
    progress += 1;
    job.progress(progress)
  }

  return { value: "This will be stored" };
});

infoQueue.process(async (job) => {
  const workJob = await workQueue.getJob(job.data.workJobId);
  if (!workJob) {
    return;
  }
  workJob.remove();
});

infoQueue.on('global:completed', async () => {
  const { waiting, delayed } = await infoQueue.getJobCounts();
  const pending = waiting + delayed;

  if (pending === 0) {
    console.log('No more pending jobs, purging queues');
    await workQueue.obliterate({ force: true });
    await infoQueue.obliterate({ force: true });
  }
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
