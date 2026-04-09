## 服务器启动
- 接口导入cors app.use(cors) ？？

## 大模型接口sdk
- 如何抓包这个接口？
axios 能抓到但 SDK 抓不到，可能是OpenAI Node SDK（你这个版本）底层更偏向 fetch/undici 这套实现，设置 HTTPS_PROXY不生效。
试试控制台打印或者后续再看吧