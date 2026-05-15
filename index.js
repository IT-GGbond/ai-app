const express = require('express')
const app = express();
const port = 8080;
const config = require('./config');
const { compressMessage, readSessionObj, writeSessionObj, generateTitle } = require('./utils');

// 解决跨域
const cors = require('cors')
app.use(cors())
// 添加 JSON 解析中间件
// 这行代码会让 Express 自动解析 Content-Type 为 application/json (含 charset) 的请求体
// 否则直接访问req.body输出为 undefined
app.use(express.json())

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
// 最大上下文容量
const maxCount = 10;

// 接口定义
app.get('/llm', async (req, res) => {
    // req具体参考：https://expressjs.com/zh-cn/5x/api.html#req，
    // req对象是Node自己的请求对象的增强版本，支持所有内置字段和方法。
    console.log(req.query.content);

    // 压缩上下文
    if (messageList.length > maxCount) {
        const compressList = messageList.splice(1, Math.floor(maxCount / 2));
        const compressRes = await compressMessage(openai, compressList);
        messageList.splice(1, 0, compressRes);
    }

    // 缓存对话历史
    messageList.push({
        role: 'user',
        content: req.query.content,
    })
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-flash',
        messages: messageList,
        stream: true,
    });
    console.log(llmRes);
    // 缓存对话历史
    if (llmRes) {
        messageList.push(llmRes.choices[0].message);
    }

    res.json({ code: 200, data: llmRes.choices[0].message, mes: '成功' });
});

// 业务接口重定义--数据存在sessionList.json
// 1. 获取大模型的聊天接口 / llmNew | 改为post，可以传token进行身份校验，userid，sessionid，流式传输SSE(后续再改进，补充llmSSE)！！！
// 2. 创建新对话 / session / create | 传userid，返回新的sessionid --不需要了
// 3. 获取当前会话记录 / session / detail | 传sessionid，返回当前聊天记录
// 4. 获取当前用户会话列表 / session / list | 传userid, 返回用户的sessionid和title列表
// 5. 为当前会话创建标题 / session / title | 传sessionid, 返回标题
app.post('/llmNew', async (req, res) => {
    // 1. 读取content字段
    let { content, sessionId, userId } = req.body;
    // 2. 获取当前id的会话记录
    let sessionList = readSessionObj()
    if (!sessionId) {
        // 创建新对话
        // 生成标题
        const title = content.length > 20 ? await generateTitle(openai, content) : content;
        sessionId = userId + Date.now();
        sessionList[userId][sessionId] = {
            title: title,
            messageList: [
                {
                    role: 'system',
                    content: innerPrompt,
                }
            ]
        }
    }
    // 3. 压缩上下文
    let messageList = sessionList[userId][sessionId].messageList;
    if (messageList.length > maxCount) {
        const compressList = messageList.splice(1, Math.floor(maxCount / 2));
        const compressRes = await compressMessage(openai, compressList);
        messageList.splice(1, 0, compressRes);
    }
    // 4. 添加用户对话
    messageList.push({
        role: 'user',
        content: content,
    })

    // 4. 调用大模型
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-flash',
        messages: messageList,
        // stream: true, // 流式传输
    });
    // 5. 拼接输出到数据库
    messageList.push(llmRes.choices[0].message);

    // 6. 修改响应头，流式返回(待完善)
    // 过滤内置system再返回
    // 返回所有的聊天记录而不是一条？？
    res.json({ code: 200, data: messageList.filter(item => item.role !== 'system'), message: '' });

    // 7. 写入db
    writeSessionObj(sessionList);
})

