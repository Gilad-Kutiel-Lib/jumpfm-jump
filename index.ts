import { JumpFm } from 'jumpfm-api'
import { JumpDb } from './JumpDb'

import * as fs from 'fs-extra'
import * as fuzzy from 'fuzzy'

export const load = (jumpFm: JumpFm) => {
    const jumpDb = new JumpDb(
        jumpFm.root,
        jumpFm.settings.getNum('jumpMaxDbSize', 300),
        jumpFm.settings.getNum('jumpDbSaveInterval', 5)
    )


    jumpFm.panels.forEach(panel =>
        panel.onCd(() => {
            jumpDb.visit(panel.getUrl().path)
        })
    )

    jumpFm.bind('jump', ['j'], () =>
        jumpFm.dialog.open({
            label: 'Jump'
            , onAccept: (val: string, sug) => {
                jumpFm.getPanelActive().cd(sug.value)
            }
            , suggest: (val: string) => {
                console.log('suggesting')
                const files = jumpDb.db.filter(file => fs.existsSync(file))
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
            , onOpen: input => input.select()
        })
    )
}


