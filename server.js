const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')
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
function send404(res){
    res.writeHead(404);
    res.end("<h1 style='text-align:center'>404</h1><p style='text-align:center'>file not found</p>")
}
function send500(res){
    res.writeHead(500);
    res.end("<h1>500</h1>服务器内部错误！")
}
