const { util, wire: { Question, types } } = require('bns')
const base32 = require('bs32')
const blake3 = require('blake3')

module.exports = () => ({
  hostname: ':data.:protocol(_aliasing).:gateway?.', 
  handler
})

async function handler ({ data, protocol }, name, type) {
  const dataLabels = data.split('.')
  const hip5data = dataLabels[0]
  
  if (name.indexOf(protocol) > 0) {
    return null
  }

  // todo: handle resolution of parent domain

  // compute alias
  const nameLabels = name.split('.')
  const sldLabel = nameLabels[0]
  const alias = util.fqdn(base32.encode(blake3.hash(sldLabel+hip5data)))

  // query alias
  let response
  try {
    response = await this.lookup(alias, types[type])
  } catch (err) {
    return null
  }
  // response.question = question
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
