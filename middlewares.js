function checkUserLoggedin(req, res, next) {
    console.log("Current user ",req.user);
    const isLoggedIn = req.isAuthenticated() && req.user;
    if(!isLoggedIn) {
        return res.status(401).json({error: 'You need to Login First'})
    }
    next();
};

module.exports = {
    checkUserLoggedin
};