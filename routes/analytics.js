router.use('/<routename>', verifyAuthToken)
// can access the charity by doing req.charity 

function verifyAuthToken(req, res, next) {
    const tokenStr = req.headers['authorization']
    if (tokenStr) {
        const authToken = tokenStr.split(' ')[1]
        jwt.verify(authToken, secretKey, (err, charity) => {
            if (err) {
              return res.sendStatus(403)
            } 
            req.charity = charity
            next() 
          })
    } else {
        return res.sendStatus(403)
    }
}
