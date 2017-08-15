import { JumpFm } from 'jumpfm-api'

import { JumpDb } from './JumpDb'

import * as fs from 'fs-extra'
import * as fuzzy from 'fuzzy'


class JumpDialog {
    label = 'Jump'
    jumpFm: JumpFm
    jumpDb

    constructor(jumpFm) {
        this.jumpFm = jumpFm
        const getNum = jumpFm.settings.getNum

        this.jumpDb = new JumpDb(
            jumpFm.root,
            getNum('jumpMaxDbSize', 300),
            getNum('jumpDbSaveInterval', 5)
        )
    }

    onPanelCd = (url) => {
        this.jumpDb.visit(url.path)
    }

    onChange = (val: string) => {
        const files = this.jumpDb.db.filter(file => fs.existsSync(file))
        const pattern = val.replace(/\s/, '')
        const options = { pre: '<b>', post: '</b>' }

        return fuzzy
            .filter(pattern, files, options)
            .sort((a, b) => (b.score - a.score) || (a.index - b.index))
            .splice(0, 12)
            .map(res => {
                return {
                    value: res.original as string,
                    html: res.string
                }
            })
    }

    onAccept = (val: string, sug) => {
        this.jumpFm.getActivePanel().cd(sug.value)
    }
}

export const load = (jumpFm) => {
    const jumpDialog = new JumpDialog(jumpFm)

    jumpFm.panels.forEach(panel => panel.listen(jumpDialog))
    jumpFm.bindKeys('jump', ['j'], () =>
        jumpFm.dialog.open(jumpDialog)).filterMode([])
}


