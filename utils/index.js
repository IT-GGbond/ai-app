const fs = require("fs")
// db定义
const sessionDB = './db/sessionList.json'

// 压缩上下文
async function compressMessage(openai, compressList) {
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-flash',
        messages: [
            {
                role: 'system',
                content: '总结下面的对话记录，做一个摘要',
            },
            ...compressList
        ],
    });
    return llmRes.choices[0].message;
}

// 生成标题
async function generateTitle(openai, content) {
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-flash',
        messages: [
            {
                role: 'system',
                content: '总结下面的文字，生成一个20个字以内的精简标题',
            },
            {
                role: 'user',
                content,
            }
        ],
    });
    return llmRes.choices[0].message.content;
}

// 读取文件数据
function readSessionObj() {
    const jsonStr = fs.readFileSync(sessionDB).toString();
    return JSON.parse(jsonStr);
}

// 写入数据到文件
function writeSessionObj(obj) {
    const jsonStr = JSON.stringify(obj);
    fs.writeFileSync(sessionDB, jsonStr);
}

module.exports = {
    compressMessage,
    generateTitle,
    readSessionObj,
    writeSessionObj,
};