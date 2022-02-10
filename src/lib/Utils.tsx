

function BuildTreeFromPaths(paths: string[]) {
    let result = [];
    let level = {result}
    paths.forEach(path => {
        path.split('/').reduce((r, name, i, a) => {
            if(!r[name]) {
                r[name] = {result: []};
                // @ts-ignore
                r.result.push({name, children: r[name].result})
            }

            return r[name];
        }, level)
    })

    return result;
}

export { BuildTreeFromPaths }