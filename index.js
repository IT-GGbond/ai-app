const express = require('express')
const app = express();
const port = 8080;
const config = require('./config');

// 使用sdk
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: config.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// 接口定义
app.get('/llm', async (req, res) => {
    // req具体参考：https://expressjs.com/zh-cn/5x/api.html#req，
    // req对象是Node自己的请求对象的增强版本，支持所有内置字段和方法。
    console.log(req.query.content);
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-flash',
        messages: [
            {
                role: 'user',
                content: req.query.content,
            }
        ],
    });
    
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