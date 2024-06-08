import fs from 'fs'
import path from 'path'

const dest_dir = '.\\songs_out\\'

let is = {}
const dirs = fs.readdirSync(dest_dir)
for (let file of dirs) {
    const filePath = path.join(dest_dir, file)
    const fileStat = fs.statSync(filePath)
    is[file] = 0
    if (fileStat.isDirectory) {
        fs.readdirSync(filePath).forEach(() => {
            console.log(`* Counting in ${file}: ${++ is[file]}`)
        })
    }
}
console.table(is)
