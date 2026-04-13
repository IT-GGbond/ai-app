const express = require('express')
const app = express();
const port = 8080;
const config = require('./config');

// 解决跨域
const cors = require('cors')
app.use(cors())

// 使用sdk
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: config.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// 同步读取上下文
const fs = require('fs')
const innerPrompt = fs.readFileSync('./doc/prompt.md').toString();

// 缓存上下文
// 不足：1. 没有存到远程数据库，服务停止就清空
//      2. 要加上用户信息和身份验证
let messageList = [
    {
        role: 'system',
        content: innerPrompt,
    },
]

// 接口定义
app.get('/llm', async (req, res) => {
    // req具体参考：https://expressjs.com/zh-cn/5x/api.html#req，
    // req对象是Node自己的请求对象的增强版本，支持所有内置字段和方法。
    console.log(req.query.content);

    // 缓存对话历史
    messageList.push({
        role: 'user',
        content: req.query.content,
    })
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-plus',
        messages: messageList,
    });
    // 缓存对话历史
    if(llmRes) {
        messageList.push(llmRes.choices[0].message);
    }
    
    res.json({code: 200, data: llmRes.choices[0].message, mes: '成功'});
});

app.listen(port, () => {
    console.log(`服务已经启动${port}`, config.DASHSCOPE_API_KEY);
});

// 请求测试 -- 成功
// const axios = require('axios')
// axios.post('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', 
//     {
//         model: 'qwen3.6-plus',
//         messages: [
//             {
//                 role: 'user',
//                 content: '你是谁',
//             },
//         ]
//     },
//     {
//         headers: {
//             Authorization: `Bearer${config.DASHSCOPE_API_KEY}`,
//         }
//     }).then((res) => console.log(res.data))