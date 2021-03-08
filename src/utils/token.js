let token = ''

exports.setToken = (newToken) => {
  token = newToken
}

exports.getToken = () => {
  return token
}
