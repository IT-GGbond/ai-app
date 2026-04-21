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