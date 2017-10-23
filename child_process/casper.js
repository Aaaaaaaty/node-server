const system = require('system')
const host  = 'http://10.2.45.110:3033'
const casper = require('casper').create({
    // 浏览器窗口大小
    viewportSize: {
        width: 1920,
        height: 4080
    }
})
var params = JSON.parse(system.args[4])
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
        // casper.start(host + '/form.html', function() {
        //  this.fill('form#contact-form', {
        //      'diff': './images/casper'+ id + time +'.png',
        //      'point': './images/' + fileName,
     //            'id': id
        //  }, true)
        // })
})
casper.run()


