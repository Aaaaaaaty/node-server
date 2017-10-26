const fs = require('fs')
const multiparty = require('multiparty')
const { spawn } = require('child_process')
const async = require('async')
const resemble = require('resemblejs')
const zlib = require('zlib')
const gzip = zlib.createGzip()
const unzip = require('unzip')
const FS = require('../utils/fs.js')

let resObj = {}
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

    cons(dataObj)
    dataArr = Object.keys(dataObj).map((item, index) => {
        return dataObj[item][0]
    })
    fs.writeFile(configFilePath, JSON.stringify(dataArr), (err) => {
        if (err) throw err;
        cons('文件：'+ configFilePath.slice(2) +' 已经更新')
            let resData = {
                status: 200,
                msg: '已写入配置文件'
            }
            res.writeHead(200, {'Content-type':'application/json'})
            res.end(JSON.stringify(resData))
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
                cons(`日志：${resultFilePath.slice(2)}写入结束`)
                if(res) {
                    res.writeHead(200, 'OK')
                    res.end('success')
                }
            })
        })
    })
}

setInterval(startCasper, 1000 * 60 * 60 * 24)

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

function setDiffConfig(req, res) {
    let ip = req.socket.remoteAddress.slice(7),
        nowTime = new Date().getTime(),
        id = ip + nowTime
    resObj[id] = res
    resolveDiffData(req, res, id)
}

function resolveDiffData(req, res, id) {
    cons('开始处理数据')
    let form = new multiparty.Form()
    form.parse(req, function (err, fields, files) {
        let filename = files['file'][0].originalFilename,
            targetPath = `${process.cwd()}/assets/images/${filename}`,
            captureUrl = fields['captureUrl'],
            selector = fields['selector']
        if(filename && captureUrl && selector) {
            let params = {
                filename: filename,
                captureUrl: captureUrl,
                selector:selector,
                id: id,
                path: process.cwd()
            }
            let readAble = fs.createReadStream(files['file'][0].path)
            readAble.pipe(fs.createWriteStream(targetPath))
            readAble.on('end', () => {
                let path = `${process.cwd()}/child_process/casper.js`
                let casperjs = spawn('casperjs', [path, JSON.stringify(params) ])
                let body = ''
                casperjs.stdout.on('data', (data) => {
                    data = data.toString()
                    body += data
                })
                casperjs.on('close', () => {
                    console.log('截图结束，数据返回')
                    diffpx(JSON.parse(body), res)
                })
            });
        } else {
            let errData = {
                status: 400,
                msg: 'wrong params'
            }
            resObj[id].writeHead(400, {'Content-type':'application/json'})
            resObj[id].end(JSON.stringify(errData))
        }
    })
}

function diffpx(diffObj, res) { //像素对比
    let {diff, point, id} = diffObj
    resemble.outputSettings({
        errorColor: {
            red: 255,
            green: 0,
            blue: 0
        },
        errorType: 'movement'
    })
    function complete(data) {
        let imgName = 'diff'+ new Date().getTime() +'.png',
            imgUrl,
            analysisTime = data.analysisTime,
            misMatchPercentage = data.misMatchPercentage,
            resultUrl = process.cwd()+ '/assets/images/' + imgName
        console.log('对比结果完成: 像素差：' + misMatchPercentage + '%；耗时：'+ analysisTime +'ms；\n')
        fs.writeFileSync(resultUrl, data.getBuffer())
        let diffMatch = diff.slice(1).match(/images/).index
        imgObj = {
            status: 200,
            diffUrl: '/images/' + imgName,
            pointUrl: '/' + diff.slice(1).slice(diffMatch),
            analysisTime: analysisTime,
            misMatchPercentage: misMatchPercentage
        }
        let resEnd = resObj[id]
        resEnd.writeHead(200, {'Content-type':'application/json'})
        resEnd.end(JSON.stringify(imgObj))
    }
    let result = resemble(diff).compareTo(point).ignoreColors().onComplete(complete)
}

function setFsPath(req, res) {
    cons('开始处理数据')
    let ip = req.socket.remoteAddress.slice(7),
        nowTime = new Date().getTime(),
        id = `ip_${ip}_t_${nowTime}`,
        form = new multiparty.Form()

    form.parse(req, function (err, fields, files) {
        let filename = files['file'][0].originalFilename,
            targetUrl = fields['targetUrl'],
            targetPath = process.cwd() + '/assets/fspathfiles/' + id 
        if (filename) {
            cons('文件解压缩')
            fs.mkdirSync(targetPath)
            let inp = fs.createReadStream(files['file'][0].path)
            let extract = unzip.Extract({ path: targetPath })
            inp.pipe(extract)
            extract.on('error', () => {
                cons('解压出错:' + err)
                res.writeHead(500)
                res.end('error')
            })
            extract.on('close', () => {
                cons('解压完成');
                FS.fsPathRepeat(targetPath, targetUrl, res, cb)
                let resultPath
                function cb(path, res) {
                    let data = {
                        status: '200',
                        path: path
                    }
                    res.writeHead(200, {'Content-type':'application/json'})
                    res.end(JSON.stringify(data))
                }

            })
        } else {
            let errData = {
                status: 400,
                msg: 'wrong params'
            }
            res.writeHead(400, {'Content-type':'application/json'})
            res.end(JSON.stringify(errData))
        }
          
    })
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
        case 'setDiffConfig':
            setDiffConfig(req, res)
            break;
        case 'setFsPath':
            setFsPath(req, res)
            break;
    }
}

function cons(str) {
    console.log(str)
    console.log(`------------------------------------------`)
}

exports.api = api
