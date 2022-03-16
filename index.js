const { util, wire: { Question, types } } = require('bns')
const base32 = require('bs32')
const blake3 = require('blake3')

module.exports = () => ({
  hostname: ':data.:protocol(_aliasing|aliasing).:gateway?.', 
  handler
})

async function handler ({ data, protocol }, name, type, res, rc, ns) {
  const dataLabels = data.split('.')
  const hip5data = dataLabels[0]
  
  if (name.indexOf(protocol) > 0) {
    return null
  }

  // todo: handle resolution of parent domain

  // compute alias
  const nameLabels = name.split('.')
  const count = ns.name.split('.').length
  const sldLabel = nameLabels[nameLabels.length-(count+1)]
  const alias = util.fqdn(base32.encode(blake3.hash(sldLabel+hip5data)))
  const nameAlias = name.replace(sldLabel+'.'+ns.name, alias)

  // query alias
  let response
  try {
    response = await this.lookup(nameAlias, types[type])
  } catch (err) {
    return null
  }
  response.answer = response.answer.map(answer => {
    answer.name = name 
    return answer
  })
  response.authority = response.authority.map(answer => {
    answer.name = name 
    return answer
  })

  return response
}
