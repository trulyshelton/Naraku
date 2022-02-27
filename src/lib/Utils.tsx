
function BuildTreeFromObjects(objs: object[]) {
    let result = [];
    let level = {result}
    objs.forEach(obj => {
        // @ts-ignore
        obj.Key.split('/').reduce((r, name, i, a) => {
            if(!r[name]) {
                r[name] = {result: []};
                // @ts-ignore
                r.result.push(a.length !== i+1 ? {name, children: r[name].result} : {name, ...obj})
            }

            return r[name];
        }, level)
    })
    return result;
}

export { BuildTreeFromObjects }