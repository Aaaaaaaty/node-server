const fs = require('fs')
const multiparty = require('multiparty')
const { spawn } = require('child_process')
const async = require('async')
function resolveData(req, res, cb) {
    let form = new multiparty.Form()
    form.parse(req, function (err, fields, files) {
        let data = {
            err: err,
            fields: fields,
            files: files
        }
        cb(res,data)
    })
}

function uploadconfig(res, data) {
    let dataObj = data.fields,
        configFilePath = './fileDB/apiTestConfig.txt'
        dataArr = Object.keys(dataObj).map((item, index) => {
            return dataObj[item][0]
        })
    fs.writeFile(configFilePath, JSON.stringify(dataArr), (err) => {
        if (err) throw err;
        console.log('文件：'+ configFilePath.slice(2) +' 已经更新')
        if(dataArr.length > 0) {
            let resData = {
                status: 200,
                msg: '已写入配置文件'
            }
            res.writeHead(200, {'Content-type':'application/json'})
            res.end(JSON.stringify(resData))
        }
    });
}

function startCasper(res) {
    let tp = new Date().getTime(),
        configFilePath = './fileDB/apiTestConfig.txt',
        resultFilePath = `./server_log/apiTestlog_t_${tp}.json`,
        casperPath = './child_process/casperMonitor.js',
        readAble = fs.createReadStream(configFilePath),
        body = ''
    readAble.on('data', (chunk) => {
        body += chunk
    })
    readAble.on('end', () => {
        dataArr = JSON.parse(body)
        let casperjs = spawn('casperjs', [casperPath, dataArr])
        let casperBody = ''
        casperjs.stdout.on('data', (data) => {
            data = data.toString()
            casperBody += data
        }) 
        casperjs.on('close', () => {
            fs.writeFile(resultFilePath, casperBody, (err) => {
                console.log(`日志：${resultFilePath.slice(2)}写入结束`)
                if(res) {
                    res.writeHead(200, 'OK')
                    res.end('success')
                }
            })
        })
    })
}

function sendData(req, res) {
    let path = './server_log'
    fs.readdir(path, asyncWriteBody)
    function asyncWriteBody(err, files) {
        let fnArr = files.map((item, index) => {
            let filePath = './server_log/' + item
            let readAble = fs.createReadStream(filePath)
            let dataArr = []
            if(!index) {
                return function(cb) { 
                    let data = ''
                    readAble.on('data', (chunk) => {
                        data += chunk
                    })
                    readAble.on('end', () => {
                        dataArr.push(data)
                        cb(null, dataArr)
                    })
                }  
            } else {
                return function(dataArr, cb) {
                    let data = ''
                    readAble.on('data', (chunk) => {
                        data += chunk
                    })
                    readAble.on('end', () => {
                        dataArr.push(data)
                        cb(null, dataArr)
                    })
                } 
            }
        })
        async.waterfall(fnArr, function (err, results) {
            if(err) return err
            res.writeHead(200, {'Content-type':'application/json'})
            res.end(JSON.stringify(results))
        })
    }
}

function sendConfig(res) {
    let configFilePath = './fileDB/apiTestConfig.txt'
    let readAble = fs.createReadStream(configFilePath)
    res.writeHead(200, {'Content-type':'text/plain'})
    readAble.pipe(res)
}


function api(req, res, path) {
    switch(path)
    {
        case 'uploadConfig':
            resolveData(req, res, uploadconfig)
            break;
        case 'getConfigLogs':
            sendData(req, res)
            break;
        case 'getConfig':
            sendConfig(res)
            break;
        case 'setTestConfig':
            startCasper(res)
            break;
    }
}

exports.api = api
