import config from './config.js'
import fetch from 'node-fetch'
import fs from 'fs'

let list = {}, k = 0, page = 1
let proc_loaded = false, page_loded = false
const paths = {
    'headers': './tools/headers/output.json',
    'list': './data/list.json',
    'proc': './data/proc.json',
    'src': './data/src.json',
}
const urls = {
    index: 'https://www.myfreemp3.com.cn/',
}
const headers = JSON.parse(fs.readFileSync(paths.headers, 'utf-8'))

function sleep(int) {
    return new Promise(resolve => setTimeout(resolve, int))
}

function format_singer(str) {
    return str.replace(/\s/g, '').replace(/&/g, ',').toLowerCase()
}
function has_singer(list, goal) {
    return format_singer(list).split(',').indexOf(format_singer(goal)) >= 0
}
function load_list() {
    try {
        list = JSON.parse(fs.readFileSync(paths.list, 'utf-8'))
    }
    catch {}
}
function save_list() {
    fs.writeFileSync(paths.list, JSON.stringify(list))
}
function load_proc() {
    try {
        ({ k, page } = JSON.parse(fs.readFileSync(paths.proc, 'utf-8')))
        proc_loaded = true
    }
    catch {}
}
function save_proc() {
    fs.writeFileSync(paths.proc, JSON.stringify({ k, page }))
}
function reset_page() {
    if (proc_loaded && ! page_loded)
        page_loded = true
    else
        page = 1
}
async function que_page(name, singer, list, page) {
    const go = async () => {
        const json = await (
            await fetch(
                urls.index,
                {
                    method: 'POST',
                    headers: headers,
                    body: `input=${name}&filter=name&page=${page}&type=netease`
                }
            )
        ).text()
        console.log(json)
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
        save_list()
        save_proc()
        console.log(`- Querying: ${name} (${i} left)`)
        return i
    }
    let tries = config.tries_times
    while (true) {
        try { return await go() }
        catch {
            if (-- tries < 0)
                throw new Error(`Failed 5 times while querying: ${name}`)
            console.log(`- Failed but trying: ${name} (${tries} left)`)
            await sleep(config.tries_interval)
        }
    }
}
async function que_singer(name, singer, list) {
    while (await que_page(name, singer, list, page ++) > 0);
}
async function que_song(name, singer, list) {
    let i = 0
    while (i < config.song_que_times && await que_page(name, singer, list, page ++) > 0);
}
async function main() {
    try {
        const src_list = JSON.parse(fs.readFileSync(paths.src, 'utf-8'))
        load_list()
        if (! list[config.folder_others])
            list[config.folder_others] = {}
        load_proc()
        for (; k < src_list.length; k ++) {
            const v = src_list[k]
            if (v.type == 'singer') {
                if (! list[v.name])
                    list[v.name] = {}
                reset_page()
                await que_singer(v.name, v.name, list[v.name])
            }
            else if (v.type == 'song') {
                if (! list[config.folder_others][v.name])
                    list[config.folder_others][v.name] = {}
                reset_page()
                await que_song(v.name, null || v.singer, list[config.folder_others][v.name])
            }
        }
        console.log('* Success!')
    }
    catch (err) {
        throw new Error(`in main process: ${err}`)
    }
}

await main()
