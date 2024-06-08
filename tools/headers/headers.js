import fs from 'fs'

function is_name_ok(name) {
    if (name.startsWith(':'))
        return false
    if (name.toLowerCase() == 'Content-Length'.toLowerCase())
        return false
    return true
}
function format_name(name) {
    return name.replace(/\s/g, '').replace(/:$/g, '')
}
function format_val(val) {
    return val.replace(/[\r\n]/g, '')
}

const res = {}
let raw = fs.readFileSync('./input.txt', 'utf-8').split('\n')
for (let i = 0; i < raw.length; i += 2) {
    raw[i] = format_name(raw[i])
    if (is_name_ok(raw[i]))
        res[raw[i]] = format_val(raw[i + 1])
}
fs.writeFileSync('./output.json', JSON.stringify(res))
