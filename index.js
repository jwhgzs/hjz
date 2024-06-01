import config from './config'
import fetch from 'node-fetch'
import fs from 'fs'

const urls = {
    que_index: 'https://www.myfreemp3.com.cn/'
}
const headers = JSON.parse('{"Accept":"*/*","Accept-Encoding":"gzip, deflate, br, zstd","Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","Cookie":"UM_distinctid=18fd205034fa8-08cd0f20351d0f-26001c51-146d15-18fd20503504cb; CNZZDATA1281319036=472317582-1717215495-%7C1717219977","Origin":"https://www.myfreemp3.com.cn","Priority":"u=1, i","Sec-Ch-Ua":"\\"Google Chrome\\";v=\\"125\\", \\"Chromium\\";v=\\"125\\", \\"Not.A/Brand\\";v=\\"24\\"","Sec-Ch-Ua-Mobile":"?0","Sec-Ch-Ua-Platform":"\\"Windows\\"","Sec-Fetch-Dest":"empty","Sec-Fetch-Mode":"cors","Sec-Fetch-Site":"same-origin","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36","X-Requested-With":"XMLHttpRequest"}')

function format_singer(str) {
    return str.replace(/\s/g, '').replace(/&/g, ',').toLowerCase()
}
function has_singer(list, goal) {
    return format_singer(list).split(',').indexOf(format_singer(goal)) >= 0
}
async function que_page(name, singer, list, page) {
    try {
        const json = await (
            await fetch(
                urls.que_index,
                {
                    method: 'POST',
                    headers: headers,
                    body: `input=${name}&filter=name&page=${page}&type=netease`
                }
            )
        ).json()
        if (! json) throw new Error
        if (! json.data) throw new Error
        if (! json.data.list) throw new Error
        for (let v of json.data.list) {
            if (! singer || has_singer(v.author, singer)) {
                if (! (v.title in list) || v.author.length <= list[v.title][0].length) {
                    list[v.title] = [v.author, v.url]
                }
            }
        }
        const i = (+ json.data.total) / (+ json.data.more) - page
        console.log(`- Querying: ${name} (${i} left)`)
        return i
    }
    catch {
        throw new Error(`Error while querying: ${name}`)
    }
}
async function que_singer(name, singer, list) {
    let i = 1
    while (await que_page(name, singer, list, i ++) > 0);
}
async function que_song(name, singer, list) {
    let i = 1
    while (i < config.song_que_times && await que_page(name, singer, list, i ++) > 0);
}
async function main() {
    try {
        const src_list = JSON.parse(fs.readFileSync('./data/src.json', 'utf-8'))
        const list = JSON.parse(fs.readFileSync('./data/list.json', 'utf-8'))
        list[config.folder_others] = {}
        for (let k = 0; k < src_list.length; k ++) {
            const v = src_list[k]
            if (v.type == 'singer') {
                list[v.name] = {}
                await que_singer(v.name, v.name, list[v.name])
            }
            else if (v.type == 'song') {
                list[config.folder_others][v.name] = {}
                await que_song(v.name, null || v.singer, list[config.folder_others][v.name])
            }
            fs.writeFileSync('./data/list.json', JSON.stringify(list))
        }
        console.log('* Success!')
    }
    catch (err) {
        throw new Error(`[Error] in main process: ${err}`)
    }
}

await main()
