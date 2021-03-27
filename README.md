# bull_demo

Heavy background jobs queue system using redis + bull
![Demo](https://raw.githubusercontent.com/facutk/bull_demo/main/demo.gif)

## Install
```
git clone git@github.com:facutk/bull_demo.git
cd bull_demo
npm i
npm run dev
```

## Usage
```
# create a job
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"foo": "bar"}' \
  http://localhost:5000/job

# get job progress
curl http://localhost:5000/job/[uuid]/poll

# get job results
curl http://localhost:5000/job/[uuid]
```

## UI
  - Dummy UI: http://localhost:5000/job/queues/
  - Bull Dashboard: http://localhost:5000/job/queues/
