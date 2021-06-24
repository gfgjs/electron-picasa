import { parentPort, workerData } from 'worker_threads'
// console.log(require('/Users/gf/Desktop/epicasa-next/node_modules/sharp'))
console.log(process.env.NODE_ENV)
const sharp = require(process.env.NODE_ENV === 'development'
    ? '/Users/gf/Desktop/epicasa-next/node_modules/sharp'
    : 'sharp')
console.log(sharp)

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', () => {
    port.postMessage(`hello ${workerData}`)
})
