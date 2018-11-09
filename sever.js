/*
 * 功能：钉钉jsapi鉴权方法node.js demo
 * 作者：scscms / ztrain
 * */

const http = require("http");
const https = require('https')
const url = require('url')
const CryptoJS = require('crypto-js')
const fs = require('fs')
const path = require('path')

//https请求
async function getHttps(url){
    return new Promise((resolve,reject)=>{
        https.get(url, (res) => {
            res.on('data', (d) => {
                resolve(JSON.parse(d));
            });
        }).on('error', (e) => {
            reject(e);
        });
    })
}

let corpid = 'ding456789123' // 企业ID
let corpsecret = '8U4NW1Ol-asd456asd456asd456asd456' // 企业钉钉密钥，一般由高级管理员管理
//获取Token　后端实现
async function getJsToken(url, agentId){
    let access_token = await getHttps(`https://oapi.dingtalk.com/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`);
    let ticket = await  getHttps('https://oapi.dingtalk.com/get_jsapi_ticket?access_token='+access_token.access_token);

    let nonceStr = Math.random().toString(32).slice(-6)
    let timeStamp = Date.now();
    let plainTex = "jsapi_ticket=" + ticket.ticket + "&noncestr=" + nonceStr + "&timestamp=" + timeStamp + "&url=" + url
    let signature = CryptoJS.SHA1(plainTex).toString()
    return {
        agentId: agentId, // agentId 应用ip  工作台内可查看
        corpId: corpid, //必填，企业ID
        timeStamp, // 必填，生成签名的时间戳
        nonceStr, // 必填，生成签名的随机串
        signature, // 必填，签名
    }
}

//从命令行参数获取root目录，默认是当前目录
let root = path.resolve(process.argv[2] || '.');

http.createServer(async function (request, response) {
	// 创建 HTTP请求头
	// 状态值： 200 OK
	// 内容类型： application/json;charset=utf-8

    let obj = url.parse(request.url, true);
    let pathname = obj.pathname;
    const query = obj.query;
    if(obj.search){
        let json = {msg: '你调用的接口:' + pathname}
        if(pathname === '/getJsToken' && query.url && query.agentId){
            json = await getJsToken(query.url, query.agentId);
        }
        response.writeHead(200,{
            "Content-Type":"application/json;charset=utf-8",
            "Connection":"keep-alive"
        });
        response.end(JSON.stringify(json));
    }else{
        //访问静态页
        let filePath = path.join(root, '/dingding_demo.html');
        fs.stat(filePath, function (err, stats) {
            if (!err && stats.isFile()) {
                response.writeHead(200);
                fs.createReadStream(filePath).pipe(response);
            } else {
                console.log('404 ' + request.url);
                response.writeHead(404);
                response.end('404 Not Found');
            }
        });
    }

	// 监听端口号 8080
}).listen(8080)

console.log('sever running at http://localhost:8080/')