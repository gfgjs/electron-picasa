export function add(a: number, b: number) {
    return a + b
}

export const hashCode = (str: string) => {
    return hashCode1(str)
    // .toString()
}
function hashCode1(str: string) {
    str = str || ''
    let hash = 0,
        i,
        char
    const length = str.length
    if (length === 0) return hash
    for (i = 0; i < length; i++) {
        char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash |= 0 // Convert to 32bit integer
    }
    return hash
}
function hashCode3(str: string) {
    str = str || ''
    var hash = 0,
        i,
        char
    const length = str.length
    if (length === 0) return hash
    for (i = 0; i < length; i++) {
        char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }
    return hash
}
function hashCode2(str: string) {
    var I64BIT_TABLE =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split(
            ''
        )
    var hash = 5381
    var i = str.length - 1
    if (typeof str == 'string') {
        for (; i > -1; i--) hash += (hash << 5) + str.charCodeAt(i)
    } else {
        for (; i > -1; i--) hash += (hash << 5) + str[i]
    }
    var value = hash & 0x7fffffff
    var retValue = ''
    do {
        retValue += I64BIT_TABLE[value & 0x3f]
    } while ((value >>= 6))
    return retValue
}

function hashCode4(str: string) {
    if (!!Array.prototype.reduce) {
        return str.split('').reduce(function (a, b) {
            a = (a << 5) - a + b.charCodeAt(0)
            return a & a
        }, 0)
    }
    var hash = 0
    if (str.length === 0) return hash
    for (var i = 0; i < str.length; i++) {
        var character = str.charCodeAt(i)
        hash = (hash << 5) - hash + character
        hash = hash & hash // Convert to 32bit integer
    }
    return hash
}
