const fs = require('fs')
const multiparty = require('multiparty')


function resolveData(req, res, cb) {
    let form = new multiparty.Form()
    form.parse(req, function (err, fields, files) {
        let data = {
            err: err,
            fields: fields,
            files: files
        }
        cb(res,data)
        // let filename = files['file'][0].originalFilename,
        //     targetPath = __dirname + '/images/' + filename,
        //     captureUrl = fields['captureUrl'],
        //     selector = fields['selector']
        // if(filename && captureUrl && selector) {
        //     fs.createReadStream(files['file'][0].path).pipe(fs.createWriteStream(targetPath))
        //     let casperjs = spawn('casperjs', ['casper.js', filename, captureUrl, selector, id])
        //     casperjs.stdout.on('data', (data) => {
        //         data = data.toString().replace(/[\r\n]/g, "")
        //         console.log(`数据日志：${data}`)
        //          console.log(`------------------------------------------`)
        //     }) 
        // } else {
        //     let errData = {
        //         status: 400,
        //         msg: 'wrong params'
        //     }
        //     resObj[id].writeHead(400, {'Content-type':'application/json'})
        //     resObj[id].end(JSON.stringify(errData))
        // }
    })
}

function uploadconfig(res, data) {
    console.log(data)
}

function api(req, res, path) {
    switch(path)
    {
        case 'uploadconfig':
            resolveData(req, res, uploadconfig)
    }
}

exports.api = api