// 大模型流式传输,get请求，前端通过eventSource 这个web api来接收
app.post('/llmSSE', async (req, res) => {
    let { content, userId, sessionId } = req.body;
    console.log(req.body);
    let sessionList = readSessionObj()
    if (!sessionId) {
        // 创建新对话
        // 生成标题
        const title = content.length > 20 ? await generateTitle(openai, content) : content;
        sessionId = userId + Date.now();
        sessionList[userId][sessionId] = {
            title: title,
            messageList: [
                {
                    role: 'system',
                    content: innerPrompt,
                }
            ]
        }
    }
    // 3. 压缩上下文
    let messageList = sessionList[userId][sessionId].messageList;
    if (messageList.length > maxCount) {
        const compressList = messageList.splice(1, Math.floor(maxCount / 2));
        const compressRes = await compressMessage(openai, compressList);
        messageList.splice(1, 0, compressRes);
    }
    // 4. 添加用户对话
    messageList.push({
        role: 'user',
        content: content,
    })

    // 5. 调用大模型
    const llmRes = await openai.chat.completions.create({
        model: 'qwen3.6-flash',
        messages: messageList,
        stream: true, // 流式传输
    });

    // 6. 修改响应头，流式返回
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
    })

    // 7. 拼接输出到对象，流式传输
    // 使用res.write和res.end
    // 改为流式传输之后的返回的对象是异步可迭代对象，并且每个对象的字段变了，message变成delta
    // console.log(llmRes); 
    // Stream {   
    //  iterator: [AsyncGeneratorFunction: iterator],
    //  controller: AbortController { signal: AbortSignal { aborted: false } }
    // }
    // 流式传输出来的内容是异步可迭代对象，用for await of遍历
    let assistantMessage = {
        role: 'assistant',
        id: '',
        content: '',
    }
    for await (let chunk of llmRes) {
        // console.log(chunk.choices[0].delta);
        assistantMessage.id = chunk.id; // 是否需要id
        // 只在存在内容时才拼接和返回
        if (chunk.choices[0].delta.content) {
            assistantMessage.content += chunk.choices[0].delta.content;
            // 直接返回拼接后的，后端维护独一份
            // 流式传输，必须遵循 SSE 的固定格式: "data: xxx \n\n"
            res.write(`data: ${JSON.stringify(assistantMessage)}\n\n`);
        }
    }
    // 流式传输结束：向前端发送特定结束标志
    res.write('data: [DONE]\n\n');
    res.end();

    // 添加拼接后的数据
    messageList.push(assistantMessage);

    // 8. 写入db
    writeSessionObj(sessionList);
})

// 接口已弃用
app.get('/session/create', (req, res) => {
    // 1. 根据传来的userid创建sessionid, userid+时间戳
    const { userId } = req.query;
    const sessionId = userId + Date.now();
    const sessionList = readSessionObj();
    // console.log(sessionId);
    // console.log(sessionList);
    // console.log(sessionList[userId])
    sessionList[userId][sessionId] = {
        title: '',
        messageList: []
    }

    // 2. 写入db
    writeSessionObj(sessionList);
    res.json({ code: 200, data: sessionId, message: '创建成功' });

    // 3. 读取/写入失败的错误返回
})

app.get('/session/detail', (req, res) => {
    console.log('获取详情');
    // 1. 根据userid和sessionId查找
    const { userId, sessionId } = req.query;
    const sessionList = readSessionObj();
    const detail = sessionList[userId][sessionId].messageList;
    // 2. 返回当前对话详情
    if (detail) {
        res.json({ code: 200, data: detail.filter(item => item.role !== 'system'), message: '' });
    } else {
        res.json({ code: 20002, data: '', message: '该对话不存在' });
    }
})

app.get('/session/list', (req, res) => {
    // 1.根据userid获取
    const { userId } = req.query;
    const sessionList = readSessionObj();
    const mylist = sessionList[userId];
    console.log(mylist);

    // 2. 只需要返回对应的title和id即可
    const result = Object.keys(mylist).map(sessionId => ({
        sessionId,
        title: mylist[sessionId].title,
    }))

    res.json({ code: 200, data: result, message: '' })
})


// 测试接口
app.get('/get', (req, res) => {
    setTimeout(() => {
        res.json({ data: '你好' })
    }, 2000)
})

app.post('/post', (req, res) => {
    console.log(req.body);
    res.setHeader('Content-Type', 'application/json')
    res.json({ data: `你好呀${req.body.name}` });
})
app.listen(port, () => {
    console.log(`服务已经启动${port}`);
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