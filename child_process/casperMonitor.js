const system = require('system')
var resultObj = {}
var casper = require("casper").create({
    verbose: false,
    onResourceReceived: function(casper, data) {
        var status = data['status'].toString()
        if(status.match(/[4|5]\d{2}/)) {
            resultObj[data['url']] = {}
            resultObj[data['url']]['status'] = data['status']
            resultObj[data['url']]['from'] = currentUrl
        }       
    }
});
var urls = system.args[4]
var links = urls.split(',')
var currentLink = 0
var currentUrl
function start(link) {
    currentUrl = link
    this.start(link, function() {});
}
function check() {
    if (links[currentLink]) {
        start.call(this, links[currentLink]);
        currentLink++;
        this.run(check);
    } else {
        var result = {
            'result': JSON.stringify(resultObj),
            't': new Date().getTime(),
        }
        this.echo(JSON.stringify(result))
        this.exit();
    }
}

casper.start().then(function() {
})

casper.run(check);