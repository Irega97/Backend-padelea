import User, { IUser } from '../models/user';
import { Strategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import config from '../config/config';
import passport from 'passport';

const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret
};

export default new Strategy(opts, async (payload, next) => {
    try{
        const user = await User.findById(payload.id);
        if(user){
            console.log("PASSPORT DEVUELVE: ", user.toJSON());
            return next(null, user);
        }
        console.log('Hay un error');
        return next(null, false);
    } catch (error) {
        console.log(error);
    }
});

//GOOGLE OAUTH
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(
    new GoogleStrategy({
        clientID: config.google.CLIENT_ID,
        clientSecret: config.google.CLIENT_SECRET,
        callbackURL: '/auth/google/redirect'
    }, (accessToken: any, refreshToken: any, profile: { _json: any }, done: (arg0: null, arg1: IUser) => void) => {
        // passport callback function
        //check if user already exists in our db with the given profile ID
        console.log("PROFILE: ", profile);
        User.findOne({googleId: profile._json.sub}).then((currentUser)=>{
          if(currentUser){
            //if we already have a record with the given profile ID
            done(null, currentUser);
          } else{
               //if not, create a new user 
              new User({
                //PONER LOS DEMAS CAMPOS
                name: profile._json.name,
                image: profile._json.picture,
                email: profile._json.email,
                googleId: profile._json.sub
              }).save().then((newUser) =>{
                console.log("newUser: ", newUser);
                done(null, newUser);
              });
           } 
        })
      })
  );

passport.serializeUser((user: IUser, done) => {
done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
      done(null, user);
    });
  });