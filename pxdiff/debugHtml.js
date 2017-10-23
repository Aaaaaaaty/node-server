var resultObj = {}
var casper = require("casper").create({
    verbose: false,
    onResourceReceived: function(casper, data) {
        var status = data['status'].toString()
        resultObj[data['url']] = data['status']
        console.log('请求地址：' + data['url'])
        console.log('状态码' + data['status'])
        if(status.match(/[4|5]\d{2}/)) {
            console.log('请求地址：' + data['url'])
            console.log('状态码' + data['status'])
            console.log('--------------------------------------')
            resultObj[data['url']] = data['status']
        }       
    }
});
var links = [
    // "http://bbs.laohu.com/",
    // "http://kf.laohu.com/",
    // "http://zx.wanmei.com/",
    "http://www.163.com/"
];
var currentLink = 0;
function start(link) {
    this.start(link, function() {
        this.echo('Page title: ' + this.getTitle());
    });
}
function check() {
    if (links[currentLink]) {
        this.echo('--- Link ' + currentLink + ' ---');
        start.call(this, links[currentLink]);
        currentLink++;
        this.run(check);
    } else {
        this.echo("All done.");
        this.echo(JSON.stringify(resultObj))
        this.exit();
    }
}

casper.start().then(function() {
    this.echo("Starting");
});

casper.run(check);