var resultObj = {}
var casper = require("casper").create({
    verbose: false,
    onResourceReceived: function(casper, data) {
        var status = data['status'].toString()
        console.log('请求地址：' + data['url'])
        if(status.match(/[4|5]\d{2}/)) {
            console.log('请求地址：' + data['url'])
            console.log('状态码' + data['status'])
            console.log('--------------------------------------')
            resultObj[data['url']] = data['status']
        }       
    }
});

// The base links array
var links = [
    // "http://bbs.laohu.com/",
    // "http://kf.laohu.com/",
    // "http://zx.wanmei.com/",
    "http://zx.wanmei.com/"
];

// If we don't set a limit, it could go on forever
var upTo = ~~casper.cli.get(0) || 10;

var currentLink = 0;

// Get the links, and add them to the links array
// (It could be done all in one step, but it is intentionally splitted)
function addLinks(link) {
    this.then(function() {
        var found = this.evaluate(searchLinks);
        this.echo(found.length + " links found on " + link);
        links = links.concat(found);
    });
}

// Fetch all <a> elements from the page and return
// the ones which contains a href starting with 'http://'
function searchLinks() {
    var filter, map;
    filter = Array.prototype.filter;
    map = Array.prototype.map;
    var result = map.call(filter.call(document.querySelectorAll("a"), function(a) {
        return (/^http:\/\/.*/i).test(a.getAttribute("href"));
    }), function(a) {
        return a.getAttribute("href");
    });
    return result
}

// Just opens the page and prints the title
function start(link) {
    this.start(link, function() {
        this.echo('Page title: ' + this.getTitle());
    });
}

// As long as it has a next link, and is under the maximum limit, will keep running
function check() {
    if (links[currentLink] && currentLink < upTo) {
        this.echo('--- Link ' + currentLink + ' ---');
        start.call(this, links[currentLink]);
        addLinks.call(this, links[currentLink]);
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