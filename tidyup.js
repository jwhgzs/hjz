import fs from 'fs'
import path from 'path'
import parser from 'id3-parser'
const parse = parser.default

const authors_dict = {
    '凛': '初音ミク'
}
const authors = `Bruno Mars
Charlie Puth
Fall Out Boy
Maroon 5
One Direction
OneRepublic
The Chainsmokers
The Script
初音ミク
Rammstein
M2M
ZABO
Two Steps From Hell
Avril Lavigne
Avicii
Linkin Park
Sia
Alec Benjamin
Imagine Dragons
Justin Bieber
Alessia Cara
Ed Sheeran
Pentatonix
米津玄師`.split('\n')

const dir = '.\\songs\\'
const dest_dir = '.\\songs_out\\'
const others_name = '.\\其他\\'
const files = fs.readdirSync(dir)

function parse_author(artist) {
    artist = artist.split('/')
    for (let v of artist) {
        v = authors_dict[v] || v
        if (authors.includes(v))
            return v
    }
    return null
}
if (! fs.existsSync(path.join(dest_dir, others_name)))
    fs.mkdirSync(path.join(dest_dir, others_name))
files.forEach(file => {
    const filePath = path.join(dir, file)
    const tags = parse(fs.readFileSync(filePath))
    const author = parse_author(tags.artist)
    if (author) {
        if (! fs.existsSync(path.join(dest_dir, author)))
            fs.mkdirSync(path.join(dest_dir, author))
        fs.copyFileSync(filePath, path.join(dest_dir, author, `${tags.title} - ${tags.artist.replace(/\//g, ',')}`) + '.mp3')
    }
    else {
        fs.copyFileSync(filePath, path.join(dest_dir, others_name, `${tags.title} - ${tags.artist.replace(/\//g, ',')}`) + '.mp3')
    }
    console.log('* Success: ' + file)
})
