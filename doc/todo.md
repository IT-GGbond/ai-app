## 服务器启动
- 接口导入cors app.use(cors()) , 解决跨域问题
- app.use(cors(corsOptions)); 允许自定义跨域规则
- 这个跨域解决的原理是什么？

## 大模型接口sdk
- 如何抓包这个接口？
axios 能抓到但 SDK 抓不到，可能是OpenAI Node SDK（你这个版本）底层更偏向 fetch/undici 这套实现，设置 HTTPS_PROXY不生效。
试试控制台打印或者后续再看吧

## 上下文压缩

## 接口定义 && 数据类型定义 && 数据库存储-使用json
1. 获取大模型的聊天接口 /llm          |改为post，可以传token进行身份校验，userid，sessionid，流式传输SSE！！！
2. 创建新对话 /session/create        |传userid，返回新的sessionid
3. 获取当前会话记录 /session/detail   |传sessionid，返回当前聊天记录
4. 获取当前用户会话列表 /session/list |传userid, 返回用户的sessionid和title列表
5. 为当前会话创建标题  /session/title |传sessionid, 返回标题


## 接口改进，流式传输
1. 现在获取当前会话详情传输的是整个列表, llmNew把新的回复push进去，传的也是整个列表
2. llmSSE传的是拼接后的一条完整回复，如果使用这个接口，前端的聊天记录渲染逻辑应该要变了，
    前面的聊天列表不用状态管理，一刷新就先获取/detail，发送聊天就push进去
这样是否可行？前端性能优化，push进去之后要重新setState, 局部更新dom？？这个和react的虚拟dom和diff算法有关了，无论我们返回的是全部的聊天记录还是一条，都要setState更新。
3. ！！这个react的更新涉及到一些问题，要等一个函数执行完成之后再setState，无法做到实时更新页面数据，vue不会有这个问题，有待解决。

## SSE踩坑
1. 一旦服务端使用 res.end() 切断了连接（或因为网络抖动断开），客户端会自动发起重连（默认3秒后）。
解决办法：后端在数据流完结的最后，向前端发送一个专门的结束标识（通常大家默认用 [DONE] 字符），前端捕捉到该标识后，立即显式调用 event.close() 并停止连接，打破内置的自动重连机制。
2. SSE (Server-Sent Events) 数据流严格要求数据结构必须以 data: 开头，并以 \n\n （两个换行符）结尾。如果不遵循这个格式，浏览器的 EventSource.onmessage 就无法正常解析。
解决办法：将后端的写操作改成标准格式，比如：res.write(`data: ${数据}\n\n`)。