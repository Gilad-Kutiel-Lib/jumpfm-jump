import * as fs from 'fs-extra';
import * as homedir from 'homedir';
import * as path from 'path';

const isHidden = (fullPath: string) => path.basename(fullPath).indexOf('.') == 0

function readDirFullPath(dirFullPath: string): string[] {
    try {
        return fs.readdirSync(dirFullPath)
            .map(file =>
                path.join(dirFullPath, file)
            ).filter(fullPath =>
                !isHidden(fullPath) &&
                fs.existsSync(fullPath) &&
                fs.statSync(fullPath).isDirectory()
            )
    } catch (e) {
        console.log(e)
        return []
    }
}

function bfs(dirFullPath: string, sizeLimit: number): string[] {
    const res: string[] = []
    const q: string[] = []

    q.push(dirFullPath)

    while (res.length < sizeLimit && q.length > 0) {
        const dirFullPath = q.shift()
        res.push(dirFullPath)
        q.push.apply(q, readDirFullPath(dirFullPath))
    }

    return res
}

export class JumpDb {
    readonly dbMaxSize
    readonly saveInterval
    readonly dbFullPath
    readonly db: string[]
    visitCount = 0

    constructor(root: string, dbMaxSize: number, saveInterval: number) {
        this.dbFullPath = path.join(root, 'jumps.json')
        this.dbMaxSize = dbMaxSize
        this.saveInterval = saveInterval
        this.db = this.loadDb()
    }

    private loadDb = () => {
        if (fs.existsSync(this.dbFullPath))
            return require(this.dbFullPath)
        const db =
            bfs(homedir(), this.dbMaxSize * 2 / 3)
                .concat(bfs(path.parse(homedir()).root, this.dbMaxSize * 1 / 3))
        fs.writeFileSync(this.dbFullPath, JSON.stringify(db))
        return db;
    }

    private saveDb = () => {
        fs.truncateSync(this.dbFullPath);
        fs.writeFileSync(this.dbFullPath, JSON.stringify(this.db));
    }

    visit = (dirFullPath: string): void => {
        this.db.splice(this.db.indexOf(dirFullPath), 1)
        this.db.splice(this.dbMaxSize)
        this.db.unshift(dirFullPath)

        if (this.visitCount++ % this.saveInterval) return
        this.saveDb();
    };
}