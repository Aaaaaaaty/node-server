const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const MIME_TYPE = require('./utils/mime.js').type
const api = require('./api/api.js').api
const server = http.createServer((req, res) => {
    parsePath(req, res)
}).listen(3033)

function parsePath(req, res) {
  var pathname = url.parse(req.url).pathname  
  if(pathname.match(/api/)) {
    let apipath = pathname.slice(5)
    api(req, res, apipath)
  } else {
    let realpath = `assets${pathname}`
    sendFile(realpath, res)
  }
}

function sendFile(filePath, res) {
    if(filePath.match(/fspathfiles/)) {
        let dirName = `${filePath}.tar.gz`
        exec(`tar -zcvf ${dirName} ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                cons(`exec error: ${error}`);
                return;
            }
            let out = fs.createReadStream(dirName)
            res.writeHead(200, {
                'Content-type':'application/octet-stream',
                'Content-Disposition': 'attachment; filename=' + dirName.match(/ip_.*/)[0] 
            })
            out.pipe(res) 
        })
    }else {
        fs.open(filePath, 'r+', function(err){
            if(err){
                send404(res)
            }else{
                let ext = path.extname(filePath)
                    ext = ext ? ext.slice(1) : 'unknown'
                let contentType = MIME_TYPE[ext] || "text/plain"
                fs.readFile(filePath,function(err,data){
                    if(err){
                        send500(res)
                    }else{
                        res.writeHead(200,{'content-type':contentType})
                        res.end(data)
                    }
                })
            }
        })
    }
}
function send404(res){
    res.writeHead(404);
    res.end("<h1 style='text-align:center'>404</h1><p style='text-align:center'>file not found</p>")
}
function send500(res){
    res.writeHead(500);
    res.end("<h1>500</h1>服务器内部错误！")
}
