const system = require('system')
const host  = 'http://10.2.45.110:3033'
const casper = require('casper').create({
    // 浏览器窗口大小
    viewportSize: {
        width: 1920,
        height: 4080
    }
})
// var params = JSON.parse(system.args[4])
var params = JSON.parse('{"filename":"WechatIMG5.jpeg","captureUrl":["http://www.laohu.com"],"selector":["body"],"id":"10.2.45.1101508813689839","path":"/Users/an/Desktop/workspace/node-server"}')

const fileName = decodeURIComponent(params.filename)
const url = decodeURIComponent(params.captureUrl)
const selector = decodeURIComponent(params.selector)
const id = decodeURIComponent(params.id)
const path = decodeURIComponent(params.path)
const time = new Date().getTime()

casper.start(url)
casper.then(function() {
    this.captureSelector( path + '/assets/images/casper'+ id + time +'.png', selector)
})
casper.then(function() {
    var data = {
        'diff': path + '/assets/images/casper'+ id + time +'.png',
        'point': path + '/assets/images/' + fileName,
        'id': id
    }
    this.echo(JSON.stringify(data))
})
casper.run()


