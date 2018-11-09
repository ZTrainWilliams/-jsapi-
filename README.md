# 钉钉jsapi使用案例
```
对钉钉的H5开发，钉钉提供了一些原生能力的jsapi方法，通过api调用是手机的基础能力或容器的功能，部分api的调用不需要进行鉴权（即不需要进行dd.config）。
*1 推荐查阅的钉钉移动端开发文档：
  https://open-doc.dingtalk.com/docs/doc.htm?spm=a219a.7629140.0.0.3e764a97AKNugb&treeId=171&articleId=104906&docType=1
*2 需鉴权spi方法的调用此页面，保证在后台管理工作台已有应用中设置后在手机钉钉查看
*3 引入钉钉线上js文档时，确保版本与钉钉开发文档一直，最好使用最新版本
*4 钉钉内置浏览器版本js_es6以上的大部分语法不支持，需保证js语法降级，css不支持0.5px的显示
*5 每次调用钉钉方法建议放在 dd.ready 内， dd.error配合使用，dd.error等同于promise的catch回调
*6 建议：版本更新需要在后台工作台设置对应OA应用设置首页地址更改版本hash值
  （原因更新后部分手机打开会是空白页，考虑是钉钉对历史设置地址具有缓存问题）


## 方法
-1 ddSetTitle    设置钉钉头部导航栏标题
-2 clear_dd_Right     清除导航左侧按钮
-3 dd_hideBar     清除容器导航栏    该方法对于单页面应用首次进入调用即可，多页面应用则需要每个页面进入都需调用一遍，原因是安卓浏览器容器不兼容
-4 saveFile    previewImage图片预览，saveFile钉盘上传
-5 cspacePreview    预览对应id的钉盘文件
-6 selectMans     通讯录人员选择
```

## jsapi鉴权
```
node sever.js 本地服务，打开http://localhost:8080/dingding_demo.html，
getJsToken获取jsapi鉴权结果，服务器已调用两次钉钉接口得到鉴权信息，鉴权签名与信息在客户端再进行config，
其中当前页面的url必须保证带上  '/'且不需要#后面的数据,dd.config的加密比对会自动把当前应用的url 加上 '/'
```

### node.js 鉴权部分
```node.js
	let corpid = ''; // 企业钉钉ID
	let corpsecret = ''; // // 企业钉钉密钥
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
```

### html调用/getJsToken接口，进行dd.config
```javascript
	function getJsToken () {
	    var prams_url = location.href.replace(/\#.+?/, '');
	    loadXMLDoc("/getJsToken?url=" + prams_url + '&appid=' + baseData.appId,function(data){
	        // signature: '', 必填，生成的加密签名
	        // var plainTex = "jsapi_ticket=" + ticket + "&noncestr=" + nonceStr + "&timestamp=" + timeStamp + "&url=" + url
	        // CryptoJS.SHA1(plainTex).toString()  服务器中加密生成signature，

	        // 设置dd.config， 添加jsApiList
	        data = JSON.parse(data)
	        let json = data.config;
	        baseData.corpId = json.corpId;
	        json.jsApiList = [ // 写入使用并需要鉴权的api名字
	            'biz.user.get',
	            'device.geolocation.get',
	            'biz.contact.complexPicker',
	            'biz.util.uploadImage',
	            'biz.user.get'
	        ];
	        dd.config(json);
	        dd.error(function(err) {
	          alert('dd error: ' + JSON.stringify(err));
	        });
	    })
	}
```
