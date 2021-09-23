const https = require('https');
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');

const cookieSession = require('cookie-session');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

require('dotenv').config();
const config = require('./config');
const { checkUserLoggedin } = require('./middlewares');

const PORT = 3000;

const AUTH_OPTIONS = {
    callbackURL: '/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET
};

function verifyCallback(accessToken, refreshToken, profile, done) {
    console.log('Google profile ', profile);
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback)); 
//save the session to the cookie
passport.serializeUser((user, done) => {
    done(null, user.id);
});
//read the session from the cookie
passport.deserializeUser((id, done) => {
    done(null, id);
});

const app = express();

app.use(helmet());
//client side session
app.use(cookieSession({
    name: 'session',
    maxAge: 48*60*60*1000,
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ]
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google', 
    passport.authenticate('google', {
        scope: ['email']
    })
);

app.get('/auth/google/callback', 
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: true
    }), 
    (req, res) => {
    console.log('Google called us back!');
});

app.get('/auth/logout', (req, res) => {
    req.logout();
    return res.redirect('/');
});

app.get('/failure', (req, res) => {
    res.status(401).send('Failure while logging in');
});

app.get('/secret', checkUserLoggedin, (req, res) => {
    res.send('Our secret is 42');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app).listen(PORT, () => {
    console.log(`listening on https://localhost:${PORT}`);
});