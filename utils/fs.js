const fs = require('fs')
const { exec, execSync } = require('child_process')
function fsPathRepeat(dataObj, res, cb) {
    let path = dataObj.targetPath,
        targetUrl = dataObj.targetUrl,
        ugjs = dataObj.ugjs,
        ugcss = dataObj.ugcss,
	    originPath = path,
	    dataKey = ['.js', '.css', '.html'],
	    data = [
            {	
            	'type': 'script',
            	'point': targetUrl
            },
            {	
            	'type': 'link',
            	'point': targetUrl
            },
            {
            	'type': 'img',
            	'point': targetUrl
            },
            {	
            	'type': 'background',
            	'point': targetUrl
            }
        ]
	function fsPathSys(path, dataKey) { //遍历路径
		let stat = fs.statSync(path)
		if(stat.isDirectory()) {
			fs.readdir(path, isDirectory)
			function isDirectory(err, files) {
				if(err) {
					console.log(err)
					return err
				} else {
					files.forEach((item, index) => {
						if(item === '__MACOSX') { //mac无用文件
							execSync('rm -rf '+ path +'/__MACOSX')
						} else {
							let nowPath = `${path}/${item}`
							let stat = fs.statSync(nowPath)
							if(!stat.isDirectory()) {
								dataKey.forEach((obj, index) => {
									if(~item.indexOf(obj)) {
										replaceAddress(nowPath)
									}
								})
							} else {		
								fsPathSys(nowPath, dataKey)
							}
						}
						
					})
				}
			}
		}	else {
			dataKey.forEach((obj, index) => {
				replaceAddress(path)
			})
		}
		
	}
	function replaceAddress(path) {
		let readAble = fs.createReadStream(path)
		let body = ''
		readAble.on('data', (chunk) => {
		  body += chunk
		})
		readAble.on('end', () => {
			matchData(path, data, body)
		})
	}
	function matchData(path, data, body) {
		let replaceBody = {}
		data.forEach((obj, i) => {
			if(!!obj.point[0]) {
				if (obj.type === 'script' || obj.type === 'link' || obj.type === 'img') {
					let bodyMatch = body.match(new RegExp(`<${obj.type}.*?>`, 'g'))
					if (bodyMatch) {
						bodyMatch.forEach((item, index) => {
							let itemMatch = item.match(/(src|href)\s*=\s*["|'].*?["|']/g)
							if (itemMatch) {
								itemMatch.forEach((data, i) => {
									if (data.match(/(["|']).*\//g)) {
										let matchItem = data.match(/(["|']).*\//g)[0].replace(/\s/g, '').slice(1)
										if (!replaceBody[matchItem]) {
											replaceBody[matchItem] = obj.point
										}
									}
								})
							}
						})
					}
				} else if (obj.type === 'background') {
					let bodyMatch = body.match(/url\(.*?\)/g)
					if (bodyMatch) {
						bodyMatch.forEach((item, index) => {
							if (item.match(/\(.*\//g)) {
								let itemMatch = item.match(/\(.*\//g)[0].replace(/\s/g, '').slice(1)
								if (!replaceBody[itemMatch]) {
									replaceBody[itemMatch] = obj.point
								}
							}
						})
					}
				}
			}
		})
		replaceSepical(path, body, replaceBody)	
	}

	function replaceSepical(path, body, replaceBody) {
		if(Object.keys(replaceBody).length) {
			Object.keys(replaceBody).sort((a, b) => b.length - a.length).forEach((item, index) => {
				let i = item,
					itemReplace
				if (item.match(/\.\//g)) {
					item = item.replace(/\./g, '\\\.')
				}
				itemReplace = new RegExp(item, 'g')
				body = body.replace(itemReplace, replaceBody[i])
			})
		}
		writeFs(path, body)
	}
	function writeFs(path, body) {
		fs.writeFile(path, body, (err) => {
			if (err) throw err;
			console.log('执行路径', path)
            if(ugjs && path.match(/.js/)) {
				exec(`uglifyjs ${path} -c -m -o ${path}`, (error, stdout, stderr) => {
					if(error) {
						res.writeHead(500)
						let data = {
							status: '500',
							msg: 'uglify err'
						}
						res.end(JSON.stringify(data))
						return false
					}
					if (cb) {
						cb(originPath, res)
						cb = null
					}	
				})			
			}
			else if (ugcss && path.match(/.css/)) {
				exec(`cleancss ${path} -o ${path}`, (error, stdout, stderr) => {
					if(error) {
						res.writeHead(500)
						let data = {
							status: '500',
							msg: 'cleancss err'
						}
						res.end(JSON.stringify(data))
						return false
					}
					if (cb) {
						cb(originPath, res)
						cb = null
					}	
				})			
			}
			
		})
	}
	fsPathSys(path, dataKey)
}
exports.fsPathRepeat = fsPathRepeat