const express = require('express');

const os = require('os');

const fs = require('fs');

const app = express();

const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '5mb', parameterLimit: 1000000 }));
app.use(
  bodyParser.urlencoded({
    limit: '5mb',
    parameterLimit: 1000000,
    extended: false,
  })
);

const port = 8686;
const dataPath = '/home/dove';
app.listen(port, () => {
  let arr = getLocahost().map(
    (item) => `http://${item}${port == 80 ? '' : `:${port}`}`
  );
  console.log(`服务开启成功，访问地址为：\n${arr.join('\n')}`);
});
fs.mkdirSync(dataPath, { recursive: true });
app.use(express.static('./static'));
function getLocahost() {
  let obj = os.networkInterfaces();
  let arr = [];
  Object.keys(obj).forEach((item) => {
    let value = obj[item];
    if (Object.prototype.toString.call(value).slice(8, -1) === 'Array') {
      arr = [
        ...arr,
        ...value
          .filter((item) => item.family == 'IPv4')
          .map((item) => item.address),
      ];
    }
  });
  return arr;
}
app.get('/r', async (req, res) => {
  try {
    const { id } = req.query,
      p = `${dataPath}/data/${id}`;
    if (!fs.existsSync(p)) {
      res.send({ code: 1, data: '信件已销毁' });
      return;
    }
    const data = (await _readFile(p)).toString();
    res.send({ code: 0, data });
    await _unlink(p);
  } catch (error) {
    await errLog(error);
    res.send({ code: 1, data: '操作失败' });
  }
});
app.post('/w', async (req, res) => {
  try {
    const { data } = req.body,
      id = Date.now().toString(16) + Math.random().toString(16).slice(2),
      p = `${dataPath}/data/${id}`;
    await _mkdir(`${dataPath}/data`);
    await _writeFile(p, data);
    res.send({ code: 0, data: id });
  } catch (error) {
    await errLog(error);
    res.send({ code: 1, data: '操作失败' });
  }
});
function _readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}
function _unlink(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}
function _writeFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}
function _appendFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, data, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}
async function errLog(text) {
  await _mkdir(dataPath);
  await _appendFile(`${dataPath}/err.log`, `${text}\n`);
}
function _mkdir(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
