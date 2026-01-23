import { Router, Response } from 'express';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q } = req.query;

        let searchCriteria = {};
        if (q && typeof q === 'string' && q.trim().length > 0) {
            searchCriteria = {
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(searchCriteria)
            .select('name email avatar_url role')
            .limit(10);

        res.json({ success: true, users });
    } catch (error: any) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error searching users' });
    }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (tech_admin)
router.get(
    '/',
    roleCheck(['admin']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const users = await User.find().select('-password');
            res.json({ success: true, users });
        } catch (error: any) {
            console.error('Get users error:', error);
            res.status(500).json({ message: 'Server error fetching users' });
        }
    }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ success: true, user });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error fetching user' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Users can only update their own profile unless they're admin
        if (req.user!._id.toString() !== req.params.id && req.user!.role !== 'admin') {
            res.status(403).json({ message: 'Not authorized to update this user' });
            return;
        }

        const { password, role, ...updateData } = req.body;

        // Don't allow password or role updates through this route
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ success: true, user });
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error updating user' });
    }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (tech_admin)
router.put(
    '/:id/role',
    roleCheck(['admin']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { role } = req.body;

            if (!role) {
                res.status(400).json({ message: 'Please provide a role' });
                return;
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { role },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json({ success: true, user });
        } catch (error: any) {
            console.error('Update user role error:', error);
            res.status(500).json({ message: 'Server error updating user role' });
        }
    }
);

// @route   POST /api/users
// @desc    Create new user (admin/dept_head)
// @access  Private (tech_admin, department_head)
router.post(
    '/',
    roleCheck(['admin']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { name, email, password, department, role } = req.body;

            // Validation
            if (!name || !email || !password || !department) {
                res.status(400).json({ message: 'Please provide all required fields' });
                return;
            }

            // Check if user already exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                res.status(400).json({ message: 'User already exists with this email' });
                return;
            }

            // Create user
            const user = await User.create({
                name,
                email,
                password,
                department,
                role: role || 'user',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            });

            res.status(201).json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    avatar_url: user.avatar_url,
                },
            });
        } catch (error: any) {
            console.error('Create user error:', error);
            res.status(500).json({ message: 'Server error creating user' });
        }
    }
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (tech_admin, department_head)
router.delete(
    '/:id',
    roleCheck(['admin']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            // Prevent deleting self
            if (req.user!._id.toString() === req.params.id) {
                res.status(400).json({ message: 'Cannot delete your own account' });
                return;
            }

            const user = await User.findByIdAndDelete(req.params.id);

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json({ success: true, message: 'User deleted' });
        } catch (error: any) {
            console.error('Delete user error:', error);
            res.status(500).json({ message: 'Server error deleting user' });
        }
    }
);

export default router;
