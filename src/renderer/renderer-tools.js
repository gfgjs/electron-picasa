export const ipcCmdOnce = (ipcRenderer, cmd = {}) => {
    return new Promise(resolve => {
        cmd.id = Date.now() + '-' + Math.random()
        ipcRenderer.send("fsio-cmd", cmd);
        // 为了防止可能出现的异步多次reply，给channel加上id
        ipcRenderer.once("fsio-reply" + cmd.id, (e, arg) => {
            resolve({ e, arg })
        });
    })

    // 页面f5刷新后，刷新前的ipcRenender.on销毁了吗？
}