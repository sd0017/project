import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, firstName, lastName, role: 'citizen' });

  const token = signToken({ id: user._id.toString(), role: user.role });
  const userObj = user.toObject();
  delete (userObj as any).passwordHash;

  res.json({ token, user: userObj });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user._id.toString(), role: user.role });
  const userObj = user.toObject();
  delete (userObj as any).passwordHash;

  res.json({ token, user: userObj });
}

// Government login: allow special credentials (matches frontend mock)
export async function governmentLogin(req: Request, res: Response) {
  const { employeeId, password } = req.body;
  if (employeeId === 'GOV001' && password === 'password123') {
    let user = await User.findOne({ employeeId });
    if (!user) {
      user = await User.create({ email: 'government@disaster.gov.in', role: 'government', employeeId, firstName: 'Government', lastName: 'Official' } as any);
    }
    const token = signToken({ id: user._id.toString(), role: user.role });
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    return res.json({ token, user: userObj });
  }

  res.status(401).json({ error: 'Invalid government credentials' });
}

export async function rescueCenterLogin(req: Request, res: Response) {
  const { centerId, password } = req.body;
  if (centerId === 'RC001' && password === 'rescue123') {
    let user = await User.findOne({ centerId });
    if (!user) {
      user = await User.create({ email: 'center@rescue.gov.in', role: 'rescue-center', centerId, firstName: 'Rescue', lastName: 'Center' } as any);
    }
    const token = signToken({ id: user._id.toString(), role: user.role });
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    return res.json({ token, user: userObj });
  }
  res.status(401).json({ error: 'Invalid rescue center credentials' });
}

export async function me(req: Request, res: Response) {
  // This endpoint expects middleware to set req.user
  const anyReq: any = req as any;
  if (!anyReq.user || !anyReq.user.id) return res.status(401).json({ error: 'No session' });

  const user = await User.findById(anyReq.user.id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  delete (user as any).passwordHash;
  res.json(user);
}
