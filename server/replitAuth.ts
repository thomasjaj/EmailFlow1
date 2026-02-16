import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as LocalStrategy } from "passport-local";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";
import { storage } from "./storage";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "muhamedhajaj@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "19940804";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash || !user.passwordSalt) {
            return done(null, false, { message: "Invalid credentials" });
          }
          const hashed = hashPassword(password, user.passwordSalt);
          const matches = timingSafeEqual(
            Buffer.from(hashed, "hex"),
            Buffer.from(user.passwordHash, "hex"),
          );
          if (!matches) {
            return done(null, false, { message: "Invalid credentials" });
          }
          if (!user.isApproved) {
            return done(null, false, { message: "Account pending approval" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: number, cb) => {
    try {
      const user = await storage.getUser(id);
      cb(null, user || null);
    } catch (error) {
      cb(error);
    }
  });

  await ensureAdminAccount();
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

async function ensureAdminAccount() {
  const existing = await storage.getUserByEmail(ADMIN_EMAIL);
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(ADMIN_PASSWORD, salt);
  if (existing) {
    await storage.updateUserByEmail(ADMIN_EMAIL, {
      firstName: existing.firstName || "Muhamed",
      lastName: existing.lastName || "Admin",
      profileImageUrl: existing.profileImageUrl || "",
      passwordHash,
      passwordSalt: salt,
      role: "admin",
      isApproved: true,
    });
    return;
  }
  await storage.createUser({
    email: ADMIN_EMAIL,
    firstName: "Muhamed",
    lastName: "Admin",
    profileImageUrl: "",
    passwordHash,
    passwordSalt: salt,
    role: "admin",
    isApproved: true,
  });
}
