"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.governmentLogin = governmentLogin;
exports.rescueCenterLogin = rescueCenterLogin;
exports.me = me;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const SALT_ROUNDS = 10;
async function register(req, res) {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
    const existing = await User_1.User.findOne({ email });
    if (existing)
        return res.status(400).json({ error: 'User already exists' });
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const user = await User_1.User.create({ email, passwordHash, firstName, lastName, role: 'citizen' });
    const token = (0, jwt_1.signToken)({ id: user._id.toString(), role: user.role });
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ token, user: userObj });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
    const user = await User_1.User.findOne({ email });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = user.passwordHash ? await bcrypt_1.default.compare(password, user.passwordHash) : false;
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = (0, jwt_1.signToken)({ id: user._id.toString(), role: user.role });
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ token, user: userObj });
}
// Government login: allow special credentials (matches frontend mock)
async function governmentLogin(req, res) {
    const { employeeId, password } = req.body;
    if (employeeId === 'GOV001' && password === 'password123') {
        let user = await User_1.User.findOne({ employeeId });
        if (!user) {
            user = await User_1.User.create({ email: 'government@disaster.gov.in', role: 'government', employeeId, firstName: 'Government', lastName: 'Official' });
        }
        const token = (0, jwt_1.signToken)({ id: user._id.toString(), role: user.role });
        const userObj = user.toObject();
        delete userObj.passwordHash;
        return res.json({ token, user: userObj });
    }
    res.status(401).json({ error: 'Invalid government credentials' });
}
async function rescueCenterLogin(req, res) {
    const { centerId, password } = req.body;
    if (centerId === 'RC001' && password === 'rescue123') {
        let user = await User_1.User.findOne({ centerId });
        if (!user) {
            user = await User_1.User.create({ email: 'center@rescue.gov.in', role: 'rescue-center', centerId, firstName: 'Rescue', lastName: 'Center' });
        }
        const token = (0, jwt_1.signToken)({ id: user._id.toString(), role: user.role });
        const userObj = user.toObject();
        delete userObj.passwordHash;
        return res.json({ token, user: userObj });
    }
    res.status(401).json({ error: 'Invalid rescue center credentials' });
}
async function me(req, res) {
    // This endpoint expects middleware to set req.user
    const anyReq = req;
    if (!anyReq.user || !anyReq.user.id)
        return res.status(401).json({ error: 'No session' });
    const user = await User_1.User.findById(anyReq.user.id).lean();
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    delete user.passwordHash;
    res.json(user);
}
