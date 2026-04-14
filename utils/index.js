// 压缩上下文
async function compressMessage(openai, compressList) {
    const llmRes = await openai.chat.completions.create({
        model: 'qwen-plus',
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

module.exports = {
    compressMessage,
};