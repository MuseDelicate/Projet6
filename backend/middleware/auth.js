const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // les erreurs passeront dans le bloc 'catch'
    try {
        // on récupère le token dans le header Authorization, qui est après le mot 'Bearer'
        const token = req.headers.authorization.split(' ')[1];
        // on vérifie le token et récupère le userId
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
        // on passe à l'exécution de la suite de la requête
        next();
    } catch (error) {
        res.status(401).json({ error });
    }
